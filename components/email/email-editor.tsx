"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Code, Palette } from "lucide-react"

interface EmailTemplate {
  id: string
  name: string
  html_content: string
  category: string
}

interface EmailEditorProps {
  value: string
  onChange: (value: string) => void
  templates?: EmailTemplate[]
}

export function EmailEditor({ value, onChange, templates = [] }: EmailEditorProps) {
  const [activeTab, setActiveTab] = useState("visual")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      onChange(template.html_content)
      setSelectedTemplate(templateId)
    }
  }

  const insertElement = (element: string) => {
    const elements = {
      heading: '<h2 style="color: #333; font-size: 24px; margin: 20px 0;">Your Heading Here</h2>',
      paragraph:
        '<p style="color: #666; font-size: 16px; line-height: 1.6; margin: 15px 0;">Your paragraph text here.</p>',
      button:
        '<a href="#" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Click Here</a>',
      image:
        '<img src="https://via.placeholder.com/600x300" alt="Image" style="max-width: 100%; height: auto; margin: 20px 0;" />',
      divider: '<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />',
      spacer: '<div style="height: 30px;"></div>',
    }

    onChange(value + elements[element as keyof typeof elements])
  }

  const previewEmail = () => {
    const previewWindow = window.open("", "_blank", "width=600,height=800")
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Email Preview</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background-color: #f5f5f5; 
              }
              .email-container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white; 
                padding: 20px; 
                border-radius: 8px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              ${value}
            </div>
          </body>
        </html>
      `)
      previewWindow.document.close()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Email Content Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        {templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Start with a Template</label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual">Visual Editor</TabsTrigger>
            <TabsTrigger value="html">HTML Code</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4">
            {/* Element Insertion Buttons */}
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
              <Button type="button" variant="outline" size="sm" onClick={() => insertElement("heading")}>
                + Heading
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertElement("paragraph")}>
                + Paragraph
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertElement("button")}>
                + Button
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertElement("image")}>
                + Image
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertElement("divider")}>
                + Divider
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertElement("spacer")}>
                + Spacer
              </Button>
            </div>

            {/* Visual Preview */}
            <div className="border rounded-lg p-4 min-h-[400px] bg-white">
              <div className="text-sm text-gray-500 mb-2">Preview:</div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: value || '<p class="text-gray-400">Start typing or insert elements above...</p>',
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="html">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter your HTML email content here..."
              rows={20}
              className="font-mono text-sm"
            />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={previewEmail}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveTab(activeTab === "visual" ? "html" : "visual")}
          >
            <Code className="h-4 w-4 mr-2" />
            Switch to {activeTab === "visual" ? "HTML" : "Visual"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
