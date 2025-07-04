"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmailEditor } from "@/components/email/email-editor"
import { ArrowLeft, Send, Save, Upload, Users, Calendar, Repeat, TestTube } from "lucide-react"
import Link from "next/link"

interface SenderAlias {
  id: string
  alias_email: string
  alias_name: string
  is_verified: boolean
}

interface EmailTemplate {
  id: string
  name: string
  htmlContent: string
  category: string
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [senderAliases, setSenderAliases] = useState<SenderAlias[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [activeTab, setActiveTab] = useState("basic")

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    fromAliasId: "",
    htmlBody: "",
    recipients: "",
    scheduledAt: "",
    isRecurring: false,
    cronExpression: "",
    enableAbTesting: false,
    abTestPercentage: 50,
    subjectVariantB: "",
  })

  const [recipientStats, setRecipientStats] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
  })

  useEffect(() => {
    fetchSenderAliases()
    fetchTemplates()
  }, [])

  useEffect(() => {
    analyzeRecipients()
  }, [formData.recipients])

  const fetchSenderAliases = async () => {
    try {
      const response = await fetch("/api/sender-aliases")
      const data = await response.json()
      if (response.ok) {
        setSenderAliases(data.aliases || [])
      }
    } catch (error) {
      console.error("Failed to fetch sender aliases:", error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates")
      const data = await response.json()
      if (response.ok) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const analyzeRecipients = () => {
    const emails = formData.recipients
      .split("\n")
      .map((email) => email.trim())
      .filter(Boolean)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails = emails.filter((email) => emailRegex.test(email))

    setRecipientStats({
      total: emails.length,
      valid: validEmails.length,
      invalid: emails.length - validEmails.length,
    })
  }

  const handleSubmit = async (e: React.FormEvent, sendNow = false) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        scheduledAt: sendNow ? null : formData.scheduledAt || null,
        cronExpression: formData.isRecurring ? formData.cronExpression : null,
      }

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        if (sendNow) {
          await fetch(`/api/campaigns/${data.campaign.id}/send`, {
            method: "POST",
          })
        }
        router.push("/dashboard/campaigns")
      } else {
        alert(data.error || "Failed to create campaign")
      }
    } catch (error) {
      console.error("Failed to create campaign:", error)
      alert("Failed to create campaign")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/csv") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const csv = e.target?.result as string
        const emails = csv
          .split("\n")
          .map((line) => line.split(",")[0].trim())
          .filter(Boolean)
        handleInputChange("recipients", emails.join("\n"))
      }
      reader.readAsText(file)
    }
  }

  const previewEmail = () => {
    if (!formData.htmlBody) {
      alert("Please add email content first")
      return
    }

    const previewWindow = window.open("", "_blank", "width=600,height=800")
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Email Preview</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
              .email-container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <strong>Subject:</strong> ${formData.subject}<br>
                <strong>From:</strong> ${senderAliases.find((a) => a.id === formData.fromAliasId)?.alias_email || "No sender selected"}
              </div>
              ${formData.htmlBody}
            </div>
          </body>
        </html>
      `)
      previewWindow.document.close()
    }
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
        <h1 className="text-3xl font-bold">Create Email Campaign</h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="schedule">Schedule & Options</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter campaign title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    placeholder="Enter email subject line"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fromAlias">From (Sender)</Label>
                  <Select
                    value={formData.fromAliasId}
                    onValueChange={(value) => handleInputChange("fromAliasId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sender alias" />
                    </SelectTrigger>
                    <SelectContent>
                      {senderAliases
                        .filter((alias) => alias.is_verified)
                        .map((alias) => (
                          <SelectItem key={alias.id} value={alias.id}>
                            <div className="flex items-center gap-2">
                              <span>{alias.alias_name}</span>
                              <span className="text-sm text-gray-500">({alias.alias_email})</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {senderAliases.filter((a) => a.is_verified).length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No verified sender aliases found.{" "}
                      <Link href="/dashboard/campaigns/aliases" className="text-blue-600 hover:underline">
                        Create and verify one first
                      </Link>
                      .
                    </p>
                  )}
                </div>

                {/* A/B Testing */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAbTesting"
                      checked={formData.enableAbTesting}
                      onCheckedChange={(checked) => handleInputChange("enableAbTesting", checked)}
                    />
                    <Label htmlFor="enableAbTesting" className="flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Enable A/B Testing
                    </Label>
                  </div>

                  {formData.enableAbTesting && (
                    <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                      <div>
                        <Label htmlFor="subjectVariantB">Subject Line B (Variant)</Label>
                        <Input
                          id="subjectVariantB"
                          value={formData.subjectVariantB}
                          onChange={(e) => handleInputChange("subjectVariantB", e.target.value)}
                          placeholder="Enter alternative subject line"
                        />
                      </div>
                      <div>
                        <Label htmlFor="abTestPercentage">Test Split (% for Variant A)</Label>
                        <Input
                          id="abTestPercentage"
                          type="number"
                          min="10"
                          max="90"
                          value={formData.abTestPercentage}
                          onChange={(e) => handleInputChange("abTestPercentage", Number.parseInt(e.target.value))}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {formData.abTestPercentage}% will receive variant A, {100 - formData.abTestPercentage}% will
                          receive variant B
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <EmailEditor
              value={formData.htmlBody}
              onChange={(value) => handleInputChange("htmlBody", value)}
              templates={templates}
            />
          </TabsContent>

          <TabsContent value="recipients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{recipientStats.total}</div>
                      <p className="text-sm text-gray-500">Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">{recipientStats.valid}</div>
                      <p className="text-sm text-gray-500">Valid</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-red-600">{recipientStats.invalid}</div>
                      <p className="text-sm text-gray-500">Invalid</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="recipients">Email Addresses</Label>
                    <div className="flex gap-2">
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("csv-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload CSV
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="recipients"
                    value={formData.recipients}
                    onChange={(e) => handleInputChange("recipients", e.target.value)}
                    placeholder="Enter email addresses, one per line&#10;example@domain.com&#10;another@domain.com"
                    rows={12}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter one email address per line or upload a CSV file with email addresses in the first column.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduling Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scheduledAt">Send At (Optional)</Label>
                  <DatePicker
                    value={formData.scheduledAt}
                    onChange={(value) => handleInputChange("scheduledAt", value)}
                    placeholder="Select date and time"
                    label=""
                  />
                  <p className="text-sm text-gray-500 mt-2">Leave empty to save as draft.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => handleInputChange("isRecurring", checked)}
                    />
                    <Label htmlFor="isRecurring" className="flex items-center gap-2">
                      <Repeat className="h-4 w-4" />
                      Recurring Campaign
                    </Label>
                  </div>

                  {formData.isRecurring && (
                    <div className="space-y-3 p-4 border rounded-lg bg-green-50">
                      <div>
                        <Label htmlFor="cronExpression">Cron Expression</Label>
                        <Input
                          id="cronExpression"
                          value={formData.cronExpression}
                          onChange={(e) => handleInputChange("cronExpression", e.target.value)}
                          placeholder="0 9 * * 1 (Every Monday at 9 AM)"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Use cron syntax. Examples:
                          <br />• <code>0 9 * * 1</code> - Every Monday at 9 AM
                          <br />• <code>0 12 1 * *</code> - First day of every month at noon
                          <br />• <code>0 18 * * 5</code> - Every Friday at 6 PM
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button type="button" variant="outline" onClick={previewEmail} className="w-full bg-transparent">
                  <TestTube className="h-4 w-4 mr-2" />
                  Preview Email
                </Button>

                <Button type="submit" className="w-full" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save as Draft"}
                </Button>

                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="w-full"
                  variant="default"
                  disabled={loading || recipientStats.valid === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Send Now"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
