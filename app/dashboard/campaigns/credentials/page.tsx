"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Plus, Settings, Trash2, TestTube, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface EmailCredential {
  id: string
  credential_name: string
  provider_type: string
  smtp_host?: string
  smtp_port?: number
  smtp_username?: string
  smtp_use_tls: boolean
  api_endpoint?: string
  is_default: boolean
  is_active: boolean
  test_status: string
  last_tested_at?: string
  created_at: string
}

interface SenderAlias {
  id: string
  alias_email: string
  alias_name: string
  is_verified: boolean
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<EmailCredential[]>([])
  const [aliases, setAliases] = useState<SenderAlias[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [testingCredential, setTestingCredential] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    aliasId: "",
    credentialName: "",
    providerType: "smtp",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    smtpUseTls: true,
    apiKey: "",
    apiEndpoint: "",
    isDefault: false,
  })

  useEffect(() => {
    fetchCredentials()
    fetchAliases()
  }, [])

  const fetchCredentials = async () => {
    try {
      const response = await fetch("/api/credentials")
      const data = await response.json()
      if (response.ok) {
        setCredentials(data.credentials || [])
      }
    } catch (error) {
      console.error("Failed to fetch credentials:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAliases = async () => {
    try {
      const response = await fetch("/api/sender-aliases")
      const data = await response.json()
      if (response.ok) {
        setAliases(data.aliases || [])
      }
    } catch (error) {
      console.error("Failed to fetch aliases:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setFormData({
          aliasId: "",
          credentialName: "",
          providerType: "smtp",
          smtpHost: "",
          smtpPort: 587,
          smtpUsername: "",
          smtpPassword: "",
          smtpUseTls: true,
          apiKey: "",
          apiEndpoint: "",
          isDefault: false,
        })
        fetchCredentials()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create credential")
      }
    } catch (error) {
      console.error("Failed to create credential:", error)
      alert("Failed to create credential")
    } finally {
      setLoading(false)
    }
  }

  const testCredential = async (credentialId: string) => {
    setTestingCredential(credentialId)
    try {
      const response = await fetch(`/api/credentials/${credentialId}/test`, {
        method: "POST",
      })

      if (response.ok) {
        fetchCredentials() // Refresh to get updated test status
      } else {
        alert("Failed to test credential")
      }
    } catch (error) {
      console.error("Failed to test credential:", error)
      alert("Failed to test credential")
    } finally {
      setTestingCredential(null)
    }
  }

  const deleteCredential = async (credentialId: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return

    try {
      const response = await fetch(`/api/credentials/${credentialId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchCredentials()
      } else {
        alert("Failed to delete credential")
      }
    } catch (error) {
      console.error("Failed to delete credential:", error)
      alert("Failed to delete credential")
    }
  }

  const getProviderIcon = (providerType: string) => {
    switch (providerType) {
      case "smtp":
        return "📧"
      case "sendgrid":
        return "📮"
      case "mailgun":
        return "🔫"
      case "ses":
        return "📨"
      default:
        return "✉️"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Working
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="secondary">Not Tested</Badge>
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Credentials</h1>
          <p className="text-gray-600">Manage your email service provider credentials</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Email Credential</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credentialName">Credential Name</Label>
                  <Input
                    id="credentialName"
                    value={formData.credentialName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, credentialName: e.target.value }))}
                    placeholder="My SMTP Server"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="aliasId">Sender Alias (Optional)</Label>
                  <Select
                    value={formData.aliasId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, aliasId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select alias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific alias</SelectItem>
                      {aliases.map((alias) => (
                        <SelectItem key={alias.id} value={alias.id}>
                          {alias.alias_name} ({alias.alias_email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="providerType">Provider Type</Label>
                <Select
                  value={formData.providerType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, providerType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP Server</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="ses">Amazon SES</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={formData.providerType === "smtp" ? "smtp" : "api"}>
                <TabsContent value="smtp" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={formData.smtpHost}
                        onChange={(e) => setFormData((prev) => ({ ...prev, smtpHost: e.target.value }))}
                        placeholder="smtp.gmail.com"
                        required={formData.providerType === "smtp"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={formData.smtpPort}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, smtpPort: Number.parseInt(e.target.value) }))
                        }
                        placeholder="587"
                        required={formData.providerType === "smtp"}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="smtpUsername">Username/Email</Label>
                    <Input
                      id="smtpUsername"
                      value={formData.smtpUsername}
                      onChange={(e) => setFormData((prev) => ({ ...prev, smtpUsername: e.target.value }))}
                      placeholder="your-email@gmail.com"
                      required={formData.providerType === "smtp"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">Password/App Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData((prev) => ({ ...prev, smtpPassword: e.target.value }))}
                      placeholder="Your password or app-specific password"
                      required={formData.providerType === "smtp"}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtpUseTls"
                      checked={formData.smtpUseTls}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, smtpUseTls: checked }))}
                    />
                    <Label htmlFor="smtpUseTls">Use TLS/SSL</Label>
                  </div>
                </TabsContent>

                <TabsContent value="api" className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Your API key"
                      required={formData.providerType !== "smtp"}
                    />
                  </div>
                  {formData.providerType === "mailgun" && (
                    <div>
                      <Label htmlFor="apiEndpoint">Domain</Label>
                      <Input
                        id="apiEndpoint"
                        value={formData.apiEndpoint}
                        onChange={(e) => setFormData((prev) => ({ ...prev, apiEndpoint: e.target.value }))}
                        placeholder="your-domain.mailgun.org"
                        required
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isDefault: checked }))}
                />
                <Label htmlFor="isDefault">Set as default credential</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Credential"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Email Credentials</h3>
              <p className="text-gray-600 text-center mb-4">
                Add your first email service provider credential to start sending campaigns.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </CardContent>
          </Card>
        ) : (
          credentials.map((credential) => (
            <Card key={credential.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getProviderIcon(credential.provider_type)}</span>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {credential.credential_name}
                        {credential.is_default && <Badge variant="secondary">Default</Badge>}
                      </CardTitle>
                      <p className="text-sm text-gray-600 capitalize">
                        {credential.provider_type} • Created {new Date(credential.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">{getStatusBadge(credential.test_status)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {credential.provider_type === "smtp" ? (
                    <>
                      <div>
                        <Label className="text-sm text-gray-600">SMTP Host</Label>
                        <p className="font-medium">{credential.smtp_host}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Port</Label>
                        <p className="font-medium">{credential.smtp_port}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Username</Label>
                        <p className="font-medium">{credential.smtp_username}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">TLS/SSL</Label>
                        <p className="font-medium">{credential.smtp_use_tls ? "Enabled" : "Disabled"}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm text-gray-600">Provider</Label>
                        <p className="font-medium capitalize">{credential.provider_type}</p>
                      </div>
                      {credential.api_endpoint && (
                        <div>
                          <Label className="text-sm text-gray-600">Endpoint/Domain</Label>
                          <p className="font-medium">{credential.api_endpoint}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {credential.last_tested_at && (
                  <p className="text-sm text-gray-500 mb-4">
                    Last tested: {new Date(credential.last_tested_at).toLocaleString()}
                  </p>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testCredential(credential.id)}
                    disabled={testingCredential === credential.id}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingCredential === credential.id ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteCredential(credential.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
