export const runtime = "nodejs"

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

export async function GET(request: NextRequest, { params }: { params: { uuid: string } }) {
  try {
    const { uuid } = params
    const accessToken = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!accessToken) {
      return NextResponse.json({ error: "Access token required" }, { status: 401 })
    }

    // Validate access token in Redis
    const isValidToken = await RedisRateLimit.validateAccessToken(accessToken)
    if (!isValidToken) {
      return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 })
    }

    // Get content from Supabase
    const supabaseOps = new SupabaseOperations()
    const contentResult = await supabaseOps.getProtectedContent(uuid)

    if (!contentResult.success) {
      return NextResponse.json(
        { error: contentResult.error || "Content not found" },
        { status: contentResult.error === "Content not found" ? 404 : 500 },
      )
    }

    // Record content view
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get("user-agent") || undefined

    try {
      await supabaseOps.recordContentView({
        contentUuid: uuid,
        accessToken,
        ipAddress: clientIP,
        userAgent,
      })
    } catch (error) {
      console.error("Failed to record content view:", error)
      // Don't fail the request if tracking fails
    }

    return NextResponse.json({
      success: true,
      data: {
        uuid: contentResult.data!.uuid,
        title: contentResult.data!.title,
        content_html: contentResult.data!.content_html,
        created_at: contentResult.data!.created_at,
        view_count: contentResult.data!.view_count,
      },
    })
  } catch (error) {
    console.error("Error fetching protected content:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}
