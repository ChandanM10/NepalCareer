import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })
  return NextResponse.json({ ok: true })
}
