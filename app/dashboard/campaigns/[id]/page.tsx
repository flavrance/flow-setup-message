"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Mail, Eye, MousePointer, TrendingUp, Users, ExternalLink } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

interface CampaignStats {
  campaign: any
  metrics: {
    totalSent: number
    totalDelivered: number
    totalOpened: number
    totalClicked: number
    totalBounced: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
  charts: {
    opensOverTime: any[]
    clicksOverTime: any[]
  }
  topLinks: any[]
  topRecipients: any[]
}

interface CampaignEmail {
  id: string
  recipient_email: string
  subject: string
  status: string
  sent_at?: string
  delivered_at?: string
  opened_at?: string
  first_opened_at?: string
  open_count: number
  clicked_at?: string
  click_count: number
  error_message?: string
}

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = params.id as string

  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [emails, setEmails] = useState<CampaignEmail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (campaignId) {
      fetchCampaignData()
    }
  }, [campaignId])

  const fetchCampaignData = async () => {
    try {
      const [statsResponse, emailsResponse] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}/stats`),
        fetch(`/api/campaigns/${campaignId}/emails`),
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json()
        setEmails(emailsData.emails || [])
      }
    } catch (error) {
      console.error("Failed to fetch campaign data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      sent: { label: "Sent", variant: "default" as const },
      delivered: { label: "Delivered", variant: "default" as const },
      bounced: { label: "Bounced", variant: "destructive" as const },
      failed: { label: "Failed", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Campaign Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading campaign data...</div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Campaign Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">The requested campaign could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{stats.campaign.title}</h1>
          <p className="text-gray-500">{stats.campaign.subject}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.metrics.totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.metrics.openRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.metrics.totalOpened} opens</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.metrics.clickRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.metrics.totalClicked} clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.metrics.bounceRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.metrics.totalBounced} bounces</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="emails">Email Details</TabsTrigger>
          <TabsTrigger value="engagement">Top Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Opens Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.charts.opensOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clicks Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.charts.clicksOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Links */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clicked Links</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topLinks.length === 0 ? (
                <p className="text-gray-500">No link clicks recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topLinks.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium truncate max-w-md">{link.url}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{link.clicks} clicks</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <p className="text-gray-500">No emails found for this campaign.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead>Clicked</TableHead>
                      <TableHead>Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">{email.recipient_email}</TableCell>
                        <TableCell>{getStatusBadge(email.status)}</TableCell>
                        <TableCell>{email.sent_at ? new Date(email.sent_at).toLocaleString() : "N/A"}</TableCell>
                        <TableCell>{email.opened_at ? new Date(email.opened_at).toLocaleString() : "N/A"}</TableCell>
                        <TableCell>{email.clicked_at ? new Date(email.clicked_at).toLocaleString() : "N/A"}</TableCell>
                        <TableCell>
                          {email.open_count} opens, {email.click_count} clicks
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Top Recipients */}
          <Card>
            <CardHeader>
              <CardTitle>Top Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topRecipients.length === 0 ? (
                <p className="text-gray-500">No top recipients recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.topRecipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium truncate max-w-md">{recipient.email}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{recipient.engagement} engagement</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
