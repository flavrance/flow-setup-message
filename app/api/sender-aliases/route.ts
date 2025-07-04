import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = new SupabaseOperations()
    const result = await supabase.getSenderAliases()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ aliases: result.data })
  } catch (error) {
    console.error("Failed to get sender aliases:", error)
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
    const { realEmail, aliasEmail, aliasName } = body

    if (!realEmail || !aliasEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = new SupabaseOperations()
    const result = await supabase.createSenderAlias({
      realEmail,
      aliasEmail,
      aliasName,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ alias: result.data }, { status: 201 })
  } catch (error) {
    console.error("Failed to create sender alias:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
