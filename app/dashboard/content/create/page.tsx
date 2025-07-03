import { ContentForm } from "@/components/dashboard/content-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CreateContentPage() {
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
          <h2 className="text-3xl font-bold tracking-tight">Create New Content</h2>
          <p className="text-muted-foreground">Add a new protected document to your system</p>
        </div>
      </div>

      <ContentForm />
    </div>
  )
}
