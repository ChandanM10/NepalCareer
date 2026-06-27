import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendNotification } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fullUser = await db.user.findUnique({ where: { id: user.id } })
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const channels: string[] = []
    if (fullUser.notifyInApp) channels.push("in_app")
    if (fullUser.notifyEmail) channels.push("email")
    if (fullUser.notifyWhatsapp && fullUser.whatsappNumber) channels.push("whatsapp")

    if (channels.length === 0) {
      return NextResponse.json({ error: "No notification channels enabled. Enable in-app, email, or WhatsApp in settings." }, { status: 400 })
    }

    const notif = await db.notification.create({
      data: {
        userId: user.id,
        type: "test",
        title: "Test notification",
        body: "This is a test notification from NepalCareer. If you're seeing this, notifications are working!",
        channels: JSON.stringify(channels),
        meta: JSON.stringify({}),
        deliveryLog: JSON.stringify([]),
        read: false,
      },
    })

    await sendNotification(
      user.id,
      notif.id,
      "Test notification",
      "This is a test notification from NepalCareer. If you're seeing this, notifications are working!",
      channels,
      fullUser.email,
      fullUser.whatsappNumber || undefined,
    )

    const delivered = channels.map((c) =>
      c === "in_app" ? "In-app" : c === "email" ? "Email" : "WhatsApp"
    )

    return NextResponse.json({ delivered })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to send test notification" }, { status: 500 })
  }
}
