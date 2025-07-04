import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { SupabaseOperations } from "@/lib/supabase"
import { SMTPEmailService } from "@/lib/smtp-email"
import crypto from "crypto"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = new SupabaseOperations()

    // Get sender alias
    const aliasResult = await supabase.getSenderAliasById(params.id)
    if (!aliasResult.success || !aliasResult.data) {
      return NextResponse.json({ error: "Sender alias not found" }, { status: 404 })
    }

    const alias = aliasResult.data

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save verification token
    const tokenResult = await supabase.createVerificationToken(params.id, token, expiresAt)
    if (!tokenResult.success) {
      return NextResponse.json({ error: "Failed to create verification token" }, { status: 500 })
    }

    // Send verification email
    const emailService = new SMTPEmailService("custom")
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-alias?token=${token}&alias=${params.id}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Sender Alias</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Sender Alias</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Please verify your sender alias <strong>${alias.alias_email}</strong> by clicking the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Alias</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px;">${verificationUrl}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const sendResult = await emailService.sendCustomEmail(alias.alias_email, "Verify Your Sender Alias", htmlContent)

    if (!sendResult.success) {
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    })
  } catch (error) {
    console.error("Failed to send verification email:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
