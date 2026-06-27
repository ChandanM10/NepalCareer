import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { analyzeResume } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { fileName, rawText, makePrimary } = body as {
    fileName?: string
    rawText?: string
    makePrimary?: boolean
  }
  if (!fileName || !rawText) {
    return NextResponse.json({ error: "fileName and rawText required" }, { status: 400 })
  }

  // Run AI analysis
  const analysis = await analyzeResume(rawText)

  // If makePrimary, unset existing primaries
  if (makePrimary) {
    await db.resume.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    })
  }

  const resume = await db.resume.create({
    data: {
      userId: user.id,
      fileName,
      rawText,
      isPrimary: makePrimary ?? true,
      skills: JSON.stringify(analysis.skills),
      technologies: JSON.stringify(analysis.technologies),
      experience: "[]",
      education: "[]",
      certifications: "[]",
      languages: "[]",
      careerCategory: analysis.careerCategory,
      targetRole: analysis.targetRole,
      yearsExp: analysis.yearsExp,
      atsScore: analysis.atsScore,
      strengths: JSON.stringify(analysis.strengths),
      weaknesses: JSON.stringify(analysis.weaknesses),
      improvementSuggestions: JSON.stringify(analysis.improvementSuggestions),
      analysisCompletedAt: new Date(),
    },
  })

  await db.activity.create({
    data: {
      userId: user.id,
      type: "uploaded_resume",
      title: `Uploaded resume: ${fileName}`,
      meta: JSON.stringify({ resumeId: resume.id, atsScore: analysis.atsScore }),
    },
  })

  return NextResponse.json({ ok: true, resumeId: resume.id, analysis })
}
