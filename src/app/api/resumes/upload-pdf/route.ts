import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { analyzeResume } from "@/lib/ai"
import { ensureDOMPolyfills } from "@/lib/pdf-polyfill"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

ensureDOMPolyfills()

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
              text: "This is an image of a resume. Extract ALL the text content from it, preserving the structure. Output ONLY the extracted text — no commentary, no markdown formatting, just the raw resume text exactly as it appears. Include name, contact info, summary, work experience, education, skills, and any other sections visible.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    } as any)

    return response.choices?.[0]?.message?.content || ""
  } catch (e: any) {
    console.error("VLM image extraction failed:", e?.message)
    return ""
  }
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const makePrimary = formData.get("makePrimary") === "true"

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

  if (isPdf) {
    fileType = "pdf"
    try {
      const mod = "pdf-parse"
      const { PDFParse } = await import(mod)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      rawText = result.text || ""
      await parser.destroy()
    } catch (e: any) {
      console.error("PDF parse error:", e)
      return NextResponse.json({ error: `Failed to parse PDF: ${e?.message || "unknown"}` }, { status: 422 })
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
        error: "We couldn't extract text from the image. The AI vision model may be unavailable. Try uploading a PDF or text file instead, or ensure the image is clear and readable.",
      }, { status: 422 })
    }
  } else {
    return NextResponse.json({
      error: "Unsupported file type. Please upload a PDF, PNG, JPG, or TXT file.",
    }, { status: 415 })
  }

  if (rawText.trim().length < 50) {
    return NextResponse.json({
      error: "We couldn't extract enough text from the file. Try a different file or paste the text manually.",
      extractedLength: rawText.length,
    }, { status: 422 })
  }

  const analysis = await analyzeResume(rawText)

  if (makePrimary) {
    await db.resume.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    })
  }

  const resume = await db.resume.create({
    data: {
      userId: user.id,
      fileName: file.name,
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
      title: `Uploaded resume: ${file.name}`,
      meta: JSON.stringify({ resumeId: resume.id, atsScore: analysis.atsScore, fileType }),
    },
  })

  return NextResponse.json({ ok: true, resumeId: resume.id, analysis, extractedLength: rawText.length, fileType })
}
