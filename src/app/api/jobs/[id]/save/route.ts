import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const created = await db.savedJob.create({
      data: { userId: user.id, jobId: id },
    })
    await db.activity.create({
      data: {
        userId: user.id,
        type: "saved_job",
        title: `Saved a job`,
        meta: JSON.stringify({ jobId: id }),
      },
    })
    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    // already saved
    if (String(e?.code).includes("UNIQUE")) {
      return NextResponse.json({ ok: true, alreadySaved: true })
    }
    throw e
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db.savedJob.deleteMany({ where: { userId: user.id, jobId: id } })
  return NextResponse.json({ ok: true })
}
