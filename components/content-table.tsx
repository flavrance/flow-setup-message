"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ContentItem {
  id: string
  uuid: string
  title: string
  is_active: boolean
  view_count: number
  created_at: string
  updated_at: string
  expires_at?: string
}

export function ContentTable() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/content")
      if (!response.ok) throw new Error("Failed to fetch content")
      const data = await response.json()
      setContent(data.content)
    } catch (error) {
      console.error("Error fetching content:", error)
      toast.error("Failed to load content")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return

    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete content")

      toast.success("Content deleted successfully")
      fetchContent()
    } catch (error) {
      console.error("Error deleting content:", error)
      toast.error("Failed to delete content")
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (!response.ok) throw new Error("Failed to update content")

      toast.success(`Content ${!currentStatus ? "activated" : "deactivated"}`)
      fetchContent()
    } catch (error) {
      console.error("Error updating content:", error)
      toast.error("Failed to update content")
    }
  }

  const copyShareLink = (uuid: string) => {
    const shareUrl = `${window.location.origin}/?uuid=${uuid}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Share link copied to clipboard")
  }

  if (loading) {
    return <div>Loading content...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Content</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>UUID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.uuid}</code>
                </TableCell>
                <TableCell>
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{item.view_count}</TableCell>
                <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{item.expires_at ? new Date(item.expires_at).toLocaleDateString() : "Never"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/content/${item.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyShareLink(item.uuid)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Share Link
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/protected/${item.uuid}`} target="_blank">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(item.id, item.is_active)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {item.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
