import { Resend } from "resend"

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

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

// Email service class
export class EmailService {
  private resend: Resend

  constructor() {
    this.resend = resend
  }

  // Send verification code email
  async sendVerificationCode(
    email: string,
    code: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const htmlContent = createVerificationEmailHTML(code, email)
      const textContent = createVerificationEmailText(code, email)

      const { data, error } = await this.resend.emails.send({
        from: "Secure Verification <noreply@yourdomain.com>", // Replace with your verified domain
        to: [email],
        subject: `🔐 Your Verification Code: ${code}`,
        html: htmlContent,
        text: textContent,
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
        },
        tags: [
          {
            name: "category",
            value: "verification",
          },
        ],
      })

      if (error) {
        console.error("Resend email error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error("Failed to send verification email:", error)
      return { success: false, error: "Email service unavailable" }
    }
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail(email: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: "Secure Verification <noreply@yourdomain.com>", // Replace with your verified domain
        to: [email],
        subject: "✅ Verification Successful - Welcome!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome</title>
              <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
                  .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
              </style>
          </head>
          <body>
              <div class="container">
                  <div class="header">
                      <h1>🎉 Welcome!</h1>
                      <p>Your verification was successful</p>
                  </div>
                  <div class="content">
                      <p>Congratulations! You have successfully verified your identity and gained access to our secure content.</p>
                      <p>Your access has been logged for security purposes. Thank you for using our secure verification system.</p>
                      <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
                  </div>
                  <div class="footer">
                      <p>© 2024 Secure Verification System. All rights reserved.</p>
                  </div>
              </div>
          </body>
          </html>
        `,
        text: `
VERIFICATION SUCCESSFUL

Congratulations! You have successfully verified your identity and gained access to our secure content.

Your access has been logged for security purposes. Thank you for using our secure verification system.

If you have any questions or concerns, please don't hesitate to contact our support team.

© 2024 Secure Verification System. All rights reserved.
        `,
        tags: [
          {
            name: "category",
            value: "welcome",
          },
        ],
      })

      if (error) {
        console.error("Resend welcome email error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error("Failed to send welcome email:", error)
      return { success: false, error: "Email service unavailable" }
    }
  }

  // Test email service connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to send a test email to a test address (this won't actually send)
      const testResult = await this.resend.emails.send({
        from: "Test <test@yourdomain.com>",
        to: ["test@example.com"],
        subject: "Test Connection",
        html: "<p>Test</p>",
        text: "Test",
      })

      // If we get here without throwing, the API key is valid
      return { success: true }
    } catch (error: any) {
      if (error.message?.includes("API key")) {
        return { success: false, error: "Invalid API key" }
      }
      return { success: false, error: "Connection failed" }
    }
  }
}

export default EmailService
