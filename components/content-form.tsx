"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Save, Eye } from "lucide-react"

interface ContentFormData {
  uuid: string
  title: string
  content_html: string
  expires_at: string
  is_active: boolean
}

interface ContentFormProps {
  initialData?: Partial<ContentFormData>
  isEditing?: boolean
  contentId?: string
}

export function ContentForm({ initialData, isEditing = false, contentId }: ContentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ContentFormData>({
    uuid: initialData?.uuid || "",
    title: initialData?.title || "",
    content_html: initialData?.content_html || "",
    expires_at: initialData?.expires_at || "",
    is_active: initialData?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/admin/content/${contentId}` : "/api/admin/content"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save content")
      }

      toast.success(`Content ${isEditing ? "updated" : "created"} successfully`)
      router.push("/dashboard/content")
    } catch (error) {
      console.error("Error saving content:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save content")
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    if (formData.uuid) {
      window.open(`/protected/${formData.uuid}`, "_blank")
    } else {
      toast.error("Please enter a UUID first")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uuid">UUID *</Label>
              <Input
                id="uuid"
                value={formData.uuid}
                onChange={(e) => setFormData({ ...formData, uuid: e.target.value })}
                placeholder="e.g., my-document-001"
                required
              />
              <p className="text-sm text-muted-foreground">Unique identifier for this content (used in URLs)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Document Title"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">Leave empty for content that never expires</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active (visible to users)</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content HTML</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="content_html">HTML Content *</Label>
            <Textarea
              id="content_html"
              value={formData.content_html}
              onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
              placeholder="Enter your HTML content here..."
              className="min-h-[300px] font-mono"
              required
            />
            <p className="text-sm text-muted-foreground">
              Full HTML content that will be displayed in the protected page
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handlePreview} disabled={!formData.uuid}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>

        <div className="space-x-2">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/content")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : isEditing ? "Update Content" : "Create Content"}
          </Button>
        </div>
      </div>
    </form>
  )
}
