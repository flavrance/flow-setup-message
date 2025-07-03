"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, TrendingUp, Clock, FileText, User, Globe } from "lucide-react"

interface ViewStats {
  totalViews: number
  todayViews: number
  avgViewTime: number
  mostViewed: string
}

interface ViewData {
  id: string
  content_uuid: string
  content_title: string
  email: string
  ip_address: string
  viewed_at: string
  user_agent?: string
}

export default function ViewsPage() {
  const [stats, setStats] = useState<ViewStats>({
    totalViews: 0,
    todayViews: 0,
    avgViewTime: 0,
    mostViewed: "",
  })
  const [views, setViews] = useState<ViewData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, viewsResponse] = await Promise.all([
          fetch("/api/admin/view-stats"),
          fetch("/api/admin/page-views"),
        ])

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.data)
        }

        if (viewsResponse.ok) {
          const viewsData = await viewsResponse.json()
          setViews(viewsData.data)
        }
      } catch (error) {
        console.error("Error fetching views data:", error)
        setError("Failed to load views data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getBrowserFromUserAgent = (userAgent?: string) => {
    if (!userAgent) return "Unknown"
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    return "Other"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Page Views</h2>
          <p className="text-muted-foreground">Track and analyze protected content access patterns</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Page Views</h2>
          <p className="text-muted-foreground">Track and analyze protected content access patterns</p>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Page Views</h2>
        <p className="text-muted-foreground">Track and analyze protected content access patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayViews}</div>
            <p className="text-xs text-muted-foreground">{stats.todayViews > 0 ? "Active today" : "No views today"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. View Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgViewTime > 0 ? `${Math.round(stats.avgViewTime / 60)}m` : "0m"}
            </div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Viewed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sm">{stats.mostViewed || "No content"}</div>
            <p className="text-xs text-muted-foreground">{stats.mostViewed ? "Top content" : "No views yet"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Views</CardTitle>
        </CardHeader>
        <CardContent>
          {views.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No page views yet</p>
              <p className="text-sm">Content views will appear here once users access protected content</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Viewed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {views.map((view) => (
                  <TableRow key={view.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{view.content_title}</div>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{view.content_uuid}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{view.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{view.ip_address}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getBrowserFromUserAgent(view.user_agent)}</Badge>
                    </TableCell>
                    <TableCell>{new Date(view.viewed_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
