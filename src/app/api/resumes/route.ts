import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const resumes = await db.resume.findMany({
    where: { userId: user.id },
    orderBy: { isPrimary: "desc" },
  })
  return NextResponse.json({
    resumes: resumes.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      isPrimary: r.isPrimary,
      rawText: r.rawText,
      skills: parseJsonArray(r.skills),
      technologies: parseJsonArray(r.technologies),
      experience: parseJsonArray(r.experience),
      education: parseJsonArray(r.education),
      certifications: parseJsonArray(r.certifications),
      languages: parseJsonArray(r.languages),
      careerCategory: r.careerCategory,
      targetRole: r.targetRole,
      yearsExp: r.yearsExp,
      atsScore: r.atsScore,
      strengths: parseJsonArray(r.strengths),
      weaknesses: parseJsonArray(r.weaknesses),
      improvementSuggestions: parseJsonArray(r.improvementSuggestions),
      analysisCompletedAt: r.analysisCompletedAt,
      createdAt: r.createdAt,
    })),
  })
}
