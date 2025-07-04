import { type NextRequest, NextResponse } from "next/server"
import { SupabaseOperations } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingId = searchParams.get("id")

    if (!trackingId) {
      // Return a 1x1 transparent pixel even if tracking ID is missing
      return new NextResponse(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          "base64",
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    // Get client info
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || ""

    // Track the open
    const supabase = new SupabaseOperations()
    await supabase.trackEmailOpen({
      trackingId,
      ipAddress,
      userAgent,
    })

    // Return a 1x1 transparent pixel
    return new NextResponse(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Failed to track email open:", error)

    // Still return the pixel even if tracking fails
    return new NextResponse(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "base64",
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }
}
