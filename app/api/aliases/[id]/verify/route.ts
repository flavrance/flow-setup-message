import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    const supabase = new SupabaseOperations()
    const result = await supabase.verifyAlias(params.id, token)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Alias verified successfully" })
  } catch (error) {
    console.error("Failed to verify alias:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
