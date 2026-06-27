import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const status = body.status || "applied"
  const coverLetter = body.coverLetter || null
  const resumeId = body.resumeId || null

  try {
    const app = await db.application.upsert({
      where: { userId_jobId: { userId: user.id, jobId: id } },
      create: {
        userId: user.id,
        jobId: id,
        status,
        coverLetter,
        resumeId,
        appliedAt: status !== "wishlist" ? new Date() : null,
        stageHistory: JSON.stringify([{ status, at: new Date().toISOString() }]),
      },
      update: {
        status,
        coverLetter: coverLetter ?? undefined,
        resumeId: resumeId ?? undefined,
        appliedAt: status !== "wishlist" && !await db.application.findUnique({ where: { userId_jobId: { userId: user.id, jobId: id } } }).then(a => a?.appliedAt) ? new Date() : undefined,
        stageHistory: JSON.stringify([
          ...(JSON.parse((await db.application.findUnique({ where: { userId_jobId: { userId: user.id, jobId: id } } }))?.stageHistory || "[]") as any[]),
          { status, at: new Date().toISOString() },
        ]),
      },
    })
    await db.activity.create({
      data: {
        userId: user.id,
        type: "applied",
        title: `Applied to job`,
        meta: JSON.stringify({ jobId: id, status }),
      },
    })
    // Increment application count
    db.job.update({ where: { id }, data: { applicationCount: { increment: 1 } } }).catch(() => {})
    return NextResponse.json({ ok: true, application: app })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 })
  }
}
