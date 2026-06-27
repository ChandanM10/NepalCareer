import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJsonArray } from "@/lib/format"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allJobs = await db.job.findMany({
    where: { status: "open" },
    include: { company: true },
  })

  // Skill demand — count occurrences across jobs
  const skillCounts: Record<string, number> = {}
  const techCounts: Record<string, number> = {}
  for (const j of allJobs) {
    for (const s of parseJsonArray(j.skills)) {
      const key = String(s)
      skillCounts[key] = (skillCounts[key] || 0) + 1
    }
    for (const t of parseJsonArray(j.technologies)) {
      const key = String(t)
      techCounts[key] = (techCounts[key] || 0) + 1
    }
  }

  const topSkills = Object.entries(skillCounts)
    .map(([name, count]) => ({ name, count, percent: Math.round((count / allJobs.length) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  const topTech = Object.entries(techCounts)
    .map(([name, count]) => ({ name, count, percent: Math.round((count / allJobs.length) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Salary by category
  const byCategory: Record<string, { sum: number; count: number; min: number; max: number }> = {}
  for (const j of allJobs) {
    if (!j.salaryMin && !j.salaryMax) continue
    const cat = j.category || "Other"
    const mid = ((j.salaryMin || 0) + (j.salaryMax || 0)) / 2
    if (!byCategory[cat]) byCategory[cat] = { sum: 0, count: 0, min: Infinity, max: 0 }
    byCategory[cat].sum += mid
    byCategory[cat].count += 1
    byCategory[cat].min = Math.min(byCategory[cat].min, j.salaryMin || j.salaryMax || 0)
    byCategory[cat].max = Math.max(byCategory[cat].max, j.salaryMax || j.salaryMin || 0)
  }
  const salaryByCategory = Object.entries(byCategory)
    .map(([category, v]) => ({
      category,
      avg: Math.round(v.sum / v.count),
      min: v.min,
      max: v.max,
      count: v.count,
    }))
    .sort((a, b) => b.avg - a.avg)

  // Salary by seniority
  const bySeniority: Record<string, { sum: number; count: number }> = {}
  for (const j of allJobs) {
    if (!j.seniority) continue
    if (!j.salaryMin && !j.salaryMax) continue
    const mid = ((j.salaryMin || 0) + (j.salaryMax || 0)) / 2
    if (!bySeniority[j.seniority]) bySeniority[j.seniority] = { sum: 0, count: 0 }
    bySeniority[j.seniority].sum += mid
    bySeniority[j.seniority].count += 1
  }
  const seniorityRank = ["intern", "junior", "mid", "senior", "lead", "staff", "director", "vp", "executive"]
  const salaryBySeniority = Object.entries(bySeniority)
    .map(([seniority, v]) => ({ seniority, avg: Math.round(v.sum / v.count), count: v.count }))
    .sort((a, b) => seniorityRank.indexOf(a.seniority) - seniorityRank.indexOf(b.seniority))

  // Remote vs hybrid vs onsite split
  const remoteSplit: Record<string, number> = { remote: 0, hybrid: 0, onsite: 0 }
  for (const j of allJobs) remoteSplit[j.remoteStatus] = (remoteSplit[j.remoteStatus] || 0) + 1

  // Top hiring companies
  const topCompanies = await db.company.findMany({
    orderBy: { jobCount: "desc" },
    take: 10,
    select: { id: true, name: true, slug: true, logoUrl: true, industry: true, rating: true, verified: true, jobCount: true, followerCount: true },
  })

  // Visa sponsorship rate
  const visaCount = allJobs.filter(j => j.visaSponsor).length

  return NextResponse.json({
    totalJobs: allJobs.length,
    topSkills,
    topTech,
    salaryByCategory,
    salaryBySeniority,
    remoteSplit,
    topCompanies,
    visaRate: Math.round((visaCount / allJobs.length) * 100),
  })
}
