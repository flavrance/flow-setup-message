import { type NextRequest, NextResponse } from "next/server"
import { SupabaseOperations } from "@/lib/supabase"
import { RedisRateLimit } from "@/lib/redis"

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
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 })
    }

    // Validate token in Redis
    const isValid = await RedisRateLimit.validateAccessToken(accessToken)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 })
    }

    // Get client information
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get("user-agent") || undefined

    // Extract session ID from access token (you might want to store this mapping in Redis)
    // For now, we'll try to find the session by looking for recent verified sessions
    // In a production app, you'd want to store the session ID with the access token

    const supabaseOps = new SupabaseOperations()

    // Record page view - we'll need to modify this to get the actual session ID
    // For now, we'll create a simplified tracking approach
    try {
      // This is a simplified approach - in production you'd want to properly link the access token to the session
      const result = await supabaseOps.recordPageView({
        sessionId: accessToken.substring(0, 16), // Use part of token as identifier
        ipAddress: clientIP,
        userAgent,
      })

      if (!result.success) {
        console.error("Failed to record page view:", result.error)
      }
    } catch (error) {
      console.error("Error recording page view:", error)
      // Don't fail the request if tracking fails
    }

    return NextResponse.json({ success: true, message: "Page view tracked" })
  } catch (error) {
    console.error("Error tracking page view:", error)
    return NextResponse.json({ error: "Failed to track page view" }, { status: 500 })
  }
}
