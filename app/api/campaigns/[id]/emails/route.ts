import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = new SupabaseOperations()
    const result = await supabase.getCampaignEmails(params.id, { limit, offset })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ emails: result.data })
  } catch (error) {
    console.error("Failed to get campaign emails:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
