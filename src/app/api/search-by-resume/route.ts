import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { analyzeResume, localMatchScore } from "@/lib/ai"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Extract text from an image (PNG/JPG) of a resume using VLM.
 */
async function extractTextFromImage(file: File): Promise<string> {
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default
    const zai = await ZAI.create()
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = file.type || "image/png"
    const dataUrl = `data:${mimeType};base64,${base64}`

    const response = await (zai.chat.completions.create as any)({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "This is an image of a resume. Extract ALL the text content from it. Output ONLY the extracted text — no commentary. Include name, contact, summary, experience, education, skills.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    } as any)
    return response.choices?.[0]?.message?.content || ""
  } catch {
    return ""
  }
}

/**
 * Upload resume → AI analyzes → returns matching jobs sorted by match score.
 * This is the "search by resume" endpoint used on the home page.
 */
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 })
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  const isText = file.type.startsWith("text/") || /\.(txt|md|text)$/i.test(file.name)
  const isImage = file.type.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(file.name)

  let rawText = ""
  let fileType = "text"

  // Step 1: Extract text from the file
  if (isPdf) {
    fileType = "pdf"
    try {
      const { PDFParse } = await import("pdf-parse")
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const parser = new PDFParse({ buffer })
      await parser.load()
      const result = await parser.getText()
      rawText = result.text || ""
      await parser.destroy()
    } catch (e: any) {
      return NextResponse.json({ error: `Failed to parse PDF: ${e?.message}` }, { status: 422 })
    }
  } else if (isText) {
    fileType = "text"
    const arrayBuffer = await file.arrayBuffer()
    rawText = new TextDecoder("utf-8").decode(arrayBuffer)
  } else if (isImage) {
    fileType = "image"
    rawText = await extractTextFromImage(file)
    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json({
        error: "Couldn't extract text from image. Try a clearer photo or upload a PDF.",
      }, { status: 422 })
    }
  } else {
    return NextResponse.json({
      error: "Unsupported file type. Upload PDF, PNG, JPG, or TXT.",
    }, { status: 415 })
  }

  if (rawText.trim().length < 50) {
    return NextResponse.json({
      error: "Not enough text extracted. Try a different file.",
    }, { status: 422 })
  }

  // Step 2: AI analyze the resume
  const analysis = await analyzeResume(rawText)

  // Step 3: Save as primary resume
  await db.resume.updateMany({
    where: { userId: user.id, isPrimary: true },
    data: { isPrimary: false },
  })
  const resume = await db.resume.create({
    data: {
      userId: user.id,
      fileName: file.name,
      rawText,
      isPrimary: true,
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
      title: `Searched jobs with resume: ${file.name}`,
      meta: JSON.stringify({ resumeId: resume.id, atsScore: analysis.atsScore }),
    },
  })

  // Step 4: Score all open jobs against this resume
  const allJobs = await db.job.findMany({
    where: { status: "open" },
    include: { company: true },
  })

  const resumeForMatching = {
    skills: analysis.skills,
    technologies: analysis.technologies,
    yearsExp: analysis.yearsExp,
    targetRole: analysis.targetRole,
  }

  const matchedJobs = allJobs
    .map((j) => {
      const m = localMatchScore(
        resumeForMatching,
        {
          skills: parseJsonArray(j.skills),
          technologies: parseJsonArray(j.technologies),
          experienceYrs: j.experienceYrs,
          title: j.title,
          seniority: j.seniority,
          category: j.category,
        }
      )
      return {
        id: j.id,
        slug: j.slug,
        title: j.title,
        category: j.category,
        location: j.location,
        city: j.city,
        country: j.country,
        remoteStatus: j.remoteStatus,
        employmentType: j.employmentType,
        seniority: j.seniority,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        postedAt: j.postedAt,
        urgent: j.urgent,
        featured: j.featured,
        matchScore: m.score,
        matchedSkills: m.matchedSkills,
        missingSkills: m.missingSkills,
        skills: parseJsonArray(j.skills),
        technologies: parseJsonArray(j.technologies),
        company: {
          id: j.company.id,
          name: j.company.name,
          slug: j.company.slug,
          logoUrl: j.company.logoUrl,
          industry: j.company.industry,
          rating: j.company.rating,
          verified: j.company.verified,
        },
      }
    })
    .filter((j) => j.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 24) // Top 24 matches

  return NextResponse.json({
    ok: true,
    resumeId: resume.id,
    analysis,
    fileType,
    extractedLength: rawText.length,
    matchedJobs,
    totalMatched: matchedJobs.length,
  })
}
