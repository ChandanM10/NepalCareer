import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJsonArray } from "@/lib/format"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const jobs = await db.job.findMany({
    where: { featured: true, status: "open" },
    include: { company: true },
    orderBy: { postedAt: "desc" },
    take: 6,
  })
  const data = jobs.map((j) => ({
    id: j.id,
    slug: j.slug,
    title: j.title,
    description: j.description,
    category: j.category,
    subcategory: j.subcategory,
    location: j.location,
    city: j.city,
    country: j.country,
    remoteStatus: j.remoteStatus,
    employmentType: j.employmentType,
    seniority: j.seniority,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    postedAt: j.postedAt,
    skills: parseJsonArray(j.skills),
    technologies: parseJsonArray(j.technologies),
    urgent: j.urgent,
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
