import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [totalJobs, totalCompanies, remoteJobs, visaJobs] = await Promise.all([
    db.job.count({ where: { status: "open" } }),
    db.company.count(),
    db.job.count({ where: { status: "open", remoteStatus: "remote" } }),
    db.job.count({ where: { status: "open", visaSponsor: true } }),
  ])
  const categories = await db.job.groupBy({
    by: ["category"],
    where: { status: "open" },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
  })
  return NextResponse.json({
    totalJobs,
    totalCompanies,
    remoteJobs,
    visaJobs,
    categories: categories.map((c) => ({ name: c.category, count: c._count._all })),
  })
}
