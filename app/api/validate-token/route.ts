import { type NextRequest, NextResponse } from "next/server"
import { RedisRateLimit } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 })
    }

    // Validate token in Redis and get target content UUID
    const tokenData = await RedisRateLimit.validateAccessToken(accessToken)

    if (!tokenData.valid) {
      return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: "Token is valid",
      targetContentUuid: tokenData.targetContentUuid,
    })
  } catch (error) {
    console.error("Error validating access token:", error)
    return NextResponse.json({ error: "Failed to validate access token" }, { status: 500 })
  }
}
