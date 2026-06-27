import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const job = await db.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Find similar jobs: same category, or overlapping skills, exclude self
  const sameCategory = await db.job.findMany({
    where: {
      AND: [
        { id: { not: id } },
        { status: "open" },
        {
          OR: [
            { category: job.category },
            { subcategory: job.subcategory },
            { company: { industry: { equals: (await db.job.findUnique({ where: { id }, include: { company: true } }))?.company?.industry } } },
          ],
        },
      ],
    },
    include: { company: true },
    take: 6,
    orderBy: { postedAt: "desc" },
  })

  const data = sameCategory.map((j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    category: j.category,
    subcategory: j.subcategory,
    location: j.location,
    remoteStatus: j.remoteStatus,
    employmentType: j.employmentType,
    seniority: j.seniority,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    postedAt: j.postedAt,
    skills: parseJsonArray(j.skills),
    technologies: parseJsonArray(j.technologies),
    company: {
      id: j.company.id,
      name: j.company.name,
      slug: j.company.slug,
      logoUrl: j.company.logoUrl,
      industry: j.company.industry,
      rating: j.company.rating,
      verified: j.company.verified,
    },
  }))

  return NextResponse.json({ jobs: data })
}
