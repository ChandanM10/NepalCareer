import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { generateChat } from "@/lib/ai"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

interface InterviewQuestion {
  category: string
  question: string
  hint: string
  difficulty: "easy" | "medium" | "hard"
}

function fallbackQuestions(jobTitle: string, skills: string[]): InterviewQuestion[] {
  const hasSystemDesign = skills.some(s => /system design|distributed|architecture/i.test(s))
  const hasML = skills.some(s => /machine learning|ml|ai/i.test(s))
  const questions: InterviewQuestion[] = [
    {
      category: "Behavioral",
      question: `Tell me about a time you had to make a difficult trade-off in a project. What was the situation, and how did you decide?`,
      hint: "Use the STAR framework: Situation, Task, Action, Result. Quantify the impact of your decision.",
      difficulty: "easy",
    },
    {
      category: "Behavioral",
      question: `Describe a conflict you had with a teammate on the ${jobTitle} role you're targeting. How did you resolve it?`,
      hint: "Show empathy + active listening. Avoid blaming; focus on what you learned.",
      difficulty: "medium",
    },
    {
      category: "Technical",
      question: hasSystemDesign
        ? `Design a system that handles 10M daily active users with sub-200ms p99 latency. Walk me through your architecture.`
        : `Walk me through how you would implement a feature end-to-end, from database schema to UI. What trade-offs would you consider?`,
      hint: "Start with requirements gathering, then high-level architecture, then drill into data models, scaling, and failure modes.",
      difficulty: "hard",
    },
    {
      category: "Technical",
      question: `Explain a recent technical decision you're proud of. Why did you choose that approach over alternatives?`,
      hint: "Show depth: explain at least 2 alternatives you considered and why you rejected them.",
      difficulty: "medium",
    },
  ]
  if (hasML) {
    questions.push({
      category: "ML",
      question: `You're given a dataset with 1M rows and 500 features. Walk me through your end-to-end modeling pipeline.`,
      hint: "Cover: EDA, feature engineering, train/val/test split, baseline, model selection, hyperparameter tuning, evaluation, deployment, monitoring.",
      difficulty: "hard",
    })
  }
  questions.push({
    category: "Reverse interview",
    question: `What's a question you'd ask the interviewer to learn about the team's engineering culture?`,
    hint: "Good options: 'What's the last technical decision the team reversed, and why?' or 'How does the team handle tech debt vs feature work?'",
    difficulty: "easy",
  })
  return questions
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { jobId, focusArea } = body as { jobId?: string; focusArea?: string }

  let job: any = null
  let jobTitle = "the role"
  let skills: string[] = []
  let technologies: string[] = []
  let jobDescription = ""

  if (jobId) {
    job = await db.job.findUnique({ where: { id: jobId }, include: { company: true } })
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })
    jobTitle = job.title
    skills = parseJsonArray(job.skills)
    technologies = parseJsonArray(job.technologies)
    jobDescription = job.description
  } else {
    // Use the user's targetRole from resume
    const resume = await db.resume.findFirst({ where: { userId: user.id }, orderBy: { isPrimary: "desc" } })
    if (resume) {
      jobTitle = resume.targetRole || "your target role"
      skills = parseJsonArray(resume.skills)
      technologies = parseJsonArray(resume.technologies)
      jobDescription = resume.rawText || ""
    }
  }

  // Try AI generation
  const sysPrompt = `You are an expert technical interviewer. Generate 6 interview questions for a candidate preparing for "${jobTitle}".
Return ONLY valid JSON: an array of objects with fields: category (Behavioral|Technical|System Design|ML|Reverse interview), question (string), hint (string, 1-2 sentences), difficulty (easy|medium|hard).
Tailor questions to the role's skills: ${skills.join(", ") || "general engineering"} and tech: ${technologies.join(", ") || "general"}.
${focusArea ? `Focus area requested: ${focusArea}.` : ""}
Mix difficulties. Include at least 1 reverse-interview question.`
  const out = await generateChat(
    [
      { role: "system", content: sysPrompt },
      { role: "user", content: `Job description (if any):\n${jobDescription.slice(0, 600)}\n\nGenerate the questions as JSON.` },
    ],
    { temperature: 0.8, maxTokens: 1200 }
  )

  let questions: InterviewQuestion[] = fallbackQuestions(jobTitle, skills)
  if (out) {
    try {
      const cleaned = out.replace(/^```(?:json)?\n?|\n?```$/g, "").trim()
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed) && parsed.length > 0) {
        questions = parsed.slice(0, 8)
      }
    } catch {
      // keep fallback
    }
  }

  await db.activity.create({
    data: {
      userId: user.id,
      type: "ai_query",
      title: `Generated interview prep for ${jobTitle}`,
      meta: JSON.stringify({ jobId, focusArea, count: questions.length }),
    },
  })

  return NextResponse.json({
    jobTitle,
    questions,
    source: out ? "ai" : "fallback",
  })
}
