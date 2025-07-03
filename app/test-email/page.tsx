"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, CheckCircle, AlertCircle, Settings } from "lucide-react"

interface SMTPProvider {
  name: string
  host: string
  port: number
  secure: boolean
}

interface SMTPConfig {
  providers: SMTPProvider[]
  environmentVariables: Record<string, boolean>
  recommendations: Record<string, { note: string; setup: string }>
}

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [provider, setProvider] = useState("custom")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null)
  const [smtpConfig, setSMTPConfig] = useState<SMTPConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)

  useEffect(() => {
    // Fetch SMTP configuration
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/smtp-config")
        if (response.ok) {
          const config = await response.json()
          setSMTPConfig(config)
        }
      } catch (error) {
        console.error("Failed to fetch SMTP config:", error)
      } finally {
        setConfigLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, provider }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          message: data.error || "Failed to send test email",
        })
        return
      }

      setResult({
        success: true,
        message: `Test email sent successfully via ${data.provider}! Message ID: ${data.messageId}`,
        messageId: data.messageId,
      })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading SMTP configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">SMTP Email Service Test</CardTitle>
            <CardDescription>Test your SMTP configuration with Gmail, Zoho, or custom providers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Test Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email to test"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">SMTP Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {smtpConfig?.providers.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.name.charAt(0).toUpperCase() + p.name.slice(1)} ({p.host}:{p.port})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {result && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className={result.success ? "text-green-800" : ""}>
                    {result.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending Test Email..." : "Send Test Email"}
              </Button>

              <div className="text-center text-sm text-gray-600 mt-4">
                <p>🧪 This will send a test verification email with code "12345"</p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* SMTP Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              SMTP Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Environment Variables</h3>
                <div className="space-y-2">
                  {smtpConfig &&
                    Object.entries(smtpConfig.environmentVariables).map(([key, isSet]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-mono">{key}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${isSet ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {isSet ? "Set" : "Missing"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Provider Recommendations</h3>
                <div className="space-y-3">
                  {smtpConfig &&
                    Object.entries(smtpConfig.recommendations).map(([provider, info]) => (
                      <div key={provider} className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 capitalize">{provider}</h4>
                        <p className="text-xs text-blue-700 mt-1">{info.note}</p>
                        <p className="text-xs text-blue-600 mt-1">{info.setup}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Required Environment Variables:</h3>
                <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
                  {`SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com (optional, defaults based on provider)
SMTP_PORT=587 (optional, defaults based on provider)
SMTP_SECURE=false (optional, defaults based on provider)
SMTP_FROM_NAME="Your App Name" (optional)`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold">Gmail Setup:</h3>
                <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                  <li>Enable 2-Factor Authentication on your Google account</li>
                  <li>Go to Google Account Settings → Security → App passwords</li>
                  <li>Generate an App Password for "Mail"</li>
                  <li>Use your Gmail address as SMTP_USER and the App Password as SMTP_PASS</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold">Zoho Mail Setup:</h3>
                <ol className="list-decimal list-inside text-sm space-y-1 mt-2">
                  <li>Use your Zoho Mail email address as SMTP_USER</li>
                  <li>Use your Zoho Mail password as SMTP_PASS</li>
                  <li>No additional setup required</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
