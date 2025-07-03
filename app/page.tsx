"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Phone, CheckCircle, FileText } from "lucide-react"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [contentUuid, setContentUuid] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get UUID from URL parameters
    const uuid = searchParams.get("uuid")
    if (uuid) {
      setContentUuid(uuid)
      // Store UUID in session for the verification flow
      sessionStorage.setItem("target_content_uuid", uuid)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phone,
          targetContentUuid: contentUuid, // Pass the target UUID to the API
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited
          const retryAfter = data.retryAfter || 0
          const minutes = Math.ceil(retryAfter / 60)
          setError(data.message || `Rate limit exceeded. Please wait ${minutes} minutes before trying again.`)
        } else {
          throw new Error(data.error || "Failed to send verification code")
        }
        return
      }

      // Show success message
      setSuccess(`Verification code sent successfully to ${email}! Please check your inbox and spam folder.`)

      // Store session data and redirect after a short delay
      sessionStorage.setItem("verification_session", data.sessionId)

      setTimeout(() => {
        router.push("/verify")
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Verification Required</CardTitle>
          <CardDescription>
            Enter your email and phone number to receive a verification code
            {contentUuid && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Target Content: {contentUuid}</span>
                </div>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending Code..." : "Send Verification Code"}
            </Button>

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>📧 We'll send a verification code to your email</p>
              <p className="text-xs mt-1">Check your spam folder if you don't see it</p>
              {contentUuid && (
                <p className="text-xs mt-2 text-blue-600">
                  After verification, you'll be redirected to the requested content
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
