import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const alert = await db.alert.findUnique({ where: { id } })
  if (!alert || alert.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  
  return NextResponse.json({
    alert: {
      id: alert.id,
      name: alert.name,
      query: alert.query,
      filters: JSON.parse(alert.filters || "{}"),
      frequency: alert.frequency,
      active: alert.active,
      lastTriggeredAt: alert.lastTriggeredAt,
      matchCount: alert.matchCount,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    },
  })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Verify ownership before updating
  const alert = await db.alert.findUnique({ where: { id } })
  if (!alert || alert.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  
  const body = await req.json().catch(() => ({}))
  
  // At least one field must be provided
  if (body.active === undefined && !body.name && !body.query && !body.frequency && !body.filters) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }
  
  const updated = await db.alert.update({
    where: { id },
    data: {
      ...(body.active !== undefined && { active: body.active }),
      ...(body.name && { name: body.name }),
      ...(body.query && { query: body.query }),
      ...(body.frequency && { frequency: body.frequency }),
      ...(body.filters && { filters: JSON.stringify(body.filters) }),
    },
  })
  
  // Log activity
  await db.activity.create({
    data: {
      userId: user.id,
      type: "updated_alert",
      title: `Updated alert: ${updated.name}`,
      meta: JSON.stringify({ alertId: id }),
    },
  })
  
  return NextResponse.json({ 
    ok: true, 
    alert: {
      id: updated.id,
      name: updated.name,
      query: updated.query,
      filters: JSON.parse(updated.filters || "{}"),
      frequency: updated.frequency,
      active: updated.active,
      updatedAt: updated.updatedAt,
    }
  })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Verify ownership before deleting
  const alert = await db.alert.findUnique({ where: { id } })
  if (!alert || alert.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  
  await db.alert.delete({ where: { id } })
  
  // Log activity
  await db.activity.create({
    data: {
      userId: user.id,
      type: "deleted_alert",
      title: `Deleted alert: ${alert.name}`,
      meta: JSON.stringify({ alertId: id }),
    },
  })
  
  return NextResponse.json({ ok: true })
}
