// Ensure this route runs in a full Node.js environment (needed for nodemailer / dns)
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { RedisRateLimit, REDIS_KEYS } from "@/lib/redis"
import { SupabaseOperations } from "@/lib/supabase"
import SMTPEmailService from "@/lib/smtp-email"

// Rate limiting configuration
const RATE_LIMITS = {
  IP_REQUESTS_PER_WINDOW: 5, // 5 requests per IP
  IP_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  EMAIL_REQUESTS_PER_WINDOW: 1, // 1 request per email
  EMAIL_WINDOW_MS: 2 * 60 * 1000, // 2 minutes
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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation - adjust regex based on your requirements
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ""))
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone, targetContentUuid } = await request.json()

    if (!email || !phone) {
      return NextResponse.json({ error: "Email and phone number are required" }, { status: 400 })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 })
    }

    const clientIP = getClientIP(request)

    // Check IP-based rate limit using Redis
    const ipRateLimitKey = REDIS_KEYS.IP_RATE_LIMIT + clientIP
    const ipLimit = await RedisRateLimit.checkRateLimit(
      ipRateLimitKey,
      RATE_LIMITS.IP_REQUESTS_PER_WINDOW,
      RATE_LIMITS.IP_WINDOW_MS,
    )

    if (!ipLimit.allowed) {
      const resetTimeSeconds = Math.ceil((ipLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: "Too many requests from this IP address",
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

    // Check email-based rate limit using Redis
    const emailRateLimitKey = REDIS_KEYS.EMAIL_RATE_LIMIT + email.toLowerCase()
    const emailLimit = await RedisRateLimit.checkRateLimit(
      emailRateLimitKey,
      RATE_LIMITS.EMAIL_REQUESTS_PER_WINDOW,
      RATE_LIMITS.EMAIL_WINDOW_MS,
    )

    if (!emailLimit.allowed) {
      const resetTimeSeconds = Math.ceil((emailLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: "Too many requests for this email address",
          retryAfter: resetTimeSeconds,
          message: `Please wait ${Math.ceil(resetTimeSeconds / 60)} minutes before requesting another code for this email`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetTimeSeconds.toString(),
            "X-RateLimit-Limit": RATE_LIMITS.EMAIL_REQUESTS_PER_WINDOW.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": emailLimit.resetTime.toString(),
          },
        },
      )
    }

    // Generate random 5-digit code
    const code = Math.floor(10000 + Math.random() * 90000).toString()

    // Generate session ID
    const sessionId = randomBytes(32).toString("hex")

    // Set expiration to 5 minutes from now
    const expiresAt = Date.now() + 5 * 60 * 1000
    const ttlSeconds = Math.ceil(5 * 60) // 5 minutes

    // Store verification data in Redis (including target content UUID)
    const verificationData = {
      code,
      email,
      phone,
      expiresAt,
      targetContentUuid: targetContentUuid || null, // Store the target UUID
    }

    const stored = await RedisRateLimit.storeVerificationCode(sessionId, verificationData, ttlSeconds)

    if (!stored) {
      return NextResponse.json({ error: "Failed to store verification code" }, { status: 500 })
    }

    // Store user session data in Supabase
    const supabaseOps = new SupabaseOperations()
    const dbResult = await supabaseOps.createUserSession({
      ip_address: clientIP,
      email: email.toLowerCase(),
      phone_number: phone,
      session_id: sessionId,
    })

    if (!dbResult.success) {
      console.error("Failed to store user session in database:", dbResult.error)
      // Continue anyway - Redis verification will still work
    }

    // Send verification email using SMTP
    try {
      const emailService = new SMTPEmailService("custom") // Use custom SMTP config
      const emailResult = await emailService.sendVerificationCode(email, code)

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error)

        // Clean up stored data if email fails
        await RedisRateLimit.deleteVerificationCode(sessionId)

        return NextResponse.json(
          {
            error: "Failed to send verification email",
            message: "Please check your email address and try again. If the problem persists, contact support.",
            details: emailResult.error,
          },
          { status: 500 },
        )
      }

      console.log(`Verification email sent successfully to ${email} (Message ID: ${emailResult.messageId})`)

      return NextResponse.json(
        {
          success: true,
          sessionId,
          message: "Verification code sent successfully to your email",
          emailSent: true,
          targetContentUuid: targetContentUuid || null,
        },
        {
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.IP_REQUESTS_PER_WINDOW.toString(),
            "X-RateLimit-Remaining": ipLimit.remaining.toString(),
            "X-RateLimit-Reset": ipLimit.resetTime.toString(),
          },
        },
      )
    } catch (error: any) {
      console.error("SMTP Email service error:", error)

      // Clean up stored data if email service fails
      await RedisRateLimit.deleteVerificationCode(sessionId)

      return NextResponse.json(
        {
          error: "Email service unavailable",
          message: "Unable to send verification email. Please check your SMTP configuration.",
          details: error.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error generating verification code:", error)
    return NextResponse.json({ error: "Failed to generate verification code" }, { status: 500 })
  }
}
