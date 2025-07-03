"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Shield, Clock, Globe, Mail, Phone } from "lucide-react"

interface SessionStats {
  activeSessions: number
  verifiedToday: number
  avgDuration: number
  uniqueIPs: number
}

interface SessionData {
  id: string
  email: string
  phone_number: string
  ip_address: string
  created_at: string
  code_verified_at?: string
  protected_page_viewed_at?: string
  status: "pending" | "verified" | "expired"
}

export default function SessionsPage() {
  const [stats, setStats] = useState<SessionStats>({
    activeSessions: 0,
    verifiedToday: 0,
    avgDuration: 0,
    uniqueIPs: 0,
  })
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, sessionsResponse] = await Promise.all([
          fetch("/api/admin/session-stats"),
          fetch("/api/admin/sessions"),
        ])

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.data)
        }

        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json()
          setSessions(sessionsData.data)
        }
      } catch (error) {
        console.error("Error fetching sessions data:", error)
        setError("Failed to load sessions data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default">Verified</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "In progress"
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60) // minutes
    return `${duration}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Sessions</h2>
          <p className="text-muted-foreground">Monitor and manage user verification sessions</p>
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
          <h2 className="text-3xl font-bold tracking-tight">User Sessions</h2>
          <p className="text-muted-foreground">Monitor and manage user verification sessions</p>
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
        <h2 className="text-3xl font-bold tracking-tight">User Sessions</h2>
        <p className="text-muted-foreground">Monitor and manage user verification sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedToday}</div>
            <p className="text-xs text-muted-foreground">Successful verifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgDuration > 0 ? `${Math.round(stats.avgDuration / 60)}m` : "0m"}
            </div>
            <p className="text-xs text-muted-foreground">Average session time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
            <p className="text-xs text-muted-foreground">Different locations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions yet</p>
              <p className="text-sm">User sessions will appear here once verification starts</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{session.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{session.phone_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{session.ip_address}</code>
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>{new Date(session.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {formatDuration(session.created_at, session.code_verified_at || session.protected_page_viewed_at)}
                    </TableCell>
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
