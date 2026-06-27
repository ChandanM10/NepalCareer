import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const thread = await db.chatThread.findFirst({ where: { id, userId: user.id } })
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    id: thread.id,
    title: thread.title,
    messages: JSON.parse(thread.messages || "[]"),
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
  })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db.chatThread.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ ok: true })
}
