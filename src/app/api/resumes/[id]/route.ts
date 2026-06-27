import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db.resume.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (body.makePrimary) {
    await db.resume.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    })
    await db.resume.updateMany({
      where: { id, userId: user.id },
      data: { isPrimary: true },
    })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 })
}
