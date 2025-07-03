export const runtime = "nodejs"
import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { RedisRateLimit, REDIS_KEYS } from "@/lib/redis"
import { SupabaseOperations } from "@/lib/supabase"
import SMTPEmailService from "@/lib/smtp-email"

// Rate limiting configuration
const RATE_LIMITS = {
  IP_REQUESTS_PER_WINDOW: 20, // 20 requests per IP
  IP_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  MAX_ATTEMPTS_PER_SESSION: 5, // 5 attempts per session
  SESSION_LOCK_DURATION: 15 * 60 * 1000, // 15 minutes lock after max attempts
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return "unknown"
}

export async function POST(request: NextRequest) {
  try {
    const { code, sessionId } = await request.json()

    if (!code || !sessionId) {
      return NextResponse.json({ error: "Code and session ID are required" }, { status: 400 })
    }

    const clientIP = getClientIP(request)

    // Check IP-based rate limit using Redis
    const ipRateLimitKey = REDIS_KEYS.IP_RATE_LIMIT + `validate:${clientIP}`
    const ipLimit = await RedisRateLimit.checkRateLimit(
      ipRateLimitKey,
      RATE_LIMITS.IP_REQUESTS_PER_WINDOW,
      RATE_LIMITS.IP_WINDOW_MS,
    )

    if (!ipLimit.allowed) {
      const resetTimeSeconds = Math.ceil((ipLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: "Too many validation attempts from this IP address",
          retryAfter: resetTimeSeconds,
          message: `Please wait ${Math.ceil(resetTimeSeconds / 60)} minutes before trying again`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetTimeSeconds.toString(),
            "X-RateLimit-Limit": RATE_LIMITS.IP_REQUESTS_PER_WINDOW.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": ipLimit.resetTime.toString(),
          },
        },
      )
    }

    // Check session-based attempts using Redis
    const sessionLimit = await RedisRateLimit.checkSessionAttempts(
      sessionId,
      RATE_LIMITS.MAX_ATTEMPTS_PER_SESSION,
      RATE_LIMITS.SESSION_LOCK_DURATION,
    )

    if (!sessionLimit.allowed) {
      const lockedUntilSeconds = sessionLimit.lockedUntil
        ? Math.ceil((sessionLimit.lockedUntil - Date.now()) / 1000)
        : 0

      return NextResponse.json(
        {
          error: "Too many failed attempts for this session",
          retryAfter: lockedUntilSeconds,
          message: `Session locked due to too many failed attempts. Please wait ${Math.ceil(lockedUntilSeconds / 60)} minutes or request a new verification code`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": lockedUntilSeconds.toString(),
          },
        },
      )
    }

    // Get verification data from Redis
    const verificationData = await RedisRateLimit.getVerificationCode(sessionId)

    if (!verificationData) {
      return NextResponse.json({ error: "Invalid session or code has expired" }, { status: 400 })
    }

    // Check if code has expired
    if (Date.now() > verificationData.expiresAt) {
      await RedisRateLimit.deleteVerificationCode(sessionId)
      await RedisRateLimit.deleteSessionAttempts(sessionId)
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 })
    }

    // Validate code
    if (code !== verificationData.code) {
      return NextResponse.json(
        {
          error: "Invalid verification code",
          attemptsRemaining: sessionLimit.attemptsRemaining,
          message:
            sessionLimit.attemptsRemaining > 0
              ? `Invalid code. ${sessionLimit.attemptsRemaining} attempts remaining`
              : "Invalid code. No attempts remaining",
        },
        { status: 400 },
      )
    }

    // Generate access token
    const accessToken = randomBytes(32).toString("hex")

    // Store access token in Redis with target content UUID and 1 hour expiration
    const tokenStored = await RedisRateLimit.storeAccessToken(accessToken, verificationData.targetContentUuid, 3600)

    if (!tokenStored) {
      return NextResponse.json({ error: "Failed to create access token" }, { status: 500 })
    }

    // Mark code as verified in Supabase
    const supabaseOps = new SupabaseOperations()
    const dbResult = await supabaseOps.markCodeVerified(sessionId)

    if (!dbResult.success) {
      console.error("Failed to mark code verified in database:", dbResult.error)
      // Continue anyway - the verification was successful
    }

    // Send welcome email using SMTP (don't fail the request if this fails)
    try {
      const emailService = new SMTPEmailService("custom")
      const welcomeResult = await emailService.sendWelcomeEmail(verificationData.email)

      if (welcomeResult.success) {
        console.log(`Welcome email sent to ${verificationData.email} (Message ID: ${welcomeResult.messageId})`)
      } else {
        console.error("Failed to send welcome email:", welcomeResult.error)
      }
    } catch (error) {
      console.error("Error sending welcome email:", error)
      // Don't fail the verification if welcome email fails
    }

    // Clean up verification data and attempts from Redis
    await Promise.all([
      RedisRateLimit.deleteVerificationCode(sessionId),
      RedisRateLimit.deleteSessionAttempts(sessionId),
    ])

    return NextResponse.json(
      {
        success: true,
        accessToken,
        targetContentUuid: verificationData.targetContentUuid,
        message: "Code verified successfully",
      },
      {
        headers: {
          "X-RateLimit-Limit": RATE_LIMITS.IP_REQUESTS_PER_WINDOW.toString(),
          "X-RateLimit-Remaining": ipLimit.remaining.toString(),
          "X-RateLimit-Reset": ipLimit.resetTime.toString(),
        },
      },
    )
  } catch (error) {
    console.error("Error validating verification code:", error)
    return NextResponse.json({ error: "Failed to validate verification code" }, { status: 500 })
  }
}
