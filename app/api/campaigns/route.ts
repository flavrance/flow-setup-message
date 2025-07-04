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
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = new SupabaseOperations()
    const result = await supabase.getCampaigns({ status, limit })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ campaigns: result.data })
  } catch (error) {
    console.error("Failed to get campaigns:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, subject, fromAliasId, htmlBody, recipients, scheduledAt } = body

    if (!title || !subject || !htmlBody || !recipients) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = new SupabaseOperations()
    const result = await supabase.createCampaign({
      title,
      subject,
      fromAliasId,
      htmlBody,
      recipients: Array.isArray(recipients) ? recipients : recipients.split("\n").filter(Boolean),
      scheduledAt,
      createdBy: userId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ campaign: result.data }, { status: 201 })
  } catch (error) {
    console.error("Failed to create campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
