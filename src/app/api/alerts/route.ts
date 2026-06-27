import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const alerts = await db.alert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      name: a.name,
      query: a.query,
      filters: JSON.parse(a.filters || "{}"),
      frequency: a.frequency,
      active: a.active,
      lastTriggeredAt: a.lastTriggeredAt,
      matchCount: a.matchCount,
      createdAt: a.createdAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { name, query, filters, frequency } = body
  if (!name || !query) return NextResponse.json({ error: "name and query required" }, { status: 400 })

  const created = await db.alert.create({
    data: {
      userId: user.id,
      name,
      query,
      filters: JSON.stringify(filters || {}),
      frequency: frequency || "instant",
      matchCount: 0,
    },
  })
  await db.activity.create({
    data: {
      userId: user.id,
      type: "created_alert",
      title: `Created alert: ${name}`,
      meta: JSON.stringify({ alertId: created.id }),
    },
  })
  return NextResponse.json({ ok: true, alert: created })
}
