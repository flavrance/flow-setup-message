import { Suspense } from "react"
import { ContentTable } from "@/components/dashboard/content-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
          <p className="text-muted-foreground">Manage your protected content documents</p>
        </div>
        <Link href="/dashboard/content/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Content
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Loading content...</div>}>
        <ContentTable />
      </Suspense>
    </div>
  )
}
