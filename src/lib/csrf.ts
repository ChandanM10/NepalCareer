/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Prevents unauthorized state-changing requests from other domains
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Secret key for HMAC signing (in production, use environment variable)
const CSRF_SECRET = process.env.CSRF_SECRET || "default-csrf-secret-change-in-production"

/**
 * Generate a CSRF token
 * Token is a random string signed with HMAC
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString("hex")
  const timestamp = Date.now().toString()
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(`${token}-${timestamp}`)
    .digest("hex")
  return `${token}.${timestamp}.${signature}`
}

/**
 * Verify a CSRF token
 * Returns true if token is valid and not expired (30 minutes)
 */
export function verifyCSRFToken(token: string): boolean {
  try {
    const [tokenPart, timestampPart, signature] = token.split(".")

    if (!tokenPart || !timestampPart || !signature) {
      return false
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", CSRF_SECRET)
      .update(`${tokenPart}-${timestampPart}`)
      .digest("hex")

    if (signature !== expectedSignature) {
      return false
    }

    // Check token expiration (30 minutes)
    const timestamp = parseInt(timestampPart, 10)
    const now = Date.now()
    const maxAge = 30 * 60 * 1000 // 30 minutes

    if (isNaN(timestamp) || now - timestamp > maxAge) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * CSRF validation middleware for Next.js API routes
 * Checks for valid CSRF token in request headers or body
 */
export async function validateCSRFToken(req: NextRequest): Promise<boolean> {
  // Only validate state-changing methods
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return true
  }

  // Allow internal Next.js requests
  if (req.headers.get("x-internal-next.js") === "true") {
    return true
  }

  // Skip CSRF validation in development (optional)
  if (process.env.NODE_ENV === "development" && process.env.SKIP_CSRF_VALIDATION === "true") {
    return true
  }

  // Check for CSRF token in header or body
  let token = req.headers.get("x-csrf-token")

  if (!token && req.method !== "GET") {
    try {
      const body = await req.json().catch(() => ({}))
      token = body._csrf || body.csrf_token
    } catch {
      // If body is not JSON, token must be in header
    }
  }

  if (!token) {
    return false
  }

  return verifyCSRFToken(token)
}

/**
 * Helper to create CSRF error response
 */
export function createCSRFErrorResponse() {
  return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
}
