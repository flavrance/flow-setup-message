export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import SMTPEmailService from "@/lib/smtp-email"

export async function POST(request: NextRequest) {
  try {
    const { email, provider = "custom" } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 })
    }

    // Test SMTP connection and send test email
    try {
      const emailService = new SMTPEmailService(provider as any)

      // Test connection first
      const connectionTest = await emailService.testConnection()
      if (!connectionTest.success) {
        return NextResponse.json(
          {
            error: "SMTP connection failed",
            details: connectionTest.error,
            suggestion: "Please check your SMTP configuration and credentials",
          },
          { status: 500 },
        )
      }

      // Send test verification email
      const testCode = "12345"
      const result = await emailService.sendVerificationCode(email, testCode)

      if (!result.success) {
        return NextResponse.json(
          {
            error: "Failed to send test email",
            details: result.error,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Test email sent successfully via SMTP",
        messageId: result.messageId,
        provider: provider,
      })
    } catch (error: any) {
      return NextResponse.json(
        {
          error: "SMTP service initialization failed",
          details: error.message,
          suggestion: "Please check your SMTP environment variables",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error testing SMTP email service:", error)
    return NextResponse.json({ error: "Email service test failed" }, { status: 500 })
  }
}
