"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Mail, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface SenderAlias {
  id: string
  real_email: string
  alias_email: string
  alias_name?: string
  is_verified: boolean
  created_at: string
}

export default function SenderAliasesPage() {
  const [aliases, setAliases] = useState<SenderAlias[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    realEmail: "",
    aliasEmail: "",
    aliasName: "",
  })

  useEffect(() => {
    fetchAliases()
  }, [])

  const fetchAliases = async () => {
    try {
      const response = await fetch("/api/sender-aliases")
      const data = await response.json()

      if (response.ok) {
        setAliases(data.aliases || [])
      }
    } catch (error) {
      console.error("Failed to fetch aliases:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch("/api/sender-aliases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setAliases([data.alias, ...aliases])
        setFormData({ realEmail: "", aliasEmail: "", aliasName: "" })
        setShowForm(false)
      } else {
        alert(data.error || "Failed to create sender alias")
      }
    } catch (error) {
      console.error("Failed to create alias:", error)
      alert("Failed to create sender alias")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Sender Aliases</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading aliases...</div>
        </div>
      </div>
    )
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
        <h1 className="text-3xl font-bold">Sender Aliases</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aliases</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aliases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aliases.filter((a) => a.is_verified).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aliases.filter((a) => !a.is_verified).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Sender Alias</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="realEmail">Real Email Address</Label>
                  <Input
                    id="realEmail"
                    type="email"
                    value={formData.realEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, realEmail: e.target.value }))}
                    placeholder="your-real-email@domain.com"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">The actual email address that will send the emails</p>
                </div>
                <div>
                  <Label htmlFor="aliasEmail">Alias Email Address</Label>
                  <Input
                    id="aliasEmail"
                    type="email"
                    value={formData.aliasEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, aliasEmail: e.target.value }))}
                    placeholder="alias@yourdomain.com"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">The email address recipients will see</p>
                </div>
              </div>
              <div>
                <Label htmlFor="aliasName">Display Name (Optional)</Label>
                <Input
                  id="aliasName"
                  value={formData.aliasName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, aliasName: e.target.value }))}
                  placeholder="Your Company Name"
                />
                <p className="text-sm text-gray-500 mt-1">The name that will appear in the "From" field</p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Alias"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Aliases Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sender Aliases</CardTitle>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Alias
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {aliases.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-4">No sender aliases found</div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Alias
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Alias Email</TableHead>
                  <TableHead>Real Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aliases.map((alias) => (
                  <TableRow key={alias.id}>
                    <TableCell className="font-medium">{alias.alias_name || "No name"}</TableCell>
                    <TableCell>{alias.alias_email}</TableCell>
                    <TableCell className="text-gray-500">{alias.real_email}</TableCell>
                    <TableCell>
                      {alias.is_verified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">{new Date(alias.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {aliases.some((a) => !a.is_verified) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Verification Required</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Some of your sender aliases are not verified. You'll need to verify them through your email provider
                  before you can use them to send campaigns. Check your email provider's documentation for instructions
                  on setting up sender verification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
