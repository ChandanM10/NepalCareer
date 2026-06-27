import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"
import { localMatchScore, generateChat } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { jobIds } = await req.json().catch(() => ({ jobIds: [] as string[] }))
  if (!Array.isArray(jobIds) || jobIds.length < 2) {
    return NextResponse.json({ error: "Provide at least 2 job IDs to compare" }, { status: 400 })
  }
  if (jobIds.length > 4) {
    return NextResponse.json({ error: "Maximum 4 jobs to compare" }, { status: 400 })
  }

  const jobs = await db.job.findMany({
    where: { id: { in: jobIds } },
    include: { company: true },
  })
  if (jobs.length < 2) return NextResponse.json({ error: "Not enough valid jobs" }, { status: 404 })

  const resume = await db.resume.findFirst({
    where: { userId: user.id },
    orderBy: { isPrimary: "desc" },
  })

  const enriched = jobs.map((j) => {
    const match = resume
      ? localMatchScore(
          {
            skills: parseJsonArray(resume.skills),
            technologies: parseJsonArray(resume.technologies),
            yearsExp: resume.yearsExp ?? 0,
            targetRole: resume.targetRole,
          },
          {
            skills: parseJsonArray(j.skills),
            technologies: parseJsonArray(j.technologies),
            experienceYrs: j.experienceYrs,
            title: j.title,
            seniority: j.seniority,
            category: j.category,
          }
        )
      : null
    return {
      id: j.id,
      slug: j.slug,
      title: j.title,
      description: j.description,
      requirements: parseJsonArray(j.requirements),
      responsibilities: parseJsonArray(j.responsibilities),
      niceToHave: parseJsonArray(j.niceToHave),
      skills: parseJsonArray(j.skills),
      technologies: parseJsonArray(j.technologies),
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
      match: match
        ? {
            score: match.score,
            matchedSkills: match.matchedSkills,
            missingSkills: match.missingSkills,
            matchedTech: match.matchedTech,
            missingTech: match.missingTech,
          }
        : null,
      company: {
        id: j.company.id,
        name: j.company.name,
        slug: j.company.slug,
        logoUrl: j.company.logoUrl,
        industry: j.company.industry,
        size: j.company.size,
        rating: j.company.rating,
        verified: j.company.verified,
        headquarters: j.company.headquarters,
      },
    }
  })

  // Try AI summary comparison
  const summaryPrompt = `You are a career coach. Compare these ${enriched.length} job opportunities for the candidate and recommend which one might be the best fit, in 4-5 sentences. Be specific about trade-offs.

${enriched.map((j, i) => `Job ${i + 1}: ${j.title} at ${j.company.name}
- Location: ${j.location} (${j.remoteStatus})
- Salary: ${j.salaryMin ? "$" + (j.salaryMin/1000) + "k-" : ""}${j.salaryMax ? "$" + (j.salaryMax/1000) + "k" : "n/a"}
- Seniority: ${j.seniority}
- Match score: ${j.match?.score ?? "n/a"}/100
- Matched skills: ${j.match?.matchedSkills.join(", ") || "n/a"}
- Missing skills: ${j.match?.missingSkills.join(", ") || "n/a"}
- Application count: ${j.applicationCount}
- Company rating: ${j.company.rating}/5`).join("\n\n")}`

  const aiSummary = await generateChat(
    [
      { role: "system", content: "You are an expert career coach helping a candidate compare job offers. Be specific and actionable." },
      { role: "user", content: summaryPrompt },
    ],
    { temperature: 0.6, maxTokens: 400 }
  )

  return NextResponse.json({
    jobs: enriched,
    summary: aiSummary || "Compare the match scores, salaries, and your missing skills above. The job with the highest match score is generally the best fit, but weigh salary, location, and company rating too.",
  })
}
