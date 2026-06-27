import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const fullUser = await db.user.findUnique({ where: { id: user.id } })
  if (!fullUser) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    settings: {
      fullName: fullUser.fullName,
      email: fullUser.email,
      headline: fullUser.headline,
      bio: fullUser.bio,
      location: fullUser.location,
      whatsappNumber: fullUser.whatsappNumber,
      phoneCountry: fullUser.phoneCountry,
      notifyWhatsapp: fullUser.notifyWhatsapp,
      notifyEmail: fullUser.notifyEmail,
      notifyInApp: fullUser.notifyInApp,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const allowed = ["whatsappNumber", "phoneCountry", "notifyWhatsapp", "notifyEmail", "notifyInApp", "headline", "bio", "location", "fullName"]
  const update: any = {}
  for (const k of allowed) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  // Validate WhatsApp number format if provided (E.164-ish)
  if (update.whatsappNumber && !/^\+?\d{7,15}$/.test(update.whatsappNumber)) {
    return NextResponse.json({ error: "Invalid WhatsApp number format. Use E.164 (e.g. +97798XXXXXXXX)" }, { status: 400 })
  }
  const updated = await db.user.update({ where: { id: user.id }, data: update })
  return NextResponse.json({
    ok: true,
    settings: {
      fullName: updated.fullName,
      email: updated.email,
      headline: updated.headline,
      bio: updated.bio,
      location: updated.location,
      whatsappNumber: updated.whatsappNumber,
      phoneCountry: updated.phoneCountry,
      notifyWhatsapp: updated.notifyWhatsapp,
      notifyEmail: updated.notifyEmail,
      notifyInApp: updated.notifyInApp,
    },
  })
}
