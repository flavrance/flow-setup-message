import { NextResponse } from "next/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function GET() {
  try {
    const supabaseOps = new SupabaseOperations()
    const result = await supabaseOps.getAnalytics()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
