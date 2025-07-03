"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText } from "lucide-react"

export default function VerifyPage() {
  const [codes, setCodes] = useState(["", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [targetContentUuid, setTargetContentUuid] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  useEffect(() => {
    // Check if user has a valid session
    const sessionId = sessionStorage.getItem("verification_session")
    const contentUuid = sessionStorage.getItem("target_content_uuid")

    if (!sessionId) {
      router.push("/")
      return
    }

    if (contentUuid) {
      setTargetContentUuid(contentUuid)
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setError("Verification code has expired. Please request a new one.")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit

    const newCodes = [...codes]
    newCodes[index] = value

    setCodes(newCodes)

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = codes.join("")

    if (code.length !== 5) {
      setError("Please enter all 5 digits")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const sessionId = sessionStorage.getItem("verification_session")
      const response = await fetch("/api/validate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, sessionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited or session locked
          const retryAfter = data.retryAfter || 0
          const minutes = Math.ceil(retryAfter / 60)
          setError(data.message || `Too many attempts. Please wait ${minutes} minutes.`)
          setAttemptsRemaining(0)
        } else {
          setError(data.error || "Invalid verification code")
          if (data.attemptsRemaining !== undefined) {
            setAttemptsRemaining(data.attemptsRemaining)
          }
        }
        return
      }

      // Store access token and redirect to protected content
      sessionStorage.setItem("access_token", data.accessToken)

      // Clean up session storage
      sessionStorage.removeItem("verification_session")

      // Redirect to target content or default
      const targetUuid = data.targetContentUuid || targetContentUuid || "sample-doc-001"
      sessionStorage.removeItem("target_content_uuid") // Clean up

      router.push(`/protected/${targetUuid}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Enter Verification Code</CardTitle>
          <CardDescription>
            We've sent a 5-digit code to your email. Enter it below.
            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <div className="text-orange-600 font-medium mt-1">{attemptsRemaining} attempts remaining</div>
            )}
            {targetContentUuid && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Target: {targetContentUuid}</span>
                </div>
              </div>
            )}
          </CardDescription>
          <div className="text-sm text-gray-600">
            Time remaining: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2">
              {codes.map((code, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={code}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold"
                  disabled={timeLeft === 0}
                />
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || timeLeft === 0}>
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <Button type="button" variant="outline" className="w-full bg-transparent" onClick={() => router.push("/")}>
              Back to Start
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
