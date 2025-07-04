"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, FileText, Calendar, Users, AlertTriangle } from "lucide-react"

interface ProtectedContentData {
  uuid: string
  title: string
  content_html: string
  created_at: string
  view_count: number
}

export default function ProtectedContentPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [content, setContent] = useState<ProtectedContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [accessDeniedReason, setAccessDeniedReason] = useState("")
  const router = useRouter()
  const params = useParams()
  const uuid = params.uuid as string

  useEffect(() => {
    const validateAndLoadContent = async () => {
      const accessToken = sessionStorage.getItem("access_token")
      if (!accessToken) {
        setError("No access token found")
        setAccessDeniedReason("Please complete the verification process first")
        setLoading(false)
        return
      }

      try {
        // Validate token first and get target UUID
        const tokenResponse = await fetch("/api/validate-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        })

        if (!tokenResponse.ok) {
          sessionStorage.removeItem("access_token")
          setError("Invalid or expired access token")
          setAccessDeniedReason("Your session has expired. Please verify again")
          setLoading(false)
          return
        }

        const tokenData = await tokenResponse.json()

        // Check if user is trying to access the correct content
        if (tokenData.targetContentUuid && tokenData.targetContentUuid !== uuid) {
          setError("Access denied to this content")
          setAccessDeniedReason(
            `You are authorized to access content: ${tokenData.targetContentUuid}, but trying to access: ${uuid}`,
          )
          setLoading(false)
          return
        }

        // Load content by UUID
        const contentResponse = await fetch(`/api/content/${uuid}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!contentResponse.ok) {
          const errorData = await contentResponse.json()
          setError(errorData.error || "Failed to load content")
          if (contentResponse.status === 404) {
            setAccessDeniedReason("The requested content does not exist or has been removed")
          } else if (contentResponse.status === 401) {
            setAccessDeniedReason("Your access token is not valid for this content")
          }
          setLoading(false)
          return
        }

        const contentData = await contentResponse.json()
        setContent(contentData.data)
        setIsAuthorized(true)
      } catch (error) {
        console.error("Error loading content:", error)
        setError("Failed to load content")
        setAccessDeniedReason("A technical error occurred while loading the content")
      } finally {
        setLoading(false)
      }

      // Apply security measures
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault()
        return false
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
          (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
          (e.ctrlKey && (e.key === "s" || e.key === "S")) ||
          (e.ctrlKey && (e.key === "a" || e.key === "A")) ||
          (e.ctrlKey && (e.key === "c" || e.key === "C")) ||
          (e.ctrlKey && (e.key === "p" || e.key === "P"))
        ) {
          e.preventDefault()
          return false
        }
      }

      const disableSelection = () => {
        document.body.style.userSelect = "none"
        document.body.style.webkitUserSelect = "none"
        document.body.style.mozUserSelect = "none"
        document.body.style.msUserSelect = "none"
      }

      document.addEventListener("contextmenu", handleContextMenu)
      document.addEventListener("keydown", handleKeyDown)
      disableSelection()

      const handleDragStart = (e: DragEvent) => {
        e.preventDefault()
        return false
      }
      document.addEventListener("dragstart", handleDragStart)

      const clearConsole = () => {
        if (typeof console !== "undefined") {
          console.clear()
        }
      }
      const consoleInterval = setInterval(clearConsole, 1000)

      return () => {
        document.removeEventListener("contextmenu", handleContextMenu)
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("dragstart", handleDragStart)
        clearInterval(consoleInterval)

        document.body.style.userSelect = ""
        document.body.style.webkitUserSelect = ""
        document.body.style.mozUserSelect = ""
        document.body.style.msUserSelect = ""
      }
    }

    validateAndLoadContent()
  }, [router, uuid])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading protected content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
              <p className="text-sm text-gray-500 mb-2">{error}</p>
              {accessDeniedReason && (
                <p className="text-xs text-gray-400 mb-4 p-2 bg-gray-50 rounded">{accessDeniedReason}</p>
              )}
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/?uuid=${uuid}`)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Verify Access to This Content
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthorized || !content) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <style jsx global>{`
        @media print {
          body {
            display: none !important;
          }
        }

        body {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-green-800">Access Granted</CardTitle>
            <p className="text-green-600 mt-2">Viewing protected content: {content.title}</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>ID: {content.uuid}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created: {new Date(content.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Views: {content.view_count}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {content.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Security Notice</span>
              </div>
              <p className="text-yellow-700 text-sm">
                This content is protected. Copying, printing, and developer tools are disabled. All access is monitored
                and logged.
              </p>
            </div>

            {/* Dynamic content from database */}
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content.content_html }}
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
            />

            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-semibold">
                ⚠️ WARNING: Unauthorized disclosure of this information is strictly prohibited and may result in legal
                action. All access is monitored and recorded.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
