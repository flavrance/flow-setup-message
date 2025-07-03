import { NextResponse } from "next/server"
import { SMTP_PROVIDERS } from "@/lib/smtp-email"

export async function GET() {
  try {
    // Return available SMTP providers and their configurations (without sensitive data)
    const providers = Object.entries(SMTP_PROVIDERS).map(([name, config]) => ({
      name,
      host: config.host,
      port: config.port,
      secure: config.secure,
    }))

    // Check which environment variables are set
    const envStatus = {
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_SECURE: !!process.env.SMTP_SECURE,
      SMTP_FROM_NAME: !!process.env.SMTP_FROM_NAME,
    }

    return NextResponse.json({
      success: true,
      providers,
      environmentVariables: envStatus,
      recommendations: {
        gmail: {
          note: "Use App Password, not regular password",
          setup: "Enable 2FA and generate App Password in Google Account settings",
        },
        zoho: {
          note: "Use your Zoho Mail password",
          setup: "Standard email credentials work",
        },
        outlook: {
          note: "May require App Password for some accounts",
          setup: "Check Microsoft account security settings",
        },
      },
    })
  } catch (error) {
    console.error("Error getting SMTP configuration:", error)
    return NextResponse.json({ error: "Failed to get SMTP configuration" }, { status: 500 })
  }
}
