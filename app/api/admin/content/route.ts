import { auth } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseOps = new SupabaseOperations()
    const result = await supabaseOps.getAllProtectedContent()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ content: result.data })
  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { uuid, title, content_html, expires_at, is_active } = data

    if (!uuid || !title || !content_html) {
      return NextResponse.json({ error: "UUID, title, and content_html are required" }, { status: 400 })
    }

    const supabaseOps = new SupabaseOperations()
    const result = await supabaseOps.createProtectedContent({
      uuid,
      title,
      contentHtml: content_html,
      expiresAt: expires_at || null,
      metadata: { created_by: userId, is_active: is_active ?? true },
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error creating content:", error)
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 })
  }
}
