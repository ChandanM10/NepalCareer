import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJsonArray } from "@/lib/format"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim().toLowerCase() || ""
  const category = url.searchParams.get("category") || ""
  const employmentType = url.searchParams.get("employmentType") || ""
  const remoteStatus = url.searchParams.get("remoteStatus") || ""
  const seniority = url.searchParams.get("seniority") || ""
  const region = url.searchParams.get("region") || ""
  const country = url.searchParams.get("country") || ""
  const minSalary = url.searchParams.get("minSalary")
  const visaSponsor = url.searchParams.get("visaSponsor") === "true"
  const featured = url.searchParams.get("featured") === "true"
  const sort = url.searchParams.get("sort") || "recent"
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "12")))

  const where: any = { status: "open" }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { city: { contains: q } },
      { country: { contains: q } },
      { skills: { contains: q } },
      { technologies: { contains: q } },
    ]
  }
  if (category) where.category = category
  if (employmentType) where.employmentType = employmentType
  if (remoteStatus) where.remoteStatus = remoteStatus
  if (seniority) where.seniority = seniority
  if (region) where.region = region
  if (country) where.country = country
  if (visaSponsor) where.visaSponsor = true
  if (featured) where.featured = true
  if (minSalary) {
    const v = parseInt(minSalary)
    if (!isNaN(v)) where.salaryMax = { gte: v }
  }

  let orderBy: any = { postedAt: "desc" }
  if (sort === "salary_high") {
    orderBy = [{ salaryMax: { sort: "desc", nulls: "last" } }, { postedAt: "desc" }]
  } else if (sort === "salary_low") {
    orderBy = [{ salaryMin: { sort: "asc", nulls: "last" } }, { postedAt: "desc" }]
  } else if (sort === "popular") {
    orderBy = { viewCount: "desc" }
  }

  const [total, jobs] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({
      where,
      include: { company: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const data = jobs.map((j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    description: j.description,
    skills: parseJsonArray(j.skills),
    technologies: parseJsonArray(j.technologies),
    tags: parseJsonArray(j.tags),
    requirements: parseJsonArray(j.requirements),
    responsibilities: parseJsonArray(j.responsibilities),
    niceToHave: parseJsonArray(j.niceToHave),
    category: j.category,
    subcategory: j.subcategory,
    location: j.location,
    city: j.city,
    country: j.country,
    region: j.region,
    remoteStatus: j.remoteStatus,
    employmentType: j.employmentType,
    seniority: j.seniority,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    salaryCurrency: j.salaryCurrency,
    equity: j.equity,
    experienceYrs: j.experienceYrs,
    visaSponsor: j.visaSponsor,
    featured: j.featured,
    urgent: j.urgent,
    viewCount: j.viewCount,
    applicationCount: j.applicationCount,
    postedAt: j.postedAt,
    closingAt: j.closingAt,
    sourceUrl: j.sourceUrl,
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

  return NextResponse.json({
    jobs: data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
