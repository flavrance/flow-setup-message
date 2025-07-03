"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface ChartData {
  name: string
  views: number
}

export function ContentChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/content-views")
        if (response.ok) {
          const result = await response.json()
          setData(result.data || [])
        } else {
          // If no data, show empty state instead of mock data
          setData([])
        }
      } catch (error) {
        console.error("Error fetching content views:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Show mock data only if we have no real data
  const displayData = data.length === 0 ? [{ name: "No data", views: 0 }] : data

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Content Views Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Content Views Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayData.length === 0 || displayData[0].views === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No content views yet</p>
            <p className="text-sm">Views will appear here once users access protected content</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((item.views / Math.max(...displayData.map((d) => d.views))) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{item.views}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          {data.length > 0
            ? "Total content views across all protected documents"
            : "Start by creating and sharing protected content"}
        </div>
      </CardContent>
    </Card>
  )
}
