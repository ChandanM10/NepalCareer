import { redirect } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { DashboardView } from "@/components/dashboard/view"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { parseJsonArray, parseJsonObject } from "@/lib/format"
import { localMatchScore } from "@/lib/ai"

export const dynamic = "force-dynamic"

async function getDashboardData() {
  try {
    const user = await getSession()
    if (!user) return null

    const [savedCount, applications, resumes, alerts, activities, recentJobs] = await Promise.all([
      db.savedJob.count({ where: { userId: user.id } }),
      db.application.findMany({
        where: { userId: user.id },
        include: { job: { include: { company: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      db.resume.findMany({ where: { userId: user.id }, orderBy: { isPrimary: "desc" } }),
      db.alert.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      db.activity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
      db.job.findMany({
        where: { status: "open" },
        include: { company: true },
        orderBy: { postedAt: "desc" },
        take: 6,
      }),
    ])

    const primaryResume = resumes.find((r) => r.isPrimary) || resumes[0]

    let recommendations: any[] = []
    if (primaryResume) {
      const resume = {
        skills: parseJsonArray(primaryResume.skills),
        technologies: parseJsonArray(primaryResume.technologies),
        yearsExp: primaryResume.yearsExp ?? 0,
        targetRole: primaryResume.targetRole,
      }
      recommendations = recentJobs
        .map((j) => {
          const m = localMatchScore(resume, {
            skills: parseJsonArray(j.skills),
            technologies: parseJsonArray(j.technologies),
            experienceYrs: j.experienceYrs,
            title: j.title,
            seniority: j.seniority,
            category: j.category,
          })
          return {
            id: j.id,
            slug: j.slug,
            title: j.title,
            category: j.category,
            location: j.location,
            remoteStatus: j.remoteStatus,
            matchScore: m.score,
            matchedSkills: m.matchedSkills,
            postedAt: j.postedAt,
            company: {
              id: j.company.id,
              name: j.company.name,
              slug: j.company.slug,
              logoUrl: j.company.logoUrl,
              rating: j.company.rating,
              verified: j.company.verified,
            },
          }
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4)
    }

    const statusCounts: Record<string, number> = {
      wishlist: 0, applied: 0, screening: 0, interview: 0, offer: 0, rejected: 0, accepted: 0,
    }
    for (const a of applications) {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
    }

    const appTimeline = applications.slice(0, 5).map((a) => ({
      id: a.id,
      status: a.status,
      appliedAt: a.appliedAt,
      updatedAt: a.updatedAt,
      stageHistory: parseJsonArray(a.stageHistory),
      job: {
        id: a.job.id,
        slug: a.job.slug,
        title: a.job.title,
        company: { id: a.job.company.id, name: a.job.company.name, slug: a.job.company.slug },
      },
    }))

    const salaryBuckets = [
      { label: "<$80k", count: 0, min: 0, max: 80000 },
      { label: "$80–120k", count: 0, min: 80000, max: 120000 },
      { label: "$120–160k", count: 0, min: 120000, max: 160000 },
      { label: "$160–200k", count: 0, min: 160000, max: 200000 },
      { label: "$200k+", count: 0, min: 200000, max: Infinity },
    ]
    for (const j of recentJobs) {
      const v = j.salaryMax || j.salaryMin
      if (!v) continue
      for (const b of salaryBuckets) {
        if (v >= b.min && v < b.max) { b.count++; break }
      }
    }

    return {
      user,
      stats: {
        saved: savedCount,
        applications: applications.length,
        resumes: resumes.length,
        alerts: alerts.length,
        avgMatchScore: recommendations.length
          ? Math.round(recommendations.reduce((s, r) => s + r.matchScore, 0) / recommendations.length)
          : 0,
      },
      pipeline: statusCounts,
      salaryBuckets: salaryBuckets.map((b) => ({ label: b.label, count: b.count })),
      recommendations,
      applications: appTimeline,
      activities: activities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        meta: parseJsonObject(a.meta),
        createdAt: a.createdAt,
      })),
      resume: primaryResume
        ? {
            id: primaryResume.id,
            fileName: primaryResume.fileName,
            atsScore: primaryResume.atsScore,
            isPrimary: primaryResume.isPrimary,
            skills: parseJsonArray(primaryResume.skills),
            technologies: parseJsonArray(primaryResume.technologies),
            targetRole: primaryResume.targetRole,
            yearsExp: primaryResume.yearsExp,
          }
        : null,
    }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  if (!data) redirect("/login")
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={data.user} />
      <main className="flex-1">
        <DashboardView data={data} />
      </main>
      <AppFooter />
    </div>
  )
}
