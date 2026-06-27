import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const apps = await db.application.findMany({
    where: { userId: user.id },
    include: { job: { include: { company: true } } },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json({
    applications: apps.map((a) => ({
      id: a.id,
      status: a.status,
      appliedAt: a.appliedAt,
      updatedAt: a.updatedAt,
      coverLetter: a.coverLetter,
      stageHistory: parseJsonArray(a.stageHistory),
      notes: a.notes ? parseJsonArray(a.notes) : [],
      rating: a.rating,
      job: {
        id: a.job.id,
        slug: a.job.slug,
        title: a.job.title,
        category: a.job.category,
        location: a.job.location,
        remoteStatus: a.job.remoteStatus,
        employmentType: a.job.employmentType,
        seniority: a.job.seniority,
        salaryMin: a.job.salaryMin,
        salaryMax: a.job.salaryMax,
        company: {
          id: a.job.company.id,
          name: a.job.company.name,
          slug: a.job.company.slug,
          logoUrl: a.job.company.logoUrl,
          industry: a.job.company.industry,
          rating: a.job.company.rating,
          verified: a.job.company.verified,
        },
      },
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { jobId, status, coverLetter, rating, addNote } = body
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

  const existing = await db.application.findUnique({
    where: { userId_jobId: { userId: user.id, jobId } },
  })

  if (existing) {
    // Update status / move stage
    const newHistory = [...parseJsonArray(existing.stageHistory)]
    if (status && status !== existing.status) {
      newHistory.push({ status, at: new Date().toISOString() })
    }
    const updated = await db.application.update({
      where: { id: existing.id },
      data: {
        status: status ?? existing.status,
        coverLetter: coverLetter ?? existing.coverLetter,
        rating: rating ?? existing.rating,
        stageHistory: JSON.stringify(newHistory),
        notes: addNote
          ? JSON.stringify([...parseJsonArray(existing.notes), { text: addNote, at: new Date().toISOString() }])
          : existing.notes,
      },
    })
    if (status && status !== existing.status) {
      await db.activity.create({
        data: {
          userId: user.id,
          type: "status_change",
          title: `Application moved to ${status}`,
          meta: JSON.stringify({ jobId }),
        },
      })
    }
    return NextResponse.json({ ok: true, application: updated })
  } else {
    // Create new
    const created = await db.application.create({
      data: {
        userId: user.id,
        jobId,
        status: status || "wishlist",
        coverLetter,
        rating,
        appliedAt: status && status !== "wishlist" ? new Date() : null,
        stageHistory: JSON.stringify([{ status: status || "wishlist", at: new Date().toISOString() }]),
        notes: addNote ? JSON.stringify([{ text: addNote, at: new Date().toISOString() }]) : "[]",
      },
    })
    return NextResponse.json({ ok: true, application: created })
  }
}
