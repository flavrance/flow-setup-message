import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { campaignSender } from "@/lib/campaign-sender"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await campaignSender.sendCampaign(params.id)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Campaign sending failed",
          details: result.errors,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Campaign sent successfully",
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
    })
  } catch (error) {
    console.error("Failed to send campaign:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
