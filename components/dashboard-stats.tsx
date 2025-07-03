import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Eye, Shield, TrendingUp, Clock } from "lucide-react"

async function getStats() {
  try {
    const response = await fetch('/api/admin/stats', {
      cache: "no-store",
    })
    if (!response.ok) throw new Error("Failed to fetch stats")
    return await response.json()
  } catch (error) {
    console.error("Error fetching stats:", error)
    return {
      totalSessions: 0,
      verifiedSessions: 0,
      contentViews: 0,
      activeContent: 0,
      todayViews: 0,
      avgSessionTime: 0,
    }
  }
}

export async function DashboardStats() {
  const stats = await getStats()

  const statCards = [
    {
      title: "Total Sessions",
      value: stats.totalSessions,
      icon: Users,
      description: "All verification attempts",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Verified Sessions",
      value: stats.verifiedSessions,
      icon: Shield,
      description: "Successfully verified",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Content Views",
      value: stats.contentViews,
      icon: Eye,
      description: "Protected content accessed",
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "Active Content",
      value: stats.activeContent,
      icon: FileText,
      description: "Published documents",
      trend: "+2",
      trendUp: true,
    },
    {
      title: "Today's Views",
      value: stats.todayViews,
      icon: TrendingUp,
      description: "Views in last 24h",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Avg Session Time",
      value: `${Math.round(stats.avgSessionTime / 60)}m`,
      icon: Clock,
      description: "Average verification time",
      trend: "-2m",
      trendUp: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            <div className="flex items-center mt-2">
              <span className={`text-xs ${stat.trendUp ? "text-green-600" : "text-red-600"}`}>{stat.trend}</span>
              <span className="text-xs text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
