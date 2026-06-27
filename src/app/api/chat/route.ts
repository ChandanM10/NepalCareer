import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { careerAdvice, type ChatMsg } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { threadId, message } = body as { threadId?: string; message?: string }
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 })

  // Get or create thread
  let thread = threadId ? await db.chatThread.findFirst({ where: { id: threadId, userId: user.id } }) : null
  if (!thread) {
    thread = await db.chatThread.create({
      data: {
        userId: user.id,
        title: message.slice(0, 60),
        messages: "[]",
      },
    })
  }

  const history: ChatMsg[] = JSON.parse(thread.messages || "[]")
  // Take last 8 messages to keep token budget sane
  const trimmed = history.slice(-8).map((m: any) => ({ role: m.role, content: m.content }))

  // Build resume context for the advisor
  const resume = await db.resume.findFirst({
    where: { userId: user.id },
    orderBy: { isPrimary: "desc" },
  })
  const resumeSummary = resume?.rawText?.slice(0, 600) || undefined
  const targetRole = resume?.targetRole || undefined

  const reply = await careerAdvice(trimmed, message, { resumeSummary, targetRole })

  const updatedMessages = [
    ...history,
    { role: "user" as const, content: message, ts: new Date().toISOString() },
    { role: "assistant" as const, content: reply, ts: new Date().toISOString() },
  ]
  await db.chatThread.update({
    where: { id: thread.id },
    data: { messages: JSON.stringify(updatedMessages), title: history.length === 0 ? message.slice(0, 60) : thread.title },
  })

  await db.activity.create({
    data: {
      userId: user.id,
      type: "ai_query",
      title: `Asked Career Advisor: ${message.slice(0, 60)}`,
      meta: JSON.stringify({ threadId: thread.id }),
    },
  })

  return NextResponse.json({ ok: true, threadId: thread.id, reply })
}
