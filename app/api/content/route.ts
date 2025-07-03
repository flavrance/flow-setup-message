export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { uuid, title, content_html, expires_at, metadata } = await request.json()

    if (!uuid || !title || !content_html) {
      return NextResponse.json({ error: "UUID, title, and content_html are required" }, { status: 400 })
    }

    const supabaseOps = new SupabaseOperations()
    const result = await supabaseOps.createProtectedContent({
      uuid,
      title,
      content_html,
      expires_at,
      metadata,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Protected content created successfully",
    })
  } catch (error) {
    console.error("Error creating protected content:", error)
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 })
  }
}
