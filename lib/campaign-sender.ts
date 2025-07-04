import { SupabaseOperations } from "./supabase"
import { SMTPEmailService } from "./smtp-email"
import { decrypt } from "./supabase"
import nodemailer from "nodemailer"

export interface SendCampaignResult {
  success: boolean
  totalSent: number
  totalFailed: number
  errors: string[]
}

export class CampaignSender {
  private supabaseOps: SupabaseOperations

  constructor() {
    this.supabaseOps = new SupabaseOperations()
  }

  async sendCampaign(campaignId: string): Promise<SendCampaignResult> {
    try {
      // Get campaign details
      const campaignResult = await this.supabaseOps.getCampaignById(campaignId)
      if (!campaignResult.success || !campaignResult.data) {
        return {
          success: false,
          totalSent: 0,
          totalFailed: 0,
          errors: ["Campaign not found"],
        }
      }

      const campaign = campaignResult.data

      // Get sender alias and credentials
      let emailService: any = null
      if (campaign.from_alias_id) {
        const aliasResult = await this.supabaseOps.getSenderAliasById(campaign.from_alias_id)
        if (!aliasResult.success || !aliasResult.data) {
          return {
            success: false,
            totalSent: 0,
            totalFailed: 0,
            errors: ["Sender alias not found"],
          }
        }

        // Get email credentials for this alias
        const credentialsResult = await this.supabaseOps.getEmailCredentials()
        if (credentialsResult.success && credentialsResult.data) {
          const aliasCredentials = credentialsResult.data.find(
            (cred) => cred.alias_id === campaign.from_alias_id && cred.is_active,
          )

          if (aliasCredentials) {
            emailService = await this.createEmailService(aliasCredentials)
          }
        }
      }

      // Fallback to default SMTP service if no alias-specific credentials
      if (!emailService) {
        emailService = new SMTPEmailService("custom")
      }

      // Test email service connection
      const testResult = await emailService.testConnection()
      if (!testResult.success) {
        return {
          success: false,
          totalSent: 0,
          totalFailed: 0,
          errors: [`Email service connection failed: ${testResult.error}`],
        }
      }

      // Update campaign status to sending
      await this.supabaseOps.updateCampaign(campaignId, {
        status: "sending",
        sent_at: new Date().toISOString(),
      })

      // Send emails to recipients
      const results = await this.sendToRecipients(campaign, emailService)

      // Update campaign with final stats
      await this.supabaseOps.updateCampaign(campaignId, {
        status: results.totalFailed === 0 ? "sent" : "partially_sent",
        total_sent: results.totalSent,
        total_delivered: results.totalSent, // Will be updated by delivery webhooks
        updated_at: new Date().toISOString(),
      })

      return results
    } catch (error) {
      console.error("Failed to send campaign:", error)

      // Update campaign status to failed
      await this.supabaseOps.updateCampaign(campaignId, {
        status: "failed",
        updated_at: new Date().toISOString(),
      })

      return {
        success: false,
        totalSent: 0,
        totalFailed: 0,
        errors: [`Campaign sending failed: ${error}`],
      }
    }
  }

