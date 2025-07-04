"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, MoreHorizontal, Send, Edit, Trash2, BarChart3 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Campaign {
  id: string
  title: string
  subject: string
  sender_alias?: {
    alias_email: string
    alias_name: string
  }
  recipient_count: number
  status: string
  scheduled_at?: string
  sent_at?: string
  total_sent: number
  total_opened: number
  total_clicked: number
  created_at: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchCampaigns()
  }, [statusFilter])

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/campaigns?${params}`)
      const data = await response.json()

      if (response.ok) {
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      })

      if (response.ok) {
        fetchCampaigns() // Refresh the list
      }
    } catch (error) {
      console.error("Failed to send campaign:", error)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchCampaigns() // Refresh the list
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      scheduled: { label: "Scheduled", variant: "default" as const },
      sending: { label: "Sending", variant: "default" as const },
      sent: { label: "Sent", variant: "default" as const },
      paused: { label: "Paused", variant: "secondary" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading campaigns...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Email Campaigns</h1>
        <Link href="/dashboard/campaigns/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.filter((c) => c.status === "sent").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.reduce((sum, c) => sum + c.total_sent, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0
                ? Math.round(
                    campaigns.reduce(
                      (sum, c) => sum + (c.total_sent > 0 ? (c.total_opened / c.total_sent) * 100 : 0),
                      0,
                    ) / campaigns.length,
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No campaigns found</div>
              <Link href="/dashboard/campaigns/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled/Sent</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                    <TableCell>
                      {campaign.sender_alias ? (
                        <div>
                          <div className="font-medium">{campaign.sender_alias.alias_name}</div>
                          <div className="text-sm text-gray-500">{campaign.sender_alias.alias_email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No alias</span>
                      )}
                    </TableCell>
                    <TableCell>{campaign.recipient_count.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      {campaign.sent_at ? (
                        <div>
                          <div className="font-medium">Sent</div>
                          <div className="text-sm text-gray-500">{new Date(campaign.sent_at).toLocaleDateString()}</div>
                        </div>
                      ) : campaign.scheduled_at ? (
                        <div>
                          <div className="font-medium">Scheduled</div>
                          <div className="text-sm text-gray-500">
                            {new Date(campaign.scheduled_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.total_sent > 0 ? (
                        <div className="text-sm">
                          <div>Opens: {Math.round((campaign.total_opened / campaign.total_sent) * 100)}%</div>
                          <div>Clicks: {Math.round((campaign.total_clicked / campaign.total_sent) * 100)}%</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/campaigns/${campaign.id}`}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {campaign.status === "draft" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {(campaign.status === "draft" || campaign.status === "scheduled") && (
                            <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Now
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDeleteCampaign(campaign.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
