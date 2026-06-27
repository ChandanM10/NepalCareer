import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Verify admin role
  const fullUser = await db.user.findUnique({ where: { id: user.id } })
  if (!fullUser || fullUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const update: any = {}
  for (const k of ["title", "description", "status", "featured", "urgent", "salaryMin", "salaryMax", "seniority", "remoteStatus", "employmentType", "visaSponsor"]) {
    if (body[k] !== undefined) update[k] = body[k]
  }
  const job = await db.job.update({ where: { id }, data: update })
  return NextResponse.json({ ok: true, job })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Verify admin role
  const fullUser = await db.user.findUnique({ where: { id: user.id } })
  if (!fullUser || fullUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }
  await db.job.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