  private async createEmailService(credentials: any): Promise<any> {
    if (credentials.provider_type === "smtp") {
      // Create SMTP transporter
      const smtpPassword = credentials.smtp_password_encrypted ? decrypt(credentials.smtp_password_encrypted) : ""

      const transporter = nodemailer.createTransporter({
        host: credentials.smtp_host,
        port: credentials.smtp_port,
        secure: credentials.smtp_use_tls,
        auth: {
          user: credentials.smtp_username,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })

      return {
        testConnection: async () => {
          try {
            await transporter.verify()
            return { success: true }
          } catch (error: any) {
            return { success: false, error: error.message }
          }
        },
        sendEmail: async (to: string, subject: string, html: string, trackingId: string) => {
          try {
            // Add tracking pixel and click tracking
            const trackedHtml = this.addEmailTracking(html, trackingId)

            const info = await transporter.sendMail({
              from: `"${credentials.alias_name || "Campaign"}" <${credentials.smtp_username}>`,
              to,
              subject,
              html: trackedHtml,
              text: html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
            })

            return {
              success: true,
              messageId: info.messageId,
            }
          } catch (error: any) {
            return {
              success: false,
              error: error.message,
            }
          }
        },
      }
    } else {
      // Handle API-based providers (SendGrid, Mailgun, etc.)
      const apiKey = credentials.api_key_encrypted ? decrypt(credentials.api_key_encrypted) : ""

      return this.createApiEmailService(credentials.provider_type, apiKey, credentials)
    }
  }

  private createApiEmailService(providerType: string, apiKey: string, credentials: any) {
    switch (providerType) {
      case "sendgrid":
        return this.createSendGridService(apiKey, credentials)
      case "mailgun":
        return this.createMailgunService(apiKey, credentials)
      default:
        throw new Error(`Unsupported email provider: ${providerType}`)
    }
  }

  private createSendGridService(apiKey: string, credentials: any) {
    return {
      testConnection: async () => {
        try {
          const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          })
          return { success: response.ok }
        } catch (error: any) {
          return { success: false, error: error.message }
        }
      },
      sendEmail: async (to: string, subject: string, html: string, trackingId: string) => {
        try {
          const trackedHtml = this.addEmailTracking(html, trackingId)

          const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: to }] }],
              from: {
                email: credentials.smtp_username,
                name: credentials.alias_name || "Campaign",
              },
              subject,
              content: [
                { type: "text/html", value: trackedHtml },
                { type: "text/plain", value: html.replace(/<[^>]*>/g, "") },
              ],
              tracking_settings: {
                click_tracking: { enable: true },
                open_tracking: { enable: true },
              },
            }),
          })

          return {
            success: response.ok,
            messageId: response.headers.get("x-message-id"),
          }
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          }
        }
      },
    }
  }

  private createMailgunService(apiKey: string, credentials: any) {
    const domain = credentials.api_endpoint || "sandbox.mailgun.org"

    return {
      testConnection: async () => {
        try {
          const response = await fetch(`https://api.mailgun.net/v3/${domain}/stats/total`, {
            headers: {
              Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
            },
          })
          return { success: response.ok }
        } catch (error: any) {
          return { success: false, error: error.message }
        }
      },
      sendEmail: async (to: string, subject: string, html: string, trackingId: string) => {
        try {
          const trackedHtml = this.addEmailTracking(html, trackingId)

          const formData = new FormData()
          formData.append("from", `${credentials.alias_name || "Campaign"} <${credentials.smtp_username}>`)
          formData.append("to", to)
          formData.append("subject", subject)
          formData.append("html", trackedHtml)
          formData.append("text", html.replace(/<[^>]*>/g, ""))
          formData.append("o:tracking", "yes")
          formData.append("o:tracking-clicks", "yes")
          formData.append("o:tracking-opens", "yes")

          const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
            },
            body: formData,
          })

          const result = await response.json()
          return {
            success: response.ok,
            messageId: result.id,
          }
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
          }
        }
      },
    }
  }

  private async sendToRecipients(campaign: any, emailService: any): Promise<SendCampaignResult> {
    const results: SendCampaignResult = {
      success: true,
      totalSent: 0,
      totalFailed: 0,
      errors: [],
    }

    // Process recipients in batches to avoid overwhelming the email service
    const batchSize = 10
    const recipients = campaign.recipients || []

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (recipient: string) => {
          try {
            const trackingId = this.generateTrackingId()

            // Create campaign email record
            const emailRecord = await this.supabaseOps.createCampaignEmail({
              campaignId: campaign.id,
              recipientEmail: recipient,
              subject: campaign.subject,
              htmlBody: campaign.html_body,
              trackingId,
            })

            if (!emailRecord.success) {
              results.totalFailed++
              results.errors.push(`Failed to create email record for ${recipient}`)
              return
            }

            // Send the email
            const sendResult = await emailService.sendEmail(recipient, campaign.subject, campaign.html_body, trackingId)

            if (sendResult.success) {
              results.totalSent++

              // Update email record with sent status
              await this.supabaseOps.updateCampaignEmail(emailRecord.data!.id, {
                status: "sent",
                sent_at: new Date().toISOString(),
                message_id: sendResult.messageId,
              })
            } else {
              results.totalFailed++
              results.errors.push(`Failed to send to ${recipient}: ${sendResult.error}`)

              // Update email record with failed status
              await this.supabaseOps.updateCampaignEmail(emailRecord.data!.id, {
                status: "failed",
                error_message: sendResult.error,
              })
            }
          } catch (error) {
            results.totalFailed++
            results.errors.push(`Error processing ${recipient}: ${error}`)
          }
        }),
      )

      // Add delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    results.success = results.totalFailed === 0

    return results
  }

  private addEmailTracking(html: string, trackingId: string): string {
    // Add tracking pixel for open tracking
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/track/open?id=${trackingId}" width="1" height="1" style="display:none;" alt="" />`

    // Add click tracking to all links
    const trackedHtml = html.replace(/<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi, (match, attributes, url) => {
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/click?id=${trackingId}&url=${encodeURIComponent(url)}`
      return `<a ${attributes.replace(/href=["'][^"']+["']/, `href="${trackingUrl}"`)}>`
    })

    // Insert tracking pixel before closing body tag, or at the end if no body tag
    if (trackedHtml.includes("</body>")) {
      return trackedHtml.replace("</body>", `${trackingPixel}</body>`)
    } else {
      return trackedHtml + trackingPixel
    }
  }

  private generateTrackingId(): string {
    return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const campaignSender = new CampaignSender()
