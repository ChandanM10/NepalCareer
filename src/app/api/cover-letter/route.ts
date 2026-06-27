import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { generateCoverLetter } from "@/lib/ai"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { jobId } = body as { jobId?: string }
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 })

  const [job, resume] = await Promise.all([
    db.job.findUnique({ where: { id: jobId }, include: { company: true } }),
    db.resume.findFirst({ where: { userId: user.id }, orderBy: { isPrimary: "desc" } }),
  ])
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  const u = await db.user.findUnique({ where: { id: user.id } })
  const candidateBackground = resume?.rawText || u?.bio || `${u?.headline || "Candidate"} with relevant experience.`
  const matchedSkills = resume ? parseJsonArray(resume.skills).slice(0, 5) : []

  const letter = await generateCoverLetter({
    jobTitle: job.title,
    companyName: job.company.name,
    jobDescription: job.description,
    candidateName: u?.fullName || "Candidate",
    candidateBackground,
    matchedSkills,
  })

  return NextResponse.json({ ok: true, coverLetter: letter })
}
