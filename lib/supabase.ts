import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes)
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
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

// Database operations
export class SupabaseOperations {
  private client = createServerClient()

  // Create a new user session record
  async createUserSession(data: {
    ip_address: string
    email: string
    phone_number: string
    session_id: string
  }): Promise<{ success: boolean; data?: UserSession; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("user_sessions")
        .insert({
          ip_address: data.ip_address,
          email: data.email.toLowerCase(),
          phone_number: data.phone_number,
          session_id: data.session_id,
          verification_code_sent_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase insert error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create user session:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Update session when code is verified
  async markCodeVerified(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client
        .from("user_sessions")
        .update({
          code_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)

      if (error) {
        console.error("Supabase update error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to mark code verified:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Get protected content by UUID
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
        console.error("Supabase select error:", error)
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

  // Record content view
  async recordContentView(data: {
    contentUuid: string
    accessToken: string
    ipAddress: string
    userAgent?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // First, try to find the user session by looking for recent verified sessions
      // This is a simplified approach - in production you'd want to store session mapping with access tokens
      const { data: recentSession, error: sessionError } = await this.client
        .from("user_sessions")
        .select("id, email")
        .not("code_verified_at", "is", null)
        .order("code_verified_at", { ascending: false })
        .limit(1)
        .single()

      if (sessionError || !recentSession) {
        console.error("Could not find user session for content view")
        // Continue anyway with a placeholder
      }

      // Insert content view record
      const { error: insertError } = await this.client.from("content_views").insert({
        content_uuid: data.contentUuid,
        user_session_id: recentSession?.id || null,
        ip_address: data.ipAddress,
        email: recentSession?.email || "unknown",
        viewed_at: new Date().toISOString(),
        user_agent: data.userAgent,
        access_token: data.accessToken.substring(0, 16), // Store partial token for tracking
      })

      if (insertError) {
        console.error("Supabase content view insert error:", insertError)
        return { success: false, error: insertError.message }
      }

      // Increment view count for the content
      const { error: updateError } = await this.client
        .from("protected_content")
        .update({
          view_count: this.client.raw("view_count + 1"),
          updated_at: new Date().toISOString(),
        })
        .eq("uuid", data.contentUuid)

      if (updateError) {
        console.error("Failed to increment view count:", updateError)
        // Don't fail the request for this
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to record content view:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Record protected page view (legacy method)
  async recordPageView(data: {
    sessionId: string
    ipAddress: string
    userAgent?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the user session to get email
      const { data: userSession, error: sessionError } = await this.client
        .from("user_sessions")
        .select("id, email")
        .eq("session_id", data.sessionId)
        .single()

      if (sessionError || !userSession) {
        return { success: false, error: "User session not found" }
      }

      // Update user session with protected page view timestamp
      const { error: updateError } = await this.client
        .from("user_sessions")
        .update({
          protected_page_viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", data.sessionId)

      if (updateError) {
        console.error("Failed to update user session:", updateError)
      }

      // Insert page view record
      const { error: insertError } = await this.client.from("page_views").insert({
        user_session_id: userSession.id,
        ip_address: data.ipAddress,
        email: userSession.email,
        viewed_at: new Date().toISOString(),
        user_agent: data.userAgent,
      })

      if (insertError) {
        console.error("Supabase page view insert error:", insertError)
        return { success: false, error: insertError.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to record page view:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Get user session by session ID
  async getUserSession(sessionId: string): Promise<{ success: boolean; data?: UserSession; error?: string }> {
    try {
      const { data, error } = await this.client.from("user_sessions").select("*").eq("session_id", sessionId).single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get user session:", error)
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

  // Create new protected content
  async createProtectedContent(data: {
    uuid: string
    title: string
    content_html: string
    expires_at?: string
    metadata?: Record<string, any>
  }): Promise<{ success: boolean; data?: ProtectedContent; error?: string }> {
    try {
      const { data: result, error } = await this.client
        .from("protected_content")
        .insert({
          uuid: data.uuid,
          title: data.title,
          content_html: data.content_html,
          expires_at: data.expires_at,
          metadata: data.metadata || {},
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase insert error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to create protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Get all protected content for admin
  async getAllProtectedContent(): Promise<{ success: boolean; data?: ProtectedContent[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("protected_content")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase select error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get all protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Update protected content
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
        console.error("Supabase update error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to update protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Delete protected content
  async deleteProtectedContent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.client.from("protected_content").delete().eq("id", id)

      if (error) {
        console.error("Supabase delete error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Failed to delete protected content:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Get protected content by ID (for editing)
  async getProtectedContentById(id: string): Promise<{ success: boolean; data?: ProtectedContent; error?: string }> {
    try {
      const { data, error } = await this.client.from("protected_content").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return { success: false, error: "Content not found" }
        }
        console.error("Supabase select error:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Failed to get protected content by ID:", error)
      return { success: false, error: "Database operation failed" }
    }
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

  // Get session statistics
  async getSessionStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      const [{ count: activeSessions }, { count: verifiedToday }, { data: allSessions }, { data: uniqueIPs }] =
        await Promise.all([
          this.client
            .from("user_sessions")
            .select("*", { count: "exact", head: true })
            .is("code_verified_at", null)
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          this.client
            .from("user_sessions")
            .select("*", { count: "exact", head: true })
            .not("code_verified_at", "is", null)
            .gte("code_verified_at", todayISO),
          this.client.from("user_sessions").select("created_at, code_verified_at").not("code_verified_at", "is", null),
          this.client.from("user_sessions").select("ip_address").not("ip_address", "is", null),
        ])

      // Calculate average duration
      let avgDuration = 0
      if (allSessions && allSessions.length > 0) {
        const durations = allSessions
          .filter((s) => s.code_verified_at)
          .map((s) => new Date(s.code_verified_at).getTime() - new Date(s.created_at).getTime())

        if (durations.length > 0) {
          avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
        }
      }

      const uniqueIPCount = new Set(uniqueIPs?.map((item) => item.ip_address)).size

      return {
        success: true,
        data: {
          activeSessions: activeSessions || 0,
          verifiedToday: verifiedToday || 0,
          avgDuration: avgDuration,
          uniqueIPs: uniqueIPCount,
        },
      }
    } catch (error) {
      console.error("Failed to get session stats:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Get all sessions for admin
  async getAllSessions(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("user_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Supabase sessions error:", error)
        return { success: false, error: error.message }
      }

      // Add status to each session
      const sessionsWithStatus = data?.map((session) => {
        let status = "pending"
        if (session.code_verified_at) {
          status = "verified"
        } else if (new Date(session.created_at) < new Date(Date.now() - 10 * 60 * 1000)) {
          // Consider sessions older than 10 minutes as expired if not verified
          status = "expired"
        }

        return {
          ...session,
          status,
        }
      })

      return { success: true, data: sessionsWithStatus }
    } catch (error) {
      console.error("Failed to get all sessions:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Get view statistics
  async getViewStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      const [{ count: totalViews }, { count: todayViews }, { data: contentViews }, { data: allViews }] =
        await Promise.all([
          this.client.from("content_views").select("*", { count: "exact", head: true }),
          this.client.from("content_views").select("*", { count: "exact", head: true }).gte("viewed_at", todayISO),
          this.client.from("content_views").select(`
          content_uuid,
          protected_content!inner(title)
        `),
          this.client.from("content_views").select("viewed_at"),
        ])

      // Find most viewed content
      let mostViewed = ""
      if (contentViews && contentViews.length > 0) {
        const viewCounts: { [key: string]: number } = {}
        contentViews.forEach((view) => {
          const title = view.protected_content?.title || view.content_uuid
          viewCounts[title] = (viewCounts[title] || 0) + 1
        })

        const sortedContent = Object.entries(viewCounts).sort(([, a], [, b]) => b - a)
        if (sortedContent.length > 0) {
          mostViewed = sortedContent[0][0]
        }
      }

      // Calculate average view time (mock for now - would need session tracking)
      const avgViewTime = allViews && allViews.length > 0 ? 240 : 0 // 4 minutes average

      return {
        success: true,
        data: {
          totalViews: totalViews || 0,
          todayViews: todayViews || 0,
          avgViewTime,
          mostViewed,
        },
      }
    } catch (error) {
      console.error("Failed to get view stats:", error)
      return { success: false, error: "Database operation failed" }
    }
  }

  // Get all page views for admin
  async getAllPageViews(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await this.client
        .from("content_views")
        .select(`
        *,
        protected_content!inner(title)
      `)
        .order("viewed_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Supabase page views error:", error)
        return { success: false, error: error.message }
      }

      const viewsWithTitle = data?.map((view) => ({
        ...view,
        content_title: view.protected_content?.title || "Unknown Content",
      }))

      return { success: true, data: viewsWithTitle }
    } catch (error) {
      console.error("Failed to get all page views:", error)
      return { success: false, error: "Database operation failed" }
    }
  }
}
