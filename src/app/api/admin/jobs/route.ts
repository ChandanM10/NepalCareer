import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"
import { sendJobAlertNotification } from "@/lib/notifications"

export const dynamic = "force-dynamic"

// List all jobs (admin view, includes closed/draft)
export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Verify admin role
  const fullUser = await db.user.findUnique({ where: { id: user.id } })
  if (!fullUser || fullUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }
  const url = new URL(req.url)
  const status = url.searchParams.get("status") || ""
  const q = url.searchParams.get("q")?.toLowerCase() || ""

  const where: any = {}
  if (status) where.status = status
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ]
  }

  const jobs = await db.job.findMany({
    where,
    include: { company: true },
    orderBy: { postedAt: "desc" },
    take: 100,
  })

  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      slug: j.slug,
      category: j.category,
      subcategory: j.subcategory,
      location: j.location,
      remoteStatus: j.remoteStatus,
      employmentType: j.employmentType,
      seniority: j.seniority,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      status: j.status,
      featured: j.featured,
      urgent: j.urgent,
      viewCount: j.viewCount,
      applicationCount: j.applicationCount,
      postedAt: j.postedAt,
      closingAt: j.closingAt,
      skills: parseJsonArray(j.skills),
      technologies: parseJsonArray(j.technologies),
      company: {
        id: j.company.id,
        name: j.company.name,
        slug: j.company.slug,
      },
    })),
  })
}

// Create new job
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Verify admin role
  const fullUser = await db.user.findUnique({ where: { id: user.id } })
  if (!fullUser || fullUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const {
    title, description, companyId, category, subcategory, location, city, country, region,
    remoteStatus, employmentType, seniority, salaryMin, salaryMax, equity, experienceYrs,
    visaSponsor, featured, urgent, requirements, responsibilities, niceToHave, skills, technologies,
    closingAt,
  } = body

  if (!title || !description || !companyId) {
    return NextResponse.json({ error: "title, description, companyId required" }, { status: 400 })
  }

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const company = await db.company.findUnique({ where: { id: companyId } })
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  const slug = `${slugify(title)}-${slugify(company.name)}-${Date.now().toString().slice(-6)}`

  const job = await db.job.create({
    data: {
      title,
      slug,
      description,
      requirements: JSON.stringify(requirements || []),
      responsibilities: JSON.stringify(responsibilities || []),
      niceToHave: JSON.stringify(niceToHave || []),
      skills: JSON.stringify(skills || []),
      technologies: JSON.stringify(technologies || []),
      tags: "[]",
      category,
      subcategory,
      companyId,
      location: location || "Remote",
      city, country, region,
      remoteStatus: remoteStatus || "onsite",
      employmentType: employmentType || "full-time",
      seniority,
      salaryMin: salaryMin ? parseInt(salaryMin) : null,
      salaryMax: salaryMax ? parseInt(salaryMax) : null,
      salaryCurrency: "USD",
      equity,
      experienceYrs: experienceYrs ? parseInt(experienceYrs) : null,
      visaSponsor: !!visaSponsor,
      featured: !!featured,
      urgent: !!urgent,
      status: "open",
      closingAt: closingAt ? new Date(closingAt) : null,
    },
  })

  // Update company job count
  const count = await db.job.count({ where: { companyId } })
  await db.company.update({ where: { id: companyId }, data: { jobCount: count } })

  // Find matching active alerts and send notifications
  const activeAlerts = await db.alert.findMany({
    where: { active: true },
    include: { user: true },
  })

  const jobSearchText = `${title} ${description} ${(skills || []).join(" ")} ${(technologies || []).join(" ")} ${category || ""} ${location || ""}`.toLowerCase()

  for (const alert of activeAlerts) {
    const alertQuery = alert.query.toLowerCase()
    const alertFilters = JSON.parse(alert.filters || "{}") as Record<string, string>

    // Match by keyword
    const keywordMatch = !alertQuery || jobSearchText.includes(alertQuery)

    // Match by remote status filter
    const remoteMatch = !alertFilters.remoteStatus || remoteStatus === alertFilters.remoteStatus

    // Match by employment type filter
    const typeMatch = !alertFilters.employmentType || employmentType === alertFilters.employmentType

    if (keywordMatch && remoteMatch && typeMatch) {
      await sendJobAlertNotification(alert.userId, title, company.name, job.id)

      await db.alert.update({
        where: { id: alert.id },
        data: {
          matchCount: { increment: 1 },
          lastTriggeredAt: new Date(),
        },
      })
    }
  }

  return NextResponse.json({ ok: true, job })
}
