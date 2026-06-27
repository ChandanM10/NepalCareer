import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"
import { generateChat, localMatchScore } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const [resume, applications, savedJobs] = await Promise.all([
    db.resume.findFirst({ where: { userId: user.id }, orderBy: { isPrimary: "desc" } }),
    db.application.findMany({ where: { userId: user.id }, include: { job: { include: { company: true } } } }),
    db.savedJob.findMany({ where: { userId: user.id }, include: { job: { include: { company: true } } } }),
  ])

  // Heuristic insights
  const insights: Array<{ type: string; title: string; description: string; severity: "info" | "warning" | "success"; data?: any }> = []

  // 1. ATS score insight
  if (resume?.atsScore !== null && resume?.atsScore !== undefined) {
    if (resume.atsScore < 70) {
      insights.push({
        type: "ats",
        severity: "warning",
        title: "Your resume ATS score could be higher",
        description: `Your current ATS score is ${resume.atsScore}/100. Resumes with 80+ scores get 3x more interviews. Focus on the AI suggestions in your resume page.`,
      })
    } else {
      insights.push({
        type: "ats",
        severity: "success",
        title: "Strong ATS score",
        description: `Your ATS score of ${resume.atsScore}/100 puts you in the top quartile. Keep it tailored per application.`,
      })
    }
  }

  // 2. Application funnel insight
  if (applications.length > 0) {
    const stages = applications.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const applied = (stages.applied || 0) + (stages.screening || 0) + (stages.interview || 0) + (stages.offer || 0)
    const interviews = (stages.interview || 0) + (stages.offer || 0)
    if (applied >= 3 && interviews === 0) {
      insights.push({
        type: "funnel",
        severity: "warning",
        title: "You're applying but not getting interviews",
        description: `You've applied to ${applied} roles but haven't reached interview stage yet. This usually means resume tailoring or targeting needs work — try the AI Career Advisor for specific advice.`,
      })
    } else if (interviews > 0) {
      insights.push({
        type: "funnel",
        severity: "success",
        title: "You're getting interviews",
        description: `${interviews} of your applications reached interview stage — a ${(interviews / applied * 100).toFixed(0)}% response rate, above the industry average of ~10%.`,
      })
    }
  }

  // 3. Saved-but-not-applied
  const savedJobIds = new Set(savedJobs.map(s => s.jobId))
  const appliedJobIds = new Set(applications.map(a => a.jobId))
  const stale = [...savedJobIds].filter(id => !appliedJobIds.has(id))
  if (stale.length >= 3) {
    insights.push({
      type: "saved",
      severity: "info",
      title: `${stale.length} saved jobs you haven't applied to`,
      description: "Saved jobs go stale fast — companies often close roles within 30 days. Consider applying to your top 3 this week.",
    })
  }

  // 4. Skill gap analysis (most common missing skill across recommended jobs)
  if (resume) {
    const recentJobs = await db.job.findMany({
      where: { status: "open" },
      include: { company: true },
      orderBy: { postedAt: "desc" },
      take: 30,
    })
    const missingSkillCounts: Record<string, number> = {}
    for (const j of recentJobs) {
      const m = localMatchScore(
        { skills: parseJsonArray(resume.skills), technologies: parseJsonArray(resume.technologies), yearsExp: resume.yearsExp ?? 0, targetRole: resume.targetRole },
        { skills: parseJsonArray(j.skills), technologies: parseJsonArray(j.technologies), experienceYrs: j.experienceYrs, title: j.title, seniority: j.seniority, category: j.category }
      )
      for (const s of m.missingSkills) missingSkillCounts[s] = (missingSkillCounts[s] || 0) + 1
      for (const t of m.missingTech) missingSkillCounts[t] = (missingSkillCounts[t] || 0) + 1
    }
    const topMissing = Object.entries(missingSkillCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5)
    if (topMissing.length > 0) {
      insights.push({
        type: "skill_gap",
        severity: "info",
        title: "Top skill gaps in your market",
        description: `The most-requested skills you're missing: ${topMissing.map(s => `${s.name} (in ${s.count} jobs)`).join(", ")}. Adding any of these to your resume could unlock many more matches.`,
        data: topMissing,
      })
    }
  }

  // 5. Optimal application rate insight
  if (applications.length < 5) {
    insights.push({
      type: "rate",
      severity: "info",
      title: "Apply more — your funnel is thin",
      description: `You have ${applications.length} applications. Job seekers who apply to 5-10 roles per week see ~2x more responses. Quality matters, but volume does too.`,
    })
  }

  // Try AI-driven strategic recommendation
  const context = resume ? `Resume target role: ${resume.targetRole}, ATS: ${resume.atsScore}/100. Skills: ${parseJsonArray(resume.skills).slice(0, 8).join(", ")}.` : "No resume uploaded."
  const aiAdvice = await generateChat(
    [
      { role: "system", content: "You are a senior career strategist. Based on the candidate's situation, give ONE specific, non-obvious strategic recommendation in 2-3 sentences. Be concrete — name a specific action, not a platitude." },
      { role: "user", content: `${context}\nApplications: ${applications.length}. Saved jobs: ${savedJobs.length}.\n\nGive the recommendation.` },
    ],
    { temperature: 0.7, maxTokens: 200 }
  )
  if (aiAdvice) {
    insights.push({
      type: "ai_strategy",
      severity: "info",
      title: "AI strategic recommendation",
      description: aiAdvice,
    })
  }

  return NextResponse.json({ insights })
}
