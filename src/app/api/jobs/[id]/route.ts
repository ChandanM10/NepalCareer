import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJsonArray } from "@/lib/format"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const job = await db.job.findUnique({
    where: { id },
    include: { company: true },
  })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Increment view count async (don't await)
  db.job.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  // Try to fetch user-specific match info if a session exists
  let savedByUser = false
  let applicationStatus: string | null = null
  try {
    const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const [saved, app] = await Promise.all([
      db.savedJob.findUnique({ where: { userId_jobId: { userId: user.id, jobId: job.id } } }),
      db.application.findUnique({ where: { userId_jobId: { userId: user.id, jobId: job.id } } }),
    ])
    savedByUser = !!saved
    applicationStatus = app?.status ?? null
  } catch {}

  return NextResponse.json({
    id: job.id,
    slug: job.slug,
    title: job.title,
    description: job.description,
    requirements: parseJsonArray(job.requirements),
    responsibilities: parseJsonArray(job.responsibilities),
    niceToHave: parseJsonArray(job.niceToHave),
    skills: parseJsonArray(job.skills),
    technologies: parseJsonArray(job.technologies),
    tags: parseJsonArray(job.tags),
    category: job.category,
    subcategory: job.subcategory,
    location: job.location,
    city: job.city,
    country: job.country,
    region: job.region,
    remoteStatus: job.remoteStatus,
    employmentType: job.employmentType,
    seniority: job.seniority,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    equity: job.equity,
    experienceYrs: job.experienceYrs,
    visaSponsor: job.visaSponsor,
    featured: job.featured,
    urgent: job.urgent,
    viewCount: job.viewCount,
    applicationCount: job.applicationCount,
    postedAt: job.postedAt,
    closingAt: job.closingAt,
    sourceUrl: job.sourceUrl,
    savedByUser,
    applicationStatus,
    company: {
      id: job.company.id,
      name: job.company.name,
      slug: job.company.slug,
      logoUrl: job.company.logoUrl,
      website: job.company.website,
      industry: job.company.industry,
      size: job.company.size,
      founded: job.company.founded,
      headquarters: job.company.headquarters,
      description: job.company.description,
      mission: job.company.mission,
      techStack: parseJsonArray(job.company.techStack),
      benefits: parseJsonArray(job.company.benefits),
      rating: job.company.rating,
      verified: job.company.verified,
      followerCount: job.company.followerCount,
      jobCount: job.company.jobCount,
    },
  })
}
