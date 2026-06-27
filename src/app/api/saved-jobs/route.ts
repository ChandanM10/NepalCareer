import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const saved = await db.savedJob.findMany({
    where: { userId: user.id },
    include: { job: { include: { company: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({
    saved: saved.map((s) => ({
      id: s.id,
      savedAt: s.createdAt,
      note: s.note,
      job: {
        id: s.job.id,
        slug: s.job.slug,
        title: s.job.title,
        description: s.job.description,
        category: s.job.category,
        location: s.job.location,
        remoteStatus: s.job.remoteStatus,
        employmentType: s.job.employmentType,
        seniority: s.job.seniority,
        salaryMin: s.job.salaryMin,
        salaryMax: s.job.salaryMax,
        postedAt: s.job.postedAt,
        skills: parseJsonArray(s.job.skills),
        technologies: parseJsonArray(s.job.technologies),
        urgent: s.job.urgent,
        featured: s.job.featured,
        company: {
          id: s.job.company.id,
          name: s.job.company.name,
          slug: s.job.company.slug,
          logoUrl: s.job.company.logoUrl,
          industry: s.job.company.industry,
          rating: s.job.company.rating,
          verified: s.job.company.verified,
        },
      },
    })),
  })
}
