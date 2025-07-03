import nodemailer from "nodemailer"

// SMTP configuration interface
interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// Predefined SMTP configurations for popular providers
export const SMTP_PROVIDERS = {
  gmail: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
  },
  zoho: {
    host: "smtp.zoho.com",
    port: 587,
    secure: false,
  },
  outlook: {
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
  },
  yahoo: {
    host: "smtp.mail.yahoo.com",
    port: 587,
    secure: false,
  },
  custom: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
  },
} as const

// Email template for verification code
export const createVerificationEmailHTML = (code: string, email: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            color: #e2e8f0;
            margin: 10px 0 0 0;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .verification-code {
            background-color: #f1f5f9;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            padding: 30px;
            margin: 30px 0;
            display: inline-block;
        }
        .code {
            font-size: 36px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 0;
        }
        .code-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 1px;
        }
        .instructions {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
            border-radius: 0 8px 8px 0;
        }
        .instructions h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .instructions p {
            color: #78350f;
            margin: 0;
            font-size: 14px;
        }
        .security-notice {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
        }
        .security-notice h3 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 16px;
            display: flex;
            align-items: center;
        }
        .security-notice p {
            color: #7f1d1d;
            margin: 0;
            font-size: 14px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            color: #64748b;
            margin: 0;
            font-size: 14px;
        }
        .timer {
            background-color: #dbeafe;
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .timer p {
            color: #1e40af;
            margin: 0;
            font-weight: 600;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 10px;
            }
            .header, .content, .footer {
                padding: 20px;
            }
            .code {
                font-size: 28px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <h1>🔐 Verification Required</h1>
                <p>Your secure access code is ready</p>
            </div>
            
            <div class="content">
                <p>Hello,</p>
                <p>You've requested access to our secure content. Please use the verification code below to complete your authentication:</p>
                
                <div class="verification-code">
                    <div class="code-label">Your Verification Code</div>
                    <div class="code">${code}</div>
                </div>
                
                <div class="timer">
                    <p>⏰ This code expires in 5 minutes</p>
                </div>
                
                <div class="instructions">
                    <h3>📋 Instructions:</h3>
                    <p>1. Return to the verification page<br>
                    2. Enter the 5-digit code above<br>
                    3. Click "Verify Code" to access the protected content</p>
                </div>
                
                <div class="security-notice">
                    <h3>🛡️ Security Notice</h3>
                    <p><strong>Never share this code with anyone.</strong> Our team will never ask for your verification code via phone, email, or any other method. If you didn't request this code, please ignore this email.</p>
                </div>
                
                <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                    If you're having trouble with verification, please contact our support team.
                </p>
            </div>
            
            <div class="footer">
                <p>This email was sent to <strong>${email}</strong></p>
                <p>© 2024 Secure Verification System. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `
}

// Plain text version for email clients that don't support HTML
export const createVerificationEmailText = (code: string, email: string) => {
  return `
VERIFICATION CODE REQUIRED

Hello,

You've requested access to our secure content. Please use the verification code below to complete your authentication:

VERIFICATION CODE: ${code}

IMPORTANT: This code expires in 5 minutes.

INSTRUCTIONS:
1. Return to the verification page
2. Enter the 5-digit code above
3. Click "Verify Code" to access the protected content

SECURITY NOTICE:
Never share this code with anyone. Our team will never ask for your verification code via phone, email, or any other method. If you didn't request this code, please ignore this email.

This email was sent to ${email}

© 2024 Secure Verification System. All rights reserved.
  `
}

// SMTP Email service class
export class SMTPEmailService {
  private transporter: nodemailer.Transporter
  private fromEmail: string
  private fromName: string

  constructor(provider: keyof typeof SMTP_PROVIDERS = "custom") {
    const smtpConfig = SMTP_PROVIDERS[provider]

    // Get credentials from environment variables
    const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD

    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP credentials not found. Please set SMTP_USER and SMTP_PASS environment variables.")
    }

    this.fromEmail = smtpUser
    this.fromName = process.env.SMTP_FROM_NAME || "Secure Verification System"

    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      debug: process.env.NODE_ENV === "development",
      logger: process.env.NODE_ENV === "development",
    })
  }

  // Test SMTP connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.transporter.verify()
      return { success: true }
    } catch (error: any) {
      console.error("SMTP connection test failed:", error)
      return {
        success: false,
        error: error.message || "SMTP connection failed",
      }
    }
  }

  // Send verification code email
  async sendVerificationCode(
    email: string,
    code: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const htmlContent = createVerificationEmailHTML(code, email)
      const textContent = createVerificationEmailText(code, email)

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: `🔐 Your Verification Code: ${code}`,
        html: htmlContent,
        text: textContent,
        priority: "high" as const,
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          Importance: "high",
        },
      }

      const info = await this.transporter.sendMail(mailOptions)

      console.log(`Verification email sent successfully to ${email}`)
      console.log("Message ID:", info.messageId)

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error: any) {
      console.error("Failed to send verification email:", error)
      return {
        success: false,
        error: error.message || "Failed to send email",
      }
    }
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail(email: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f8fafc;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px; 
                }
                .email-wrapper {
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header { 
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                .header p {
                    margin: 10px 0 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                }
                .content { 
                    background: white; 
                    padding: 40px 30px; 
                }
                .content p {
                    margin: 0 0 15px 0;
                    font-size: 16px;
                }
                .footer { 
                    background: #f8fafc; 
                    padding: 30px; 
                    text-align: center; 
                    border-top: 1px solid #e2e8f0;
                }
                .footer p {
                    margin: 0;
                    color: #64748b;
                    font-size: 14px;
                }
                .success-badge {
                    background-color: #dcfce7;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }
                .success-badge p {
                    color: #166534;
                    margin: 0;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="email-wrapper">
                    <div class="header">
                        <h1>🎉 Welcome!</h1>
                        <p>Your verification was successful</p>
                    </div>
                    <div class="content">
                        <p>Congratulations! You have successfully verified your identity and gained access to our secure content.</p>
                        
                        <div class="success-badge">
                            <p>✅ Verification Complete - Access Granted</p>
                        </div>
                        
                        <p>Your access has been logged for security purposes. Thank you for using our secure verification system.</p>
                        <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent to <strong>${email}</strong></p>
                        <p>© 2024 Secure Verification System. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `

      const textContent = `
VERIFICATION SUCCESSFUL

Congratulations! You have successfully verified your identity and gained access to our secure content.

✅ Verification Complete - Access Granted

Your access has been logged for security purposes. Thank you for using our secure verification system.

If you have any questions or concerns, please don't hesitate to contact our support team.

This email was sent to ${email}

© 2024 Secure Verification System. All rights reserved.
      `

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: "✅ Verification Successful - Welcome!",
        html: htmlContent,
        text: textContent,
      }

      const info = await this.transporter.sendMail(mailOptions)

      console.log(`Welcome email sent successfully to ${email}`)
      console.log("Message ID:", info.messageId)

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error: any) {
      console.error("Failed to send welcome email:", error)
      return {
        success: false,
        error: error.message || "Failed to send email",
      }
    }
  }

  // Send custom email
  async sendCustomEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML if no text provided
      }

      const info = await this.transporter.sendMail(mailOptions)

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error: any) {
      console.error("Failed to send custom email:", error)
      return {
        success: false,
        error: error.message || "Failed to send email",
      }
    }
  }
}

export default SMTPEmailService
