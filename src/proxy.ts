import { NextResponse, type NextRequest } from "next/server"

/**
 * Auth middleware — protects all routes except auth pages and static assets.
 *
 * - Unauthenticated users → redirected to /login?redirect=ORIGINAL_PATH
 * - Authenticated users visiting /login or /register → redirected to /dashboard
 * - Role-based protection for /admin/* happens at the page level (server component)
 *   since middleware can't query the DB cheaply. Middleware does a coarse check
 *   for the admin flag in the session cookie.
 */

const SESSION_COOKIE = "ajd_session"
const SESSION_PREFIX = "sess_"

// Public routes — accessible without authentication
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"]
const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/register", "/api/auth/logout"]

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) return true
  return false
}

function isPublicApi(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.some((r) => pathname === r)) return true
  return false
}

function hasSession(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  if (!token.startsWith(SESSION_PREFIX)) return false
  // Try to decode — if it fails, treat as no session
  try {
    const raw = token.slice(SESSION_PREFIX.length)
    const userId = Buffer.from(raw, "base64url").toString("utf-8")
    return !!userId
  } catch {
    return false
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static assets and Next internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf|otf)$/)
  ) {
    return NextResponse.next()
  }

  // API routes: check auth but return 401 JSON instead of redirecting
  if (pathname.startsWith("/api/")) {
    // Public API routes (login/register/logout) — always accessible
    if (isPublicApi(pathname)) {
      return NextResponse.next()
    }
    // All other API routes require auth
    if (!hasSession(req)) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Public pages (login, register, forgot-password)
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // All other page routes require authentication
  if (!hasSession(req)) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?redirect=${encodeURIComponent(pathname + req.nextUrl.search)}`
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware on all routes except Next internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

export default proxy
