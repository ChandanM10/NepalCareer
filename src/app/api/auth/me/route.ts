import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Only return user if a session already exists — do NOT auto-create
    const session = await getSession()
    if (!session) return NextResponse.json({ user: null })
    const user = await db.user.findUnique({ where: { id: session.id } })
    if (!user) return NextResponse.json({ user: null })
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        headline: user.headline,
        bio: user.bio,
        location: user.location,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
