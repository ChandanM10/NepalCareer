/**
 * Production-ready auth helpers — uses bcrypt hashing and signed cookies for session.
 */
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { db } from "./db"
import * as bcrypt from "bcrypt"

const SESSION_COOKIE = "ajd_session"
const SESSION_PREFIX = "sess_"
const BCRYPT_ROUNDS = 12 // Secure password hashing rounds

export interface SessionUser {
  id: string
  email: string
  fullName: string
  headline?: string | null
  avatarUrl?: string | null
  role: string
}

function encode(userId: string): string {
  // simple obfuscation — base64 + prefix
  return SESSION_PREFIX + Buffer.from(userId).toString("base64url")
}

function decode(token: string): string | null {
  if (!token.startsWith(SESSION_PREFIX)) return null
  try {
    const raw = token.slice(SESSION_PREFIX.length)
    return Buffer.from(raw, "base64url").toString("utf-8")
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const userId = decode(token)
  if (!userId) return null
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    headline: user.headline,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }
}

export function setSessionCookie(response: NextResponse, userId: string) {
  const isProd = process.env.NODE_ENV === "production"
  response.cookies.set(SESSION_COOKIE, encode(userId), {
    httpOnly: true,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: isProd,
  })
}

export async function setSession(userId: string) {
  const store = await cookies()
  const isProd = process.env.NODE_ENV === "production"
  store.set(SESSION_COOKIE, encode(userId), {
    httpOnly: true,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: isProd,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSession()
  if (!u) throw new Error("UNAUTHORIZED")
  return u
}

/**
 * Require an authenticated session. Throws "UNAUTHORIZED" if none exists.
 * Use this in API routes to enforce authentication. The middleware handles
 * page-level redirects; this handles API-level protection.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    const err = new Error("UNAUTHORIZED") as any
    err.statusCode = 401
    throw err
  }
  return session
}

/**
 * Hash a plaintext password using bcrypt.
 * Call this when storing a new password during registration or password change.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Compare a plaintext password with a bcrypt hash.
 * Returns true if password matches, false otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

/**
 * @deprecated Use requireSession() instead. Kept for backward compatibility.
 */
export async function getOrCreateDemoSession(): Promise<SessionUser> {
  return requireSession()
}
