import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseOps = new SupabaseOperations()
    const result = await supabaseOps.getAllPageViews()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error fetching page views:", error)
    return NextResponse.json({ error: "Failed to fetch page views" }, { status: 500 })
  }
}
