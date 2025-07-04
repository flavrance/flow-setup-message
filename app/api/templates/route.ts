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
    const result = await supabase.getEmailTemplates()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ templates: result.data })
  } catch (error) {
    console.error("Failed to get templates:", error)
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
    const { name, description, htmlContent, category } = body

    if (!name || !htmlContent || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = new SupabaseOperations()
    const result = await supabase.createEmailTemplate({
      name,
      description,
      htmlContent,
      category,
      createdBy: userId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ template: result.data }, { status: 201 })
  } catch (error) {
    console.error("Failed to create template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
