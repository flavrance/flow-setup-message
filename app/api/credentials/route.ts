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
    const result = await supabase.getEmailCredentials()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ credentials: result.data })
  } catch (error) {
    console.error("Failed to get credentials:", error)
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
    const {
      aliasId,
      credentialName,
      providerType,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpUseTls,
      apiKey,
      apiEndpoint,
      isDefault,
    } = body

    if (!credentialName || !providerType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = new SupabaseOperations()
    const result = await supabase.createEmailCredential({
      aliasId,
      credentialName,
      providerType,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpUseTls,
      apiKey,
      apiEndpoint,
      isDefault,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ credential: result.data }, { status: 201 })
  } catch (error) {
    console.error("Failed to create credential:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
