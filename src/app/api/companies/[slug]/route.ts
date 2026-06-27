import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJsonArray } from "@/lib/format"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { slug } = await ctx.params
  const company = await db.company.findUnique({ where: { slug } })
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const jobs = await db.job.findMany({
    where: { companyId: company.id, status: "open" },
    orderBy: { postedAt: "desc" },
    take: 50,
  })

  return NextResponse.json({
    id: company.id,
    name: company.name,
    slug: company.slug,
    logoUrl: company.logoUrl,
    website: company.website,
    industry: company.industry,
    size: company.size,
    founded: company.founded,
    headquarters: company.headquarters,
    description: company.description,
    mission: company.mission,
    techStack: parseJsonArray(company.techStack),
    benefits: parseJsonArray(company.benefits),
    rating: company.rating,
    verified: company.verified,
    followerCount: company.followerCount,
    jobCount: company.jobCount,
    jobs: jobs.map((j) => ({
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
      urgent: j.urgent,
      featured: j.featured,
    })),
  })
}
