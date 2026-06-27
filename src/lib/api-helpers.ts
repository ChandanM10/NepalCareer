import { NextResponse } from "next/server"
import { getSession, type SessionUser } from "@/lib/auth"

/**
 * Require an authenticated session. Returns [user, null] on success,
 * or [null, response401] if not authenticated.
 *
 * Usage in API routes:
 *   const [user, error] = await requireSessionOr401()
 *   if (error) return error
 *   // use user.id, user.email, etc.
 */
export async function requireSessionOr401(): Promise<[SessionUser, null] | [null, NextResponse]> {
  try {
    const session = await getSession()
    if (!session) {
      return [null, NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })]
    }
    return [session, null]
  } catch {
    return [null, NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })]
  }
}

/**
 * Handle API errors consistently.
 */
export function handleApiError(e: any): NextResponse {
  if (e?.message === "UNAUTHORIZED" || e?.statusCode === 401) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
  }
  console.error("[api] error:", e)
  return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 })
}
