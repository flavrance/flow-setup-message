import { type NextRequest, NextResponse } from "next/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("cid")
    const trackingId = searchParams.get("tid")
    const originalUrl = searchParams.get("url")

    if (!originalUrl) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 })
    }

    // Get client info
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || ""

    // Track the click if we have tracking info
    if (campaignId && trackingId) {
      const supabase = new SupabaseOperations()
      await supabase.trackEmailClick({
        campaignId,
        trackingId,
        originalUrl,
        ipAddress,
        userAgent,
      })
    }

    // Redirect to the original URL
    return NextResponse.redirect(originalUrl)
  } catch (error) {
    console.error("Failed to track email click:", error)

    // Still redirect even if tracking fails
    const originalUrl = new URL(request.url).searchParams.get("url")
    if (originalUrl) {
      return NextResponse.redirect(originalUrl)
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
