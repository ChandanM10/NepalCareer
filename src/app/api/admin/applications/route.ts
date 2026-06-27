import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

export async function GET() {
  // Verify user is authenticated
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Verify user has admin role
  const fullUser = await db.user.findUnique({ where: { id: session.id } })
  if (!fullUser || fullUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }
  
  // Return all applications across all users (admin view)
  const apps = await db.application.findMany({
    include: {
      job: { include: { company: true } },
      user: { select: { id: true, fullName: true, email: true, headline: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  })

  return NextResponse.json({
    applications: apps.map((a) => ({
      id: a.id,
      status: a.status,
      appliedAt: a.appliedAt,
      updatedAt: a.updatedAt,
      coverLetter: a.coverLetter,
      stageHistory: parseJsonArray(a.stageHistory),
      rating: a.rating,
      user: a.user,
      job: {
        id: a.job.id,
        title: a.job.title,
        company: {
          name: a.job.company.name,
          slug: a.job.company.slug,
          industry: a.job.company.industry,
        },
      },
    })),
  })
}
