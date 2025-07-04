import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = new SupabaseOperations()
    const result = await supabase.testEmailCredential(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Credential tested successfully",
      data: result.data,
    })
  } catch (error) {
    console.error("Failed to test credential:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
