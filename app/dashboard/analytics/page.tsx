import { Suspense } from "react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { ContentChart } from "@/components/dashboard/content-chart"
import { SessionsChart } from "@/components/dashboard/sessions-chart"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Detailed analytics and insights for your verification system</p>
      </div>

      <Suspense fallback={<div>Loading analytics...</div>}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading chart...</div>}>
          <ContentChart />
        </Suspense>

        <Suspense fallback={<div>Loading chart...</div>}>
          <SessionsChart />
        </Suspense>
      </div>
    </div>
  )
}
