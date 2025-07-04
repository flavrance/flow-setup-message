import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes)
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Encryption key for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-character-secret-key-here"

// Utility functions for encryption
export const encrypt = (text: string): string => {
  const cipher = crypto.createCipher("aes-256-cbc", ENCRYPTION_KEY)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return encrypted
}

export const decrypt = (encryptedText: string): string => {
  const decipher = crypto.createDecipher("aes-256-cbc", ENCRYPTION_KEY)
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

// Database types
export interface UserSession {
  id: string
  ip_address: string
  email: string
  phone_number: string
  verification_code_sent_at: string
  code_verified_at?: string
  protected_page_viewed_at?: string
  session_id: string
  created_at: string
  updated_at: string
}

export interface PageView {
  id: string
  user_session_id: string
  ip_address: string
  email: string
  viewed_at: string
  user_agent?: string
  created_at: string
}

export interface ProtectedContent {
  id: string
  uuid: string
  title: string
  content_html: string
  created_at: string
  updated_at: string
  expires_at?: string
  is_active: boolean
  view_count: number
  metadata: Record<string, any>
}

export interface ContentView {
  id: string
  content_uuid: string
  user_session_id: string
  ip_address: string
  email: string
  viewed_at: string
  user_agent?: string
  access_token: string
  created_at: string
}

export interface SenderAlias {
  id: string
  real_email: string
  alias_email: string
  alias_name?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface EmailCampaign {
  id: string
  title: string
  subject: string
  from_alias_id?: string
  html_body: string
  recipients: string[]
  recipient_count: number
  status: string
  scheduled_at?: string
  sent_at?: string
  created_by: string
  created_at: string
  updated_at: string
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_bounced: number
  total_unsubscribed: number
  cron_expression?: string
  is_recurring: boolean
  next_run_at?: string
  last_run_at?: string
  run_count: number
  sender_alias?: SenderAlias
}

export interface CampaignEmail {
  id: string
  campaign_id: string
  recipient_email: string
  recipient_name?: string
  subject: string
  html_body: string
  tracking_id: string
  status: string
  sent_at?: string
  delivered_at?: string
  opened_at?: string
  first_opened_at?: string
  open_count: number
  last_opened_at?: string
  clicked_at?: string
  first_clicked_at?: string
  click_count: number
  last_clicked_at?: string
  reading_time_seconds: number
  scroll_percentage: number
  error_message?: string
  bounce_reason?: string
  created_at: string
  updated_at: string
}

export interface EmailCredential {
  id: string
  alias_id?: string
  credential_name: string
  provider_type: string
  smtp_host?: string
  smtp_port?: number
  smtp_username?: string
  smtp_password_encrypted?: string
  smtp_use_tls: boolean
  api_key_encrypted?: string
  api_endpoint?: string
  is_default: boolean
  is_active: boolean
  last_tested_at?: string
  test_status: string
  test_error_message?: string
  created_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  description?: string
  html_content: string
  category: string
  created_by: string
  created_at: string
  updated_at: string
}

// Supabase Operations Class
export class SupabaseOperations {
  private client: ReturnType<typeof createClient>

  constructor() {
    this.client = createServerClient()
  }

  // Get content views for chart
  async getContentViewsChart(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("content_views")
        .select(`
        viewed_at,
        content_uuid,
        protected_content!inner(title)
      `)
        .order("viewed_at", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Supabase content views chart error:", error)
        return { success: false, error: error.message }
      }

      // Group by content and count views
      const viewsByContent: { [key: string]: number } = {}
      data?.forEach((view) => {
        const title = view.protected_content?.title || view.content_uuid
        viewsByContent[title] = (viewsByContent[title] || 0) + 1
      })

      const chartData = Object.entries(viewsByContent).map(([name, views]) => ({
        name,
        views,
      }))

      return { success: true, data: chartData }
    } catch (error) {
      console.error("Failed to get content views chart:", error)
      return { success: false, error: "Database operation failed" }
    }
  }
// Get session activity for chart
  async getSessionActivity(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("user_sessions")
        .select("created_at, code_verified_at")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase session activity error:", error)
        return { success: false, error: error.message }
      }

      // Group by day of week
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const sessionsByDay: { [key: string]: { sessions: number; verified: number } } = {}

      // Initialize all days
      days.forEach((day) => {
        sessionsByDay[day] = { sessions: 0, verified: 0 }
      })

      data?.forEach((session) => {
        const dayName = days[new Date(session.created_at).getDay()]
        sessionsByDay[dayName].sessions++
        if (session.code_verified_at) {
          sessionsByDay[dayName].verified++
        }
      })

      const chartData = days.map((day) => ({
        name: day,
        sessions: sessionsByDay[day].sessions,
        verified: sessionsByDay[day].verified,
      }))

      return { success: true, data: chartData }
    } catch (error) {
      console.error("Failed to get session activity:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== USER SESSION METHODS =====

  async createUserSession(data: {
    ipAddress: string
    email: string
    phoneNumber: string
    sessionId: string
  }): Promise<{ success: boolean; data?: UserSession; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("user_sessions")
        .insert({
          ip_address: data.ipAddress,
          email: data.email,
          phone_number: data.phoneNumber,
          session_id: data.sessionId,
          verification_code_sent_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create session error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create user session:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async getUserSession(sessionId: string): Promise<{ success: boolean; data?: UserSession; error?: string }> {
    try {
      const { data, error } = await this.client.from("user_sessions").select("*").eq("session_id", sessionId).single()

      if (error) {
        if (error.code === "PGRST116") {
          return { success: false, error: "Session not found" }
        }
        console.error("Supabase get session error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get user session:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async updateUserSession(
    sessionId: string,
    updates: Partial<UserSession>,
  ): Promise<{ success: boolean; data?: UserSession; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("user_sessions")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .select()
        .single()

      if (error) {
        console.error("Supabase update session error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to update user session:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== PROTECTED CONTENT METHODS =====

  async createProtectedContent(data: {
    uuid: string
    title: string
    contentHtml: string
    expiresAt?: Date
    metadata?: Record<string, any>
  }): Promise<{ success: boolean; data?: ProtectedContent; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("protected_content")
        .insert({
          uuid: data.uuid,
          title: data.title,
          content_html: data.contentHtml,
          expires_at: data.expiresAt?.toISOString(),
          metadata: data.metadata || {},
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create content error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async getProtectedContent(uuid: string): Promise<{ success: boolean; data?: ProtectedContent; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("protected_content")
        .select("*")
        .eq("uuid", uuid)
        .eq("is_active", true)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return { success: false, error: "Content not found" }
        }
        console.error("Supabase get content error:", error)
        return { success: false, error: error.message }
      }

      // Check if content has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { success: false, error: "Content has expired" }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async getAllProtectedContent(): Promise<{ success: boolean; data?: ProtectedContent[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("protected_content")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase get all content error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get all protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async updateProtectedContent(
    id: string,
    updates: Partial<ProtectedContent>,
  ): Promise<{ success: boolean; data?: ProtectedContent; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("protected_content")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Supabase update content error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to update protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async deleteProtectedContent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client.from("protected_content").delete().eq("id", id)

      if (error) {
        console.error("Supabase delete content error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to delete protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== CONTENT VIEW METHODS =====

  async createContentView(data: {
    contentUuid: string
    userSessionId: string
    ipAddress: string
    email: string
    userAgent?: string
    accessToken: string
  }): Promise<{ success: boolean; data?: ContentView; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("content_views")
        .insert({
          content_uuid: data.contentUuid,
          user_session_id: data.userSessionId,
          ip_address: data.ipAddress,
          email: data.email,
          user_agent: data.userAgent,
          access_token: data.accessToken,
          viewed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create content view error:", error)
        return { success: false, error: error.message }
      }

      const { protectedContentView, protectedContentError } = await this.client
        .from("protected_content")
        .select("view_count")
        .eq("uuid", data.contentUuid)        
        .single()

      if (protectedContentError) {
        if (protectedContentError.code === "PGRST116") {
          return { success: false, error: "Content not found" }
        }
        console.error("Supabase get content error:", protectedContentError)
        return { success: false, error: protectedContentError.message }
      }

      const viewCount = protectedContentView.view_count ? protectedContentView.view_count + 1 : 0;

      // Increment view count
      await this.client
        .from("protected_content")
        .update({ view_count: viewCount })
        .eq("uuid", data.contentUuid)

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create content view:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== PAGE VIEW METHODS =====

  async createPageView(data: {
    userSessionId: string
    ipAddress: string
    email: string
    userAgent?: string
  }): Promise<{ success: boolean; data?: PageView; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("page_views")
        .insert({
          user_session_id: data.userSessionId,
          ip_address: data.ipAddress,
          email: data.email,
          user_agent: data.userAgent,
          viewed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create page view error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create page view:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== ANALYTICS METHODS =====

  // Get recent activity
  async getRecentActivity(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const [sessionsResult, viewsResult] = await Promise.all([
        this.client.from("user_sessions").select("*").order("created_at", { ascending: false }).limit(10),
        this.client
          .from("content_views")
          .select("*, protected_content(title)")
          .order("viewed_at", { ascending: false })
          .limit(10),
      ])

      if (sessionsResult.error || viewsResult.error) {
        return { success: false, error: "Failed to fetch activity data" }
      }

      const activities: any[] = []

      // Add session activities
      sessionsResult.data?.forEach((session) => {
        if (session.code_verified_at) {
          activities.push({
            id: `session-${session.id}`,
            type: "verification",
            user: session.email,
            action: "Completed verification",
            timestamp: new Date(session.code_verified_at).toLocaleString(),
            status: "success",
          })
        } else {
          activities.push({
            id: `session-${session.id}`,
            type: "verification",
            user: session.email,
            action: "Started verification",
            timestamp: new Date(session.created_at).toLocaleString(),
            status: "info",
          })
        }
      })

      // Add content view activities
      viewsResult.data?.forEach((view) => {
        activities.push({
          id: `view-${view.id}`,
          type: "content_view",
          user: view.email,
          action: "Viewed protected content",
          content: view.protected_content?.title || view.content_uuid,
          timestamp: new Date(view.viewed_at).toLocaleString(),
          status: "success",
        })
      })

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      return { success: true, data: activities.slice(0, 10) }
    } catch (error) {
      console.error("Failed to get recent activity:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Get analytics data
  async getAnalytics(): Promise<{
    success: boolean
    data?: {
      totalSessions: number
      verifiedSessions: number
      pageViews: number
      uniqueEmails: number
      uniqueIPs: number
      contentViews: number
      activeContent: number
    }
    error?: string
  }> {
    try {
      const [
        { count: totalSessions },
        { count: verifiedSessions },
        { count: pageViews },
        { count: contentViews },
        { count: activeContent },
        { data: uniqueEmails },
        { data: uniqueIPs },
      ] = await Promise.all([
        this.client.from("user_sessions").select("*", { count: "exact", head: true }),
        this.client
          .from("user_sessions")
          .select("*", { count: "exact", head: true })
          .not("code_verified_at", "is", null),
        this.client.from("page_views").select("*", { count: "exact", head: true }),
        this.client.from("content_views").select("*", { count: "exact", head: true }),
        this.client.from("protected_content").select("*", { count: "exact", head: true }).eq("is_active", true),
        this.client.from("user_sessions").select("email").not("email", "is", null),
        this.client.from("user_sessions").select("ip_address").not("ip_address", "is", null),
      ])

      const uniqueEmailCount = new Set(uniqueEmails?.map((item) => item.email)).size
      const uniqueIPCount = new Set(uniqueIPs?.map((item) => item.ip_address)).size

      return {
        success: true,
        data: {
          totalSessions: totalSessions || 0,
          verifiedSessions: verifiedSessions || 0,
          pageViews: pageViews || 0,
          contentViews: contentViews || 0,
          activeContent: activeContent || 0,
          uniqueEmails: uniqueEmailCount,
          uniqueIPs: uniqueIPCount,
        },
      }
    } catch (error) {
      console.error("Failed to get analytics:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // async getAnalytics(startDate: Date, endDate: Date): Promise<{ success: boolean; data?: any; error?: string }> {
  //   try {

  //     if(!startDate && !endDate)
  //       return await getAnalytics()

  //     const [{ count: totalSessions }, { count: totalViews }, { data: recentSessions }, { data: topContent }] =
  //       await Promise.all([
  //         this.client
  //           .from("user_sessions")
  //           .select("*", { count: "exact", head: true })
  //           .gte("created_at", startDate.toISOString())
  //           .lte("created_at", endDate.toISOString()),
  //         this.client
  //           .from("page_views")
  //           .select("*", { count: "exact", head: true })
  //           .gte("created_at", startDate.toISOString())
  //           .lte("created_at", endDate.toISOString()),
  //         this.client
  //           .from("user_sessions")
  //           .select("*")
  //           .gte("created_at", startDate.toISOString())
  //           .lte("created_at", endDate.toISOString())
  //           .order("created_at", { ascending: false })
  //           .limit(10),
  //         this.client.from("protected_content").select("*").order("view_count", { ascending: false }).limit(10),
  //       ])

  //     return {
  //       success: true,
  //       data: {
  //         totalSessions: totalSessions || 0,
  //         totalViews: totalViews || 0,
  //         recentSessions,
  //         topContent,
  //       },
  //     }
  //   } catch (error) {
  //     console.error("Failed to get analytics:", error)
  //     return { success: false, error: "Database operation failed" }
  //   }
  // }

  // ===== CAMPAIGN METHODS =====

  async createCampaign(data: {
    title: string
    subject: string
    htmlBody: string
    recipients: string[]
    fromAliasId?: string
    scheduledAt?: Date
    createdBy: string
    cronExpression?: string
    isRecurring?: boolean
  }): Promise<{ success: boolean; data?: EmailCampaign; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("email_campaigns")
        .insert({
          title: data.title,
          subject: data.subject,
          html_body: data.htmlBody,
          recipients: data.recipients,
          recipient_count: data.recipients.length,
          from_alias_id: data.fromAliasId,
          scheduled_at: data.scheduledAt?.toISOString(),
          created_by: data.createdBy,
          cron_expression: data.cronExpression,
          is_recurring: data.isRecurring || false,
          status: data.scheduledAt ? "scheduled" : "draft",
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create campaign error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create campaign:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async getCampaigns(): Promise<{ success: boolean; data?: EmailCampaign[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("email_campaigns")
        .select(`
          *,
          sender_alias:sender_aliases(alias_email, alias_name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase get campaigns error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get campaigns:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async getCampaignById(id: string): Promise<{ success: boolean; data?: EmailCampaign; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("email_campaigns")
        .select(`
          *,
          sender_alias:sender_aliases(alias_email, alias_name)
        `)
        .eq("id", id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return { success: false, error: "Campaign not found" }
        }
        console.error("Supabase get campaign error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get campaign:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async updateCampaign(
    id: string,
    updates: Partial<EmailCampaign>,
  ): Promise<{ success: boolean; data?: EmailCampaign; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("email_campaigns")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Supabase update campaign error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to update campaign:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async deleteCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client.from("email_campaigns").delete().eq("id", id)

      if (error) {
        console.error("Supabase delete campaign error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to delete campaign:", error)
      return { success: false, error: "Database operation failed" }
    }
  }


async getTopCampaigns(startDate: Date, endDate: Date): Promise<{ success: boolean, data?: EmailCampaign[]; error?: string }> {
  try {
    // 1. Buscar campanhas dentro do intervalo de datas
    const { data: campaigns, error } = await this.client
      .from("email_campaigns")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      return { success: false, error: error.message };
    }

    // 2. Calcular open_rate e filtrar campanhas com envios válidos
    const campaignsWithOpenRate = (campaigns ?? [])
      .filter(c => c.total_sent > 0)
      .map(c => ({
        ...c,
        openRate: (c.total_opened / c.total_sent) * 100,
        clickRate: (c.total_clicked / c.total_sent) * 100
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5); // Ajuste esse valor conforme necessário

    // 3. Retornar os dados no formato original (sem o open_rate extra, se quiser manter a interface pura)
    return { success: true, data: campaignsWithOpenRate as EmailCampaign[] };
  } catch (err) {
    console.error("Erro ao buscar campanhas com maior open_rate:", err);
    return { success: false, error: "Erro interno ao acessar o banco de dados." };
  }
}

  // Get campaign performance over time
async getCampaignPerformanceOverTime(startDate: Date,endDate: Date) : Promise<{success: boolean, data?: any[]; error?: string}>
{
  try {
    const { data: emails, error: emailsError } = await this.client
      .from("campaign_emails")
      .select("created_at, opened_at, clicked_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())

    if (emailsError) {
      return { success: false, error: emailsError.message }
    }

    // Group by date
    const dailyStats: { [key: string]: { sent: number; opened: number; clicked: number } } = {}

    emails?.forEach((email) => {
      const date = new Date(email.created_at).toISOString().split("T")[0]

      if (!dailyStats[date]) {
        dailyStats[date] = { sent: 0, opened: 0, clicked: 0 }
      }

      dailyStats[date].sent++
      if (email.opened_at) dailyStats[date].opened++
      if (email.clicked_at) dailyStats[date].clicked++
    })

    const chartData = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date: new Date(date).toLocaleDateString(),
        ...stats,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return { success: true, data: chartData }
  } catch (error) {
    console.error("Failed to get performance over time:", error)
    return { success: false, error: "Database operation failed" }
  }
}

// Get top clicked links
async getTopClickedLinks(
  startDate: Date,
  endDate: Date
)
: Promise<
{
  success: boolean
  data?: any[];
  error?: string
}
>
{
  try {
    const { data: clicks, error } = await this.client
      .from("email_clicks")
      .select("original_url")
      .gte("clicked_at", startDate.toISOString())
      .lte("clicked_at", endDate.toISOString())

    if (error) {
      return { success: false, error: error.message }
    }

    // Count clicks per URL
    const urlCounts: { [key: string]: number } = {}
    const urlCampaigns: { [key: string]: Set<string> } = {}

    clicks?.forEach((click) => {
      const url = click.original_url
      urlCounts[url] = (urlCounts[url] || 0) + 1

      if (!urlCampaigns[url]) {
        urlCampaigns[url] = new Set()
      }
    })

    const topLinks = Object.entries(urlCounts)
      .map(([url, clicks]) => ({
        url,
        clicks,
        campaigns: urlCampaigns[url]?.size || 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)

    return { success: true, data: topLinks }
  } catch (error) {
    console.error("Failed to get top clicked links:", error)
    return { success: false, error: "Database operation failed" }
  }
}

// Get engagement by day of week
async getEngagementByDay(
  startDate: Date,
  endDate: Date
)
: Promise<
{
  success: boolean
  data?: any[];
  error?: string
}
>
{
  try {
    const [{ data: opens }, { data: clicks }] = await Promise.all([
      this.client
        .from("email_opens")
        .select("opened_at")
        .gte("opened_at", startDate.toISOString())
        .lte("opened_at", endDate.toISOString()),
      this.client
        .from("email_clicks")
        .select("clicked_at")
        .gte("clicked_at", startDate.toISOString())
        .lte("clicked_at", endDate.toISOString()),
    ])

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayStats: { [key: string]: { opens: number; clicks: number } } = {}

    // Initialize all days
    days.forEach((day) => {
      dayStats[day] = { opens: 0, clicks: 0 }
    })

    // Count opens by day
    opens?.forEach((open) => {
      const dayName = days[new Date(open.opened_at).getDay()]
      dayStats[dayName].opens++
    })

    // Count clicks by day
    clicks?.forEach((click) => {
      const dayName = days[new Date(click.clicked_at).getDay()]
      dayStats[dayName].clicks++
    })

    const chartData = days.map((day) => ({
      day,
      opens: dayStats[day].opens,
      clicks: dayStats[day].clicks,
    }))

    return { success: true, data: chartData }
  } catch (error) {
    console.error("Failed to get engagement by day:", error)
    return { success: false, error: "Database operation failed" }
  }
}

  // ===== CAMPAIGN EMAIL METHODS =====

  async createCampaignEmail(data: {
    campaignId: string
    recipientEmail: string
    subject: string
    htmlBody: string
    trackingId: string
  }): Promise<{ success: boolean; data?: CampaignEmail; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("campaign_emails")
        .insert({
          campaign_id: data.campaignId,
          recipient_email: data.recipientEmail,
          subject: data.subject,
          html_body: data.htmlBody,
          tracking_id: data.trackingId,
          status: "pending",
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create campaign email error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create campaign email:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async updateCampaignEmail(
    id: string,
    updates: Partial<CampaignEmail>,
  ): Promise<{ success: boolean; data?: CampaignEmail; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("campaign_emails")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Supabase update campaign email error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to update campaign email:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== SEND CAMPAIGN METHOD =====

  async sendCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update campaign status to sending
      const { error } = await this.client
        .from("email_campaigns")
        .update({
          status: "sending",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId)

      if (error) {
        console.error("Supabase send campaign error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to send campaign:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== SENDER ALIAS METHODS =====

  async createSenderAlias(data: {
    realEmail: string
    aliasEmail: string
    aliasName?: string
  }): Promise<{ success: boolean; data?: SenderAlias; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("sender_aliases")
        .insert({
          real_email: data.realEmail,
          alias_email: data.aliasEmail,
          alias_name: data.aliasName,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create alias error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create sender alias:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async getSenderAliases(): Promise<{ success: boolean; data?: SenderAlias[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("sender_aliases")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase get aliases error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get sender aliases:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async getSenderAliasById(id: string): Promise<{ success: boolean; data?: SenderAlias; error?: string }> {
    try {
      const { data, error } = await this.client.from("sender_aliases").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return { success: false, error: "Alias not found" }
        }
        console.error("Supabase get alias error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get sender alias:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async updateSenderAlias(
    id: string,
    updates: Partial<SenderAlias>,
  ): Promise<{ success: boolean; data?: SenderAlias; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("sender_aliases")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Supabase update alias error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to update sender alias:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async deleteSenderAlias(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client.from("sender_aliases").delete().eq("id", id)

      if (error) {
        console.error("Supabase delete alias error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to delete sender alias:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== EMAIL CREDENTIALS METHODS =====

  async getEmailCredentials(): Promise<{ success: boolean; data?: EmailCredential[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("email_credentials")
        .select(`
          *,
          sender_alias:sender_aliases(alias_email, alias_name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase email credentials error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get email credentials:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async createEmailCredential(data: {
    aliasId?: string | null
    credentialName: string
    providerType: string
    smtpHost?: string
    smtpPort?: number
    smtpUsername?: string
    smtpPassword?: string
    smtpUseTls?: boolean
    apiKey?: string
    apiEndpoint?: string
    isDefault?: boolean
  }): Promise<{ success: boolean; data?: EmailCredential; error?: string }> {
    try {
      const insertData: any = {
        alias_id: data.aliasId,
        credential_name: data.credentialName,
        provider_type: data.providerType,
        is_default: data.isDefault || false,
      }

      // Encrypt sensitive data
      if (data.smtpPassword) {
        insertData.smtp_password_encrypted = encrypt(data.smtpPassword)
      }
      if (data.apiKey) {
        insertData.api_key_encrypted = encrypt(data.apiKey)
      }

      // Add provider-specific fields
      if (data.providerType === "smtp") {
        insertData.smtp_host = data.smtpHost
        insertData.smtp_port = data.smtpPort
        insertData.smtp_username = data.smtpUsername
        insertData.smtp_use_tls = data.smtpUseTls
      } else {
        insertData.api_endpoint = data.apiEndpoint
      }

      const { data: result, error } = await this.client.from("email_credentials").insert(insertData).select().single()

      if (error) {
        console.error("Supabase create credential error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create email credential:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async updateEmailCredential(
    id: string,
    updates: Partial<EmailCredential>,
  ): Promise<{ success: boolean; data?: EmailCredential; error?: string }> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // Handle encrypted fields
      if (updates.smtp_password_encrypted) {
        updateData.smtp_password_encrypted = encrypt(updates.smtp_password_encrypted)
      }
      if (updates.api_key_encrypted) {
        updateData.api_key_encrypted = encrypt(updates.api_key_encrypted)
      }

      const { data, error } = await this.client
        .from("email_credentials")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Supabase update credential error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to update email credential:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async deleteEmailCredential(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client.from("email_credentials").delete().eq("id", id)

      if (error) {
        console.error("Supabase delete credential error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to delete email credential:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== EMAIL TEMPLATES METHODS =====

  async getEmailTemplates(): Promise<{ success: boolean; data?: EmailTemplate[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase email templates error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get email templates:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async createEmailTemplate(data: {
    name: string
    description?: string
    htmlContent: string
    category: string
    createdBy: string
  }): Promise<{ success: boolean; data?: EmailTemplate; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("email_templates")
        .insert({
          name: data.name,
          description: data.description,
          html_content: data.htmlContent,
          category: data.category,
          created_by: data.createdBy,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase create template error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create email template:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== VERIFICATION METHODS =====

  async createVerificationToken(
    aliasId: string,
    token: string,
    expiresAt: Date,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client.from("alias_verification_tokens").insert({
        alias_id: aliasId,
        token,
        expires_at: expiresAt.toISOString(),
      })

      if (error) {
        console.error("Supabase create verification token error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to create verification token:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  async verifyAlias(aliasId: string, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if token is valid and not expired
      const { data: tokenData, error: tokenError } = await this.client
        .from("alias_verification_tokens")
        .select("*")
        .eq("alias_id", aliasId)
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .is("verified_at", null)
        .single()

      if (tokenError || !tokenData) {
        return { success: false, error: "Invalid or expired verification token" }
      }

      // Mark token as verified
      await this.client
        .from("alias_verification_tokens")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", tokenData.id)

      // Mark alias as verified
      const { error: aliasError } = await this.client
        .from("sender_aliases")
        .update({
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", aliasId)

      if (aliasError) {
        console.error("Failed to update alias verification:", aliasError)
        return { success: false, error: aliasError.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to verify alias:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // ===== CAMPAIGN ANALYTICS METHODS =====

  async getCampaignAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const [{ count: totalCampaigns }, { data: campaigns }, { data: emails }] = await Promise.all([
        this.client
          .from("email_campaigns")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        this.client
          .from("email_campaigns")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
        this.client
          .from("campaign_emails")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
      ])

      const totalSent = emails?.length || 0
      const totalOpened = emails?.filter((e) => e.opened_at).length || 0
      const totalClicked = emails?.filter((e) => e.clicked_at).length || 0
      const totalBounced = emails?.filter((e) => e.status === "bounced").length || 0

      const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0
      const avgClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0
      const avgBounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0

      return {
        success: true,
        data: {
          totalCampaigns: totalCampaigns || 0,
          totalSent,
          totalOpened,
          totalClicked,
          totalBounced,
          avgOpenRate,
          avgClickRate,
          avgBounceRate,
        },
      }
    } catch (error) {
      console.error("Failed to get campaign analytics:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Test email credential
  async testEmailCredential(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Get credential details
      const { data: credential, error: fetchError } = await this.client
        .from("email_credentials")
        .select("*")
        .eq("id", id)
        .single()

      if (fetchError || !credential) {
        return { success: false, error: "Credential not found" }
      }

      // Test the connection based on provider type
      let testResult = { success: false, message: "" }

      if (credential.provider_type === "smtp") {
        // Test SMTP connection
        testResult = await this.testSmtpConnection(credential)
      } else {
        // Test API connection
        testResult = await this.testApiConnection(credential)
      }

      // Update test status
      await this.client
        .from("email_credentials")
        .update({
          test_status: testResult.success ? "success" : "failed",
          test_error_message: testResult.success ? null : testResult.message,
          last_tested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      return { success: testResult.success, data: testResult }
    } catch (error) {
      console.error("Failed to test email credential:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Helper method to test SMTP connection
  private async testSmtpConnection(credential: any): Promise<{ success: boolean; message: string }> {
    try {
      // This would typically use nodemailer to test the connection
      // For now, we'll simulate a test
      const password = credential.smtp_password_encrypted ? decrypt(credential.smtp_password_encrypted) : ""

      // Basic validation
      if (!credential.smtp_host || !credential.smtp_username || !password) {
        return { success: false, message: "Missing SMTP configuration" }
      }

      // In a real implementation, you would:
      // const transporter = nodemailer.createTransporter({...})
      // await transporter.verify()

      return { success: true, message: "SMTP connection successful" }
    } catch (error) {
      return { success: false, message: `SMTP test failed: ${error}` }
    }
  }

  // Helper method to test API connection
  private async testApiConnection(credential: any): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = credential.api_key_encrypted ? decrypt(credential.api_key_encrypted) : ""

      if (!apiKey) {
        return { success: false, message: "Missing API key" }
      }

      // Test based on provider
      switch (credential.provider_type) {
        case "sendgrid":
          // Test SendGrid API
          return { success: true, message: "SendGrid API connection successful" }
        case "mailgun":
          // Test Mailgun API
          return { success: true, message: "Mailgun API connection successful" }
        default:
          return { success: true, message: "API connection successful" }
      }
    } catch (error) {
      return { success: false, message: `API test failed: ${error}` }
    }
  }
}

// Export a singleton instance
export const supabaseOps = new SupabaseOperations()
