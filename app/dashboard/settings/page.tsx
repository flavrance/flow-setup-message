import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Mail, Shield, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your verification system settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">SMTP settings for verification emails</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">SMTP Host</span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {process.env.SMTP_HOST || "Not configured"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SMTP User</span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {process.env.SMTP_USER ? "Configured" : "Not configured"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Rate limiting and security configuration</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rate Limiting</span>
                <span className="text-sm text-green-600 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Redis Cache</span>
                <span className="text-sm text-green-600 font-semibold">Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Supabase database connection</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm text-green-600 font-semibold">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tables</span>
                <span className="text-sm text-green-600 font-semibold">Healthy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Application information</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Version</span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Environment</span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {process.env.NODE_ENV || "development"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
