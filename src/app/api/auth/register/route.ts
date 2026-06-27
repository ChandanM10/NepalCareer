import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { setSessionCookie, hashPassword } from "@/lib/auth"

export const dynamic = "force-dynamic"

/**
 * Validate password strength for production deployments.
 * Requirements: 8+ chars, uppercase, lowercase, number, special char
 */
function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters" }
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain uppercase letter" }
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must contain lowercase letter" }
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain number" }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: "Password must contain special character" }
  return { valid: true }
}

export async function POST(req: NextRequest) {
  const { email, password, fullName, headline } = await req.json().catch(() => ({}))
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Email, password, and full name required" }, { status: 400 })
  }
  
  // Validate password strength for production
  const passwordCheck = validatePasswordStrength(password)
  if (!passwordCheck.valid) {
    return NextResponse.json({ error: passwordCheck.message || "Password too weak" }, { status: 400 })
  }
  
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }
  
  // Hash password using bcrypt before storage
  const hashedPassword = await hashPassword(password)
  
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      headline: headline || null,
    },
  })
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
