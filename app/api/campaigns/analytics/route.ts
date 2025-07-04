import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "30d"

    const supabaseOps = new SupabaseOperations()

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get analytics data
    const [campaignsResult, performanceResult, topLinksResult, engagementResult, topCampaigns] = await Promise.all([
      supabaseOps.getCampaignAnalytics(startDate, now),
      supabaseOps.getCampaignPerformanceOverTime(startDate, now),
      supabaseOps.getTopClickedLinks(startDate, now),
      supabaseOps.getEngagementByDay(startDate, now),
      supabaseOps.getTopCampaigns(startDate, now),
    ])

    if (!campaignsResult.success) {
      return NextResponse.json({ error: campaignsResult.error }, { status: 500 })
    }

    const analytics = {
      ...campaignsResult.data,
      performanceOverTime: performanceResult.data || [],
      topLinks: topLinksResult.data || [],
      engagementByDay: engagementResult.data || [],
      topCampaigns : topCampaigns.data || [],
      deviceStats: [
        { device: "Desktop", opens: 1250, clicks: 180 },
        { device: "Mobile", opens: 890, clicks: 120 },
        { device: "Tablet", opens: 340, clicks: 45 },
        { device: "Other", opens: 120, clicks: 15 },
      ],
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("Failed to fetch campaign analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
