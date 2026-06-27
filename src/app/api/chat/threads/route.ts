import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const threads = await db.chatThread.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
  })
  return NextResponse.json({
    threads: threads.map((t) => ({
      id: t.id,
      title: t.title,
      updatedAt: t.updatedAt,
      messageCount: JSON.parse(t.messages || "[]").length,
      preview: (() => {
        const msgs: any[] = JSON.parse(t.messages || "[]")
        return msgs.length ? msgs[msgs.length - 1].content?.slice(0, 120) : ""
      })(),
    })),
  })
}

export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const thread = await db.chatThread.create({
    data: { userId: user.id, title: "New Conversation", messages: "[]" },
  })
  return NextResponse.json({ ok: true, thread })
}
