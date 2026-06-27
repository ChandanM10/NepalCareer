import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseJsonArray } from "@/lib/format"
import { getSession } from "@/lib/auth"
import { localMatchScore, explainMatch } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const job = await db.job.findUnique({
    where: { id },
    include: { company: true },
  })
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const resume = await db.resume.findFirst({
    where: { userId: user.id },
    orderBy: { isPrimary: "desc" },
  })

  if (!resume) {
    return NextResponse.json({
      score: null,
      matchedSkills: [],
      missingSkills: parseJsonArray(job.skills),
      matchedTech: [],
      missingTech: parseJsonArray(job.technologies),
      explanation: "Upload a resume to see your AI match score.",
    })
  }

  const m = localMatchScore(
    {
      skills: parseJsonArray(resume.skills),
      technologies: parseJsonArray(resume.technologies),
      yearsExp: resume.yearsExp ?? 0,
      targetRole: resume.targetRole,
    },
    {
      skills: parseJsonArray(job.skills),
      technologies: parseJsonArray(job.technologies),
      experienceYrs: job.experienceYrs,
      title: job.title,
      seniority: job.seniority,
      category: job.category,
    }
  )

  const explanation = await explainMatch({
    jobTitle: job.title,
    companyName: job.company.name,
    matchScore: m.score,
    matchedSkills: m.matchedSkills,
    missingSkills: m.missingSkills,
    matchedTech: m.matchedTech,
    missingTech: m.missingTech,
  })

  return NextResponse.json({
    score: m.score,
    matchedSkills: m.matchedSkills,
    missingSkills: m.missingSkills,
    matchedTech: m.matchedTech,
    missingTech: m.missingTech,
    explanation,
  })
}
