"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ProtectedPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authorization with server
    const validateToken = async () => {
      const accessToken = sessionStorage.getItem("access_token")
      if (!accessToken) {
        router.push("/")
        return
      }

      try {
        const response = await fetch("/api/validate-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        })

        if (!response.ok) {
          // Token is invalid, redirect to start
          sessionStorage.removeItem("access_token")
          router.push("/")
          return
        }

        setIsAuthorized(true)

        // Track page view
        try {
          await fetch("/api/track-page-view", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accessToken }),
          })
        } catch (error) {
          console.error("Failed to track page view:", error)
          // Don't fail if tracking fails
        }
      } catch (error) {
        console.error("Token validation failed:", error)
        sessionStorage.removeItem("access_token")
        router.push("/")
        return
      }

      // Rest of the existing security code...
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault()
        return false
      }

      // Disable keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+A, Ctrl+C, Ctrl+P
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

      // Disable text selection
      const disableSelection = () => {
        document.body.style.userSelect = "none"
        document.body.style.webkitUserSelect = "none"
        document.body.style.mozUserSelect = "none"
        document.body.style.msUserSelect = "none"
      }

      // Add event listeners
      document.addEventListener("contextmenu", handleContextMenu)
      document.addEventListener("keydown", handleKeyDown)
      disableSelection()

      // Disable drag
      const handleDragStart = (e: DragEvent) => {
        e.preventDefault()
        return false
      }
      document.addEventListener("dragstart", handleDragStart)

      // Clear console periodically
      const clearConsole = () => {
        if (typeof console !== "undefined") {
          console.clear()
        }
      }
      const consoleInterval = setInterval(clearConsole, 1000)

      // Cleanup
      return () => {
        document.removeEventListener("contextmenu", handleContextMenu)
        document.removeEventListener("keydown", handleKeyDown)
        document.removeEventListener("dragstart", handleDragStart)
        clearInterval(consoleInterval)

        // Reset styles
        document.body.style.userSelect = ""
        document.body.style.webkitUserSelect = ""
        document.body.style.mozUserSelect = ""
        document.body.style.msUserSelect = ""
      }
    }

    validateToken()
  }, [router])

  useEffect(() => {
    // Redirect to default content or show content selection
    if (isAuthorized) {
      router.push("/protected/sample-doc-001")
    }
  }, [isAuthorized, router])

  if (!isAuthorized) {
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to protected content...</p>
      </div>
    </div>
  )
}
