import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { setSessionCookie, verifyPassword } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }
  
  // Require strong password (minimum production standards)
  if (password.length < 8) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) {
    // Don't reveal if email exists (security best practice)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  
  // Verify password using bcrypt
  const passwordValid = await verifyPassword(password, user.password)
  if (!passwordValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }
  
  const response = NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    headline: user.headline,
    role: user.role,
  })
  setSessionCookie(response, user.id)
  return response
}
