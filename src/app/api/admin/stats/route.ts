import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  // Verify admin role
  const fullUser = await db.user.findUnique({ where: { id: user.id } })
  if (!fullUser || fullUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }
  const [totalJobs, openJobs, totalCompanies, totalUsers, totalApplications, totalSavedJobs] = await Promise.all([
    db.job.count(),
    db.job.count({ where: { status: "open" } }),
    db.company.count(),
    db.user.count(),
    db.application.count(),
    db.savedJob.count(),
  ])

  // Top jobs by applications
  const topJobs = await db.job.findMany({
    orderBy: { applicationCount: "desc" },
    take: 5,
    include: { company: true },
  })

  // Top jobs by views
  const topViewed = await db.job.findMany({
    orderBy: { viewCount: "desc" },
    take: 5,
    include: { company: true },
  })

  // Applications by status
  const appsByStatus = await db.application.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  // Jobs by category
  const jobsByCategory = await db.job.groupBy({
    by: ["category"],
    where: { status: "open" },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
  })

  // Applications over last 14 days (rough — using createdAt)
  const since = new Date()
  since.setDate(since.getDate() - 14)
  const recentApps = await db.application.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  })
  const appsByDay: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(5, 10) // MM-DD
    appsByDay[key] = 0
  }
  for (const a of recentApps) {
    const key = a.createdAt.toISOString().slice(5, 10)
    if (appsByDay[key] !== undefined) appsByDay[key]++
  }

  return NextResponse.json({
    totals: {
      jobs: totalJobs,
      openJobs,
      companies: totalCompanies,
      users: totalUsers,
      applications: totalApplications,
      savedJobs: totalSavedJobs,
    },
    topJobs: topJobs.map(j => ({ id: j.id, title: j.title, company: j.company.name, applications: j.applicationCount, views: j.viewCount })),
    topViewed: topViewed.map(j => ({ id: j.id, title: j.title, company: j.company.name, views: j.viewCount })),
    appsByStatus: appsByStatus.map(a => ({ status: a.status, count: a._count._all })),
    jobsByCategory: jobsByCategory.map(c => ({ category: c.category, count: c._count._all })),
    appsByDay: Object.entries(appsByDay).map(([day, count]) => ({ day, count })),
  })
}
