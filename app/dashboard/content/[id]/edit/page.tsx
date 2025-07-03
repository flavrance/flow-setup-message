import { Suspense } from "react"
import { EditContentForm } from "@/components/dashboard/edit-content-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EditContentPageProps {
  params: {
    id: string
  }
}

export default function EditContentPage({ params }: EditContentPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/content">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Content</h2>
          <p className="text-muted-foreground">Update your protected document</p>
        </div>
      </div>

      <Suspense fallback={<div>Loading content...</div>}>
        <EditContentForm contentId={params.id} />
      </Suspense>
    </div>
  )
}
