import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray, parseJsonObject } from "@/lib/format"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const notifs = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  const unread = await db.notification.count({ where: { userId: user.id, read: false } })
  return NextResponse.json({
    notifications: notifs.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      meta: parseJsonObject(n.meta),
      channels: parseJsonArray(n.channels),
      deliveryLog: parseJsonArray(n.deliveryLog),
      read: n.read,
      createdAt: n.createdAt,
    })),
    unread,
  })
}

/**
 * PATCH /api/notifications - Mark specific notifications as read or mark all as read
 * Body: { notificationIds?: string[] } - if empty, marks all as read
 */
export async function PATCH(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const body = await req.json().catch(() => ({}))
  const { notificationIds } = body
  
  if (!notificationIds || notificationIds.length === 0) {
    // Mark ALL notifications as read
    await db.notification.updateMany({
      where: { userId: user.id },
      data: { read: true },
    })
    return NextResponse.json({ ok: true, message: "All notifications marked as read" })
  }
  
  // Mark specific notifications as read (only user's own notifications)
  const updated = await db.notification.updateMany({
    where: { 
      id: { in: notificationIds },
      userId: user.id 
    },
    data: { read: true },
  })
  
  return NextResponse.json({ ok: true, count: updated.count })
}

/**
 * POST /api/notifications - Create a test notification or send notifications
 * This endpoint is typically called by internal processes, not users
 */
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const body = await req.json().catch(() => ({}))
  const { type, title, body: notifBody, channels = ["in_app"], meta = {} } = body
  
  if (!type || !title || !notifBody) {
    return NextResponse.json({ error: "type, title, and body required" }, { status: 400 })
  }
  
  const notif = await db.notification.create({
    data: {
      userId: user.id,
      type,
      title,
      body: notifBody,
      channels: JSON.stringify(channels),
      meta: JSON.stringify(meta),
      deliveryLog: JSON.stringify([]),
      read: false,
    },
  })
  
  return NextResponse.json({
    ok: true,
    notification: {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      channels: parseJsonArray(notif.channels),
      createdAt: notif.createdAt,
    },
  })
}
