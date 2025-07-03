"use client"

import { useState, useEffect } from "react"
import { ContentForm } from "./content-form"

interface EditContentFormProps {
  contentId: string
}

interface ContentData {
  id: string
  uuid: string
  title: string
  content_html: string
  expires_at?: string
  is_active: boolean
}

export function EditContentForm({ contentId }: EditContentFormProps) {
  const [content, setContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/admin/content/${contentId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch content")
        }
        const data = await response.json()
        setContent(data.data)
      } catch (error) {
        console.error("Error fetching content:", error)
        setError("Failed to load content")
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [contentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error || "Content not found"}</p>
      </div>
    )
  }

  return (
    <ContentForm
      initialData={{
        uuid: content.uuid,
        title: content.title,
        content_html: content.content_html,
        expires_at: content.expires_at || "",
        is_active: content.is_active,
      }}
      isEditing={true}
      contentId={contentId}
    />
  )
}
