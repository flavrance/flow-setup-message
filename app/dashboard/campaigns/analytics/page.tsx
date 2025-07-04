"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ArrowLeft, TrendingUp, TrendingDown, Mail, Eye, MousePointer, AlertTriangle, Download } from "lucide-react"
import Link from "next/link"

interface CampaignAnalytics {
  totalCampaigns: number
  totalSent: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  avgOpenRate: number
  avgClickRate: number
  avgBounceRate: number
  topCampaigns: Array<{
    id: string
    title: string
    openRate: number
    clickRate: number
    sent: number
  }>
  performanceOverTime: Array<{
    date: string
    sent: number
    opened: number
    clicked: number
  }>
  topLinks: Array<{
    url: string
    clicks: number
    campaigns: number
  }>
  deviceStats: Array<{
    device: string
    opens: number
    clicks: number
  }>
  engagementByDay: Array<{
    day: string
    opens: number
    clicks: number
  }>
}

export default function CampaignAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState("opens")

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/analytics?range=${timeRange}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data.analytics)
      } else {
        console.error("Failed to fetch analytics:", data.error)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!analytics) return

    const csvData = [
      ["Metric", "Value"],
      ["Total Campaigns", analytics.totalCampaigns],
      ["Total Sent", analytics.totalSent],
      ["Total Opened", analytics.totalOpened],
      ["Total Clicked", analytics.totalClicked],
      ["Average Open Rate", `${analytics.avgOpenRate}%`],
      ["Average Click Rate", `${analytics.avgClickRate}%`],
      ["Average Bounce Rate", `${analytics.avgBounceRate}%`],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `campaign-analytics-${timeRange}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getMetricColor = (value: number, type: "rate" | "count") => {
    if (type === "rate") {
      if (value >= 25) return "text-green-600"
      if (value >= 15) return "text-yellow-600"
      return "text-red-600"
    }
    return "text-blue-600"
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

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
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">No analytics data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Campaign Analytics</h1>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">{analytics.totalSent.toLocaleString()} emails sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(analytics.avgOpenRate, "rate")}`}>
              {analytics.avgOpenRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">{analytics.totalOpened.toLocaleString()} total opens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(analytics.avgClickRate, "rate")}`}>
              {analytics.avgClickRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">{analytics.totalClicked.toLocaleString()} total clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.avgBounceRate > 5 ? "text-red-600" : "text-green-600"}`}>
              {analytics.avgBounceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">{analytics.totalBounced.toLocaleString()} bounced emails</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="campaigns">Top Campaigns</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="links">Top Links</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.performanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Sent" />
                    <Line type="monotone" dataKey="opened" stroke="#82ca9d" name="Opened" />
                    <Line type="monotone" dataKey="clicked" stroke="#ffc658" name="Clicked" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Day of Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.engagementByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="opens" fill="#8884d8" name="Opens" />
                      <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.deviceStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="opens"
                      >
                        {analytics.deviceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/campaigns/${campaign.id}`} className="hover:underline">
                          {campaign.title}
                        </Link>
                      </TableCell>
                      <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={getMetricColor(campaign.openRate, "rate")}>
                          {campaign.openRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getMetricColor(campaign.clickRate, "rate")}>
                          {campaign.clickRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {campaign.openRate >= 25 ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Excellent
                          </Badge>
                        ) : campaign.openRate >= 15 ? (
                          <Badge variant="secondary">Good</Badge>
                        ) : (
                          <Badge variant="destructive">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Needs Improvement
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Email Deliverability</span>
                  <span className="font-bold text-green-600">
                    {(((analytics.totalSent - analytics.totalBounced) / analytics.totalSent) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>List Growth Rate</span>
                  <span className="font-bold text-blue-600">+2.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Unsubscribe Rate</span>
                  <span className="font-bold text-yellow-600">0.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Spam Complaint Rate</span>
                  <span className="font-bold text-red-600">0.1%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best Performing Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Tuesday 10:00 AM</span>
                    <Badge variant="default">Best Open Rate</Badge>
                  </div>
                  <div className="text-sm text-gray-500">32.4% open rate</div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Thursday 2:00 PM</span>
                    <Badge variant="secondary">Best Click Rate</Badge>
                  </div>
                  <div className="text-sm text-gray-500">8.7% click rate</div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Friday 5:00 PM</span>
                    <Badge variant="destructive">Worst Performance</Badge>
                  </div>
                  <div className="text-sm text-gray-500">12.1% open rate</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Top Clicked Links</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Total Clicks</TableHead>
                    <TableHead>Campaigns</TableHead>
                    <TableHead>Avg CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topLinks.map((link, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm max-w-xs truncate">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {link.url}
                        </a>
                      </TableCell>
                      <TableCell>{link.clicks.toLocaleString()}</TableCell>
                      <TableCell>{link.campaigns}</TableCell>
                      <TableCell>
                        <span className="text-blue-600">{((link.clicks / analytics.totalSent) * 100).toFixed(2)}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
