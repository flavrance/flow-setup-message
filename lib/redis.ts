import { Redis } from "@upstash/redis"

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Redis key prefixes for organization
export const REDIS_KEYS = {
  IP_RATE_LIMIT: "rate_limit:ip:",
  EMAIL_RATE_LIMIT: "rate_limit:email:",
  SESSION_ATTEMPTS: "attempts:session:",
  VERIFICATION_CODE: "verification:",
  ACCESS_TOKEN: "access_token:",
} as const

// Rate limiting data structure
export interface RateLimitData {
  count: number
  resetTime: number
}

export interface SessionAttemptData {
  count: number
  lockedUntil?: number
}

export interface VerificationData {
  code: string
  email: string
  phone: string
  expiresAt: number
  targetContentUuid?: string | null // Add target content UUID
}

// Redis operations with error handling
export class RedisRateLimit {
  // Check and update rate limit
  static async checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    try {
      const now = Date.now()
      const redisKey = key

      // Get current rate limit data
      const data = await redis.get<RateLimitData>(redisKey)

      if (!data || now > data.resetTime) {
        // First request or window expired - reset counter
        const resetTime = now + windowMs
        const newData: RateLimitData = { count: 1, resetTime }

        // Set with expiration
        await redis.setex(redisKey, Math.ceil(windowMs / 1000), newData)

        return { allowed: true, resetTime, remaining: maxRequests - 1 }
      }

      if (data.count >= maxRequests) {
        // Rate limit exceeded
        return { allowed: false, resetTime: data.resetTime, remaining: 0 }
      }

      // Increment counter atomically
      const newData: RateLimitData = { count: data.count + 1, resetTime: data.resetTime }
      const ttl = Math.ceil((data.resetTime - now) / 1000)

      await redis.setex(redisKey, ttl, newData)

      return { allowed: true, resetTime: data.resetTime, remaining: maxRequests - newData.count }
    } catch (error) {
      console.error("Redis rate limit check failed:", error)
      // Fallback: allow request if Redis is down
      return { allowed: true, resetTime: Date.now() + windowMs, remaining: maxRequests - 1 }
    }
  }

  // Check and update session attempts
  static async checkSessionAttempts(
    sessionId: string,
    maxAttempts: number,
    lockDuration: number,
  ): Promise<{ allowed: boolean; attemptsRemaining: number; lockedUntil?: number }> {
    try {
      const now = Date.now()
      const redisKey = REDIS_KEYS.SESSION_ATTEMPTS + sessionId

      // Get current attempt data
      const data = await redis.get<SessionAttemptData>(redisKey)

      if (!data) {
        // First attempt
        const newData: SessionAttemptData = { count: 1 }
        await redis.setex(redisKey, Math.ceil(lockDuration / 1000), newData)
        return { allowed: true, attemptsRemaining: maxAttempts - 1 }
      }

      // Check if session is locked
      if (data.lockedUntil && now < data.lockedUntil) {
        return { allowed: false, attemptsRemaining: 0, lockedUntil: data.lockedUntil }
      }

      // Reset if lock has expired
      if (data.lockedUntil && now >= data.lockedUntil) {
        const newData: SessionAttemptData = { count: 1 }
        await redis.setex(redisKey, Math.ceil(lockDuration / 1000), newData)
        return { allowed: true, attemptsRemaining: maxAttempts - 1 }
      }

      if (data.count >= maxAttempts) {
        // Lock the session
        const lockedUntil = now + lockDuration
        const newData: SessionAttemptData = { count: data.count, lockedUntil }
        await redis.setex(redisKey, Math.ceil(lockDuration / 1000), newData)
        return { allowed: false, attemptsRemaining: 0, lockedUntil }
      }

      // Increment attempts
      const newData: SessionAttemptData = { count: data.count + 1, lockedUntil: data.lockedUntil }
      const ttl = Math.ceil(lockDuration / 1000)
      await redis.setex(redisKey, ttl, newData)

      return { allowed: true, attemptsRemaining: maxAttempts - newData.count }
    } catch (error) {
      console.error("Redis session attempts check failed:", error)
      // Fallback: allow attempt if Redis is down
      return { allowed: true, attemptsRemaining: maxAttempts - 1 }
    }
  }

  // Store verification code
  static async storeVerificationCode(sessionId: string, data: VerificationData, ttlSeconds: number): Promise<boolean> {
    try {
      const redisKey = REDIS_KEYS.VERIFICATION_CODE + sessionId
      await redis.setex(redisKey, ttlSeconds, data)
      return true
    } catch (error) {
      console.error("Failed to store verification code:", error)
      return false
    }
  }

  // Get verification code
  static async getVerificationCode(sessionId: string): Promise<VerificationData | null> {
    try {
      const redisKey = REDIS_KEYS.VERIFICATION_CODE + sessionId
      return await redis.get<VerificationData>(redisKey)
    } catch (error) {
      console.error("Failed to get verification code:", error)
      return null
    }
  }

  // Delete verification code
  static async deleteVerificationCode(sessionId: string): Promise<boolean> {
    try {
      const redisKey = REDIS_KEYS.VERIFICATION_CODE + sessionId
      await redis.del(redisKey)
      return true
    } catch (error) {
      console.error("Failed to delete verification code:", error)
      return false
    }
  }

  // Delete session attempts
  static async deleteSessionAttempts(sessionId: string): Promise<boolean> {
    try {
      const redisKey = REDIS_KEYS.SESSION_ATTEMPTS + sessionId
      await redis.del(redisKey)
      return true
    } catch (error) {
      console.error("Failed to delete session attempts:", error)
      return false
    }
  }

  // Store access token with target content UUID
  static async storeAccessToken(token: string, targetContentUuid?: string | null, ttlSeconds = 3600): Promise<boolean> {
    try {
      const redisKey = REDIS_KEYS.ACCESS_TOKEN + token
      await redis.setex(redisKey, ttlSeconds, {
        created: Date.now(),
        targetContentUuid: targetContentUuid || null,
      })
      return true
    } catch (error) {
      console.error("Failed to store access token:", error)
      return false
    }
  }

  // Check if access token exists and get target content UUID
  static async validateAccessToken(token: string): Promise<{ valid: boolean; targetContentUuid?: string | null }> {
    try {
      const redisKey = REDIS_KEYS.ACCESS_TOKEN + token
      const data = await redis.get<{ created: number; targetContentUuid?: string | null }>(redisKey)

      if (!data) {
        return { valid: false }
      }

      return {
        valid: true,
        targetContentUuid: data.targetContentUuid || null,
      }
    } catch (error) {
      console.error("Failed to validate access token:", error)
      return { valid: false }
    }
  }
}

export default redis
