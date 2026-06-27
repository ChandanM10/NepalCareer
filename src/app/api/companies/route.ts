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
  const industry = url.searchParams.get("industry") || ""
  const size = url.searchParams.get("size") || ""
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "12")))

  const where: any = {}
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { industry: { contains: q } },
      { headquarters: { contains: q } },
    ]
  }
  if (industry) where.industry = industry
  if (size) where.size = size

  const [total, companies] = await Promise.all([
    db.company.count({ where }),
    db.company.findMany({
      where,
      orderBy: { jobCount: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const data = companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    logoUrl: c.logoUrl,
    website: c.website,
    industry: c.industry,
    size: c.size,
    founded: c.founded,
    headquarters: c.headquarters,
    description: c.description,
    mission: c.mission,
    techStack: parseJsonArray(c.techStack),
    benefits: parseJsonArray(c.benefits),
    rating: c.rating,
    verified: c.verified,
    followerCount: c.followerCount,
    jobCount: c.jobCount,
  }))

  return NextResponse.json({ companies: data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
}
