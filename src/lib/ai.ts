/**
 * AI helpers — wrap z-ai-web-dev-sdk with graceful fallback when SDK is unavailable.
 * All functions are safe to call from server code (API routes / Server Actions).
 */
import ZAI from "z-ai-web-dev-sdk"

let _zai: any = null
async function getZai() {
  if (_zai) return _zai
  try {
    _zai = await ZAI.create()
    return _zai
  } catch (e) {
    console.warn("[ai] z-ai SDK unavailable, using fallback:", (e as Error).message)
    return null
  }
}

export interface ChatMsg {
  role: "system" | "user" | "assistant"
  content: string
}

/**
 * Generate text via the LLM. Returns null on failure (callers should provide fallback).
 */
export async function generateChat(
  messages: ChatMsg[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string | null> {
  const zai = await getZai()
  if (!zai) return null
  try {
    const res = await zai.chat.completions.create({
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
    })
    return res.choices?.[0]?.message?.content ?? null
  } catch (e) {
    console.warn("[ai] generateChat failed:", (e as Error).message)
    return null
  }
}

/**
 * Local deterministic job-match score (0-100) based on skill/tech overlap.
 * Used as the primary matcher (always works). When the LLM is available,
 * we additionally call it for narrative reasoning.
 */
export function localMatchScore(
  resume: { skills: string[]; technologies: string[]; yearsExp: number; targetRole?: string | null },
  job: { skills: string[]; technologies: string[]; experienceYrs?: number | null; title: string; seniority?: string | null; category?: string | null }
): { score: number; matchedSkills: string[]; missingSkills: string[]; matchedTech: string[]; missingTech: string[] } {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, "")
  const setHas = (arr: string[]) => new Set(arr.map(norm))

  const rSkills = setHas(resume.skills)
  const jSkills = setHas(job.skills)
  const rTech = setHas(resume.technologies)
  const jTech = setHas(job.technologies)

  const matchedSkills = job.skills.filter((s) => rSkills.has(norm(s)))
  const missingSkills = job.skills.filter((s) => !rSkills.has(norm(s)))
  const matchedTech = job.technologies.filter((s) => rTech.has(norm(s)))
  const missingTech = job.technologies.filter((s) => !rTech.has(norm(s)))

  // Weighting
  const skillsScore = job.skills.length ? matchedSkills.length / job.skills.length : 0.5
  const techScore = job.technologies.length ? matchedTech.length / job.technologies.length : 0.5
  const expGap = Math.max(0, (job.experienceYrs ?? 0) - resume.yearsExp)
  const expScore = Math.max(0, 1 - expGap * 0.15)

  // Seniority alignment (rough)
  const seniorityRank: Record<string, number> = { intern: 0, junior: 1, mid: 2, senior: 3, lead: 4, staff: 5, director: 6, vp: 7, executive: 8 }
  const rRank = seniorityRank["senior"] ?? 3 // assume targetRole ~ senior in demo
  const jRank = seniorityRank[job.seniority ?? "mid"] ?? 2
  const seniorityScore = Math.max(0, 1 - Math.abs(rRank - jRank) * 0.2)

  const total = skillsScore * 0.45 + techScore * 0.3 + expScore * 0.15 + seniorityScore * 0.1
  const score = Math.round(Math.min(99, Math.max(15, total * 100)))

  return { score, matchedSkills, missingSkills, matchedTech, missingTech }
}

/**
 * Build a natural-language match explanation. Calls LLM if available,
 * otherwise uses a deterministic template.
 */
export async function explainMatch(args: {
  jobTitle: string
  companyName: string
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  matchedTech: string[]
  missingTech: string[]
}): Promise<string> {
  const fallback = buildFallbackExplanation(args)
  const out = await generateChat(
    [
      {
        role: "system",
        content:
          "You are a senior technical recruiter. Given job-fit data, write a concise (3-4 sentences) explanation of fit. Be specific and honest about gaps. Use plain prose, no markdown headings, no lists, no emojis.",
      },
      {
        role: "user",
        content: `Job: ${args.jobTitle} at ${args.companyName}\nOverall fit: ${args.matchScore}/100\nMatched skills: ${args.matchedSkills.join(", ") || "none"}\nMissing skills: ${args.missingSkills.join(", ") || "none"}\nMatched tech: ${args.matchedTech.join(", ") || "none"}\nMissing tech: ${args.missingTech.join(", ") || "none"}\n\nWrite the explanation.`,
      },
    ],
    { temperature: 0.5, maxTokens: 200 }
  )
  return out?.trim() || fallback
}

function buildFallbackExplanation(args: {
  jobTitle: string
  companyName: string
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  matchedTech: string[]
  missingTech: string[]
}): string {
  const strength = args.matchScore >= 80 ? "strong" : args.matchScore >= 60 ? "solid" : "developing"
  const topMatched = [...args.matchedSkills, ...args.matchedTech].slice(0, 4)
  const topMissing = [...args.missingSkills, ...args.missingTech].slice(0, 3)
  let s = `This is a ${strength} match (${args.matchScore}/100) for the ${args.jobTitle} role at ${args.companyName}. `
  if (topMatched.length) s += `Your profile aligns well on ${topMatched.join(", ")}. `
  if (topMissing.length) s += `To strengthen your application, consider brushing up on ${topMissing.join(", ")}. `
  s += "Tailoring your resume to highlight relevant projects will improve your odds further."
  return s
}

/**
 * AI Career Advisor — uses LLM with strong system prompt and a fallback.
 */
export async function careerAdvice(
  history: ChatMsg[],
  userMessage: string,
  context?: { resumeSummary?: string; targetRole?: string }
): Promise<string> {
  const systemPrompt = `You are an expert AI Career Advisor on a job-discovery platform.
You help candidates with: career pivots, resume optimization, interview prep, salary negotiation, skill development, and job-search strategy.
Be specific, actionable, and warm. Use markdown sparingly (bold for emphasis, occasional bullets).
Keep responses under 250 words unless the user explicitly asks for depth.
${context?.resumeSummary ? `Candidate context: ${context.resumeSummary}` : ""}
${context?.targetRole ? `Target role: ${context.targetRole}` : ""}`

  const out = await generateChat(
    [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: userMessage }],
    { temperature: 0.7, maxTokens: 600 }
  )
  if (out) return out

  // Fallback: heuristic advice
  return fallbackAdvice(userMessage)
}

function fallbackAdvice(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("resume") || m.includes("cv")) {
    return "Here are some quick wins for your resume:\n\n- **Quantify every bullet** — replace 'improved performance' with 'reduced p99 latency by 60% (800ms → 320ms)'.\n- **Front-load skills** — put a 6–8 item skills block in the top third.\n- **Mirror job description language** — if a posting says 'distributed systems', use that exact phrase.\n- **Tailor for each role** — keep a master resume, then derive tailored versions."
  }
  if (m.includes("interview")) {
    return "Interview prep in three layers:\n\n1. **Behavioral** — prepare 5 STAR stories covering: leadership, conflict, failure, ambiguity, and a stretch project.\n2. **Technical** — practice out loud; use a timer. For coding rounds, narrate your thinking.\n3. **Company-specific** — research recent news, product launches, and the team's published work. Have 3 thoughtful questions ready."
  }
  if (m.includes("salary") || m.includes("negotiat")) {
    return "Salary negotiation playbook:\n\n- **Never give a number first** — redirect with 'I'd like to learn more about the role and total comp structure.'\n- **Anchor on data** — use Levels.fyi, Glassdoor, and your network.\n- **Negotiate the package**, not just base — equity, sign-on, PTO, severance all matter.\n- **Get it in writing** — verbal offers don't count.\n- **Be ready to walk** — the best negotiators have alternatives."
  }
  if (m.includes("pivot") || m.includes("switch") || m.includes("transition")) {
    return "Career pivot framework:\n\n1. **Map transferable skills** — what are you already great at that the target role values?\n2. **Fill the gap deliberately** — identify 2-3 missing skills and acquire them via project work (not just courses).\n3. **Build a portfolio piece** that proves you can do the new role.\n4. **Network into the role** — informational interviews with people who made the same pivot.\n5. **Tell a coherent story** — 'I'm a ___ who realized ___ and now I'm ___.'"
  }
  return "I'd love to help with that. Could you share a bit more about your situation — your current role, target role, and what specifically you'd like advice on? In the meantime, here are some general principles:\n\n- **Be specific** about the outcome you want.\n- **Optimize for learning** early in your career, compensation later.\n- **Your network is your net worth** — invest in relationships before you need them.\n- **Ship in public** — portfolios beat resumes."
}

/**
 * Generate a tailored cover letter.
 */
export async function generateCoverLetter(args: {
  jobTitle: string
  companyName: string
  jobDescription: string
  candidateName: string
  candidateBackground: string
  matchedSkills: string[]
}): Promise<string> {
  const fallback = `Dear ${args.companyName} Hiring Team,

I'm excited to apply for the ${args.jobTitle} role at ${args.companyName}. With my background in ${args.candidateBackground.split(".")[0]}, I'm confident I can contribute meaningfully to your team from day one.

What draws me to ${args.companyName} specifically is the opportunity to work on problems that matter at scale. My experience with ${args.matchedSkills.slice(0, 3).join(", ")} aligns directly with your requirements, and I'm eager to apply these skills to drive impact for your team.

I'd welcome the chance to discuss how my background and enthusiasm can contribute to ${args.companyName}'s mission.

Best regards,
${args.candidateName}`

  const out = await generateChat(
    [
      {
        role: "system",
        content: "You are an expert cover-letter writer. Write a concise, authentic cover letter (under 200 words) that avoids clichés and shows genuine research. Output only the letter, no preamble.",
      },
      {
        role: "user",
        content: `Role: ${args.jobTitle} at ${args.companyName}\nJob description (excerpt):\n${args.jobDescription.slice(0, 600)}\n\nCandidate: ${args.candidateName}\nBackground: ${args.candidateBackground}\nRelevant skills: ${args.matchedSkills.join(", ")}\n\nWrite the cover letter.`,
      },
    ],
    { temperature: 0.7, maxTokens: 400 }
  )
  return out?.trim() || fallback
}

/**
 * Analyze a resume — extract structured info + ATS score + suggestions.
 * Uses LLM if available, otherwise returns deterministic heuristics.
 */
export async function analyzeResume(rawText: string): Promise<{
  skills: string[]
  technologies: string[]
  yearsExp: number
  targetRole: string
  atsScore: number
  strengths: string[]
  weaknesses: string[]
  improvementSuggestions: string[]
  careerCategory: string
}> {
  const fallback = localResumeAnalysis(rawText)
  const out = await generateChat(
    [
      {
        role: "system",
        content:
          "You are an ATS + resume expert. Analyze the resume and respond ONLY with valid JSON matching this schema:\n" +
          JSON.stringify(
            {
              skills: ["string"],
              technologies: ["string"],
              yearsExp: 0,
              targetRole: "string",
              atsScore: 0,
              strengths: ["string"],
              weaknesses: ["string"],
              improvementSuggestions: ["string"],
              careerCategory: "string",
            },
            null,
            0
          ),
      },
      { role: "user", content: `Resume text:\n\n${rawText.slice(0, 4000)}` },
    ],
    { temperature: 0.3, maxTokens: 1200 }
  )
  if (!out) return fallback
  try {
    // Strip any markdown fences
    const cleaned = out.replace(/^```(?:json)?\n?|\n?```$/g, "").trim()
    const parsed = JSON.parse(cleaned)
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : fallback.skills,
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : fallback.technologies,
      yearsExp: typeof parsed.yearsExp === "number" ? parsed.yearsExp : fallback.yearsExp,
      targetRole: typeof parsed.targetRole === "string" ? parsed.targetRole : fallback.targetRole,
      atsScore: typeof parsed.atsScore === "number" ? Math.max(0, Math.min(100, parsed.atsScore)) : fallback.atsScore,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallback.strengths,
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : fallback.weaknesses,
      improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : fallback.improvementSuggestions,
      careerCategory: typeof parsed.careerCategory === "string" ? parsed.careerCategory : fallback.careerCategory,
    }
  } catch {
    return fallback
  }
}

/** Deterministic local resume analysis — keyword-based, used as fallback */
function localResumeAnalysis(rawText: string) {
  const text = rawText.toLowerCase()
  const KNOWN_SKILLS = ["system design", "algorithms", "code review", "testing", "distributed systems", "machine learning", "statistics", "data modeling", "leadership", "communication", "agile", "project management", "product strategy", "analytics"]
  const KNOWN_TECH = ["python", "javascript", "typescript", "java", "go", "rust", "c++", "react", "vue", "angular", "node.js", "next.js", "django", "flask", "fastapi", "spring", "postgresql", "mysql", "mongodb", "redis", "kafka", "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "pytorch", "tensorflow", "hugging face"]
  const skills = KNOWN_SKILLS.filter((s) => text.includes(s))
  const technologies = KNOWN_TECH.filter((t) => text.includes(t))

  // crude years extraction
  const yearMatches = text.match(/(\d+)\+?\s*years?/g) || []
  const years = yearMatches
    .map((m) => parseInt(m))
    .filter((n) => !isNaN(n) && n > 0 && n < 50)
  const yearsExp = years.length ? Math.max(...years) : 2

  // crude target role from "senior X" / "X engineer"
  const titleMatch = rawText.match(/(senior|staff|lead|principal)?\s*(software|frontend|backend|full[-\s]?stack|data|ml|machine learning|devops|security|product|design)\s*(engineer|developer|scientist|manager|designer|analyst)/i)
  const targetRole = titleMatch ? titleMatch[0] : "Software Engineer"

  // ATS score: based on length, presence of metrics, skills, tech
  let score = 50
  if (rawText.length > 1500) score += 10
  if (rawText.length > 3000) score += 5
  if (/\d+%|\$\d|\d+x/.test(rawText)) score += 15 // quantified achievements
  if (skills.length >= 5) score += 10
  if (technologies.length >= 5) score += 10
  if (/bachelor|b\.s|b\.a|master|m\.s|phd/i.test(rawText)) score += 5
  score = Math.min(95, score)

  return {
    skills: skills.length ? skills : ["Communication", "Problem Solving"],
    technologies: technologies.length ? technologies : ["JavaScript", "Git"],
    yearsExp,
    targetRole,
    atsScore: score,
    strengths: [
      skills.length >= 5 ? "Diverse skill set" : "Clear skill set",
      /\d+%|\$\d|\d+x/.test(rawText) ? "Quantified achievements" : "Clear experience narrative",
      technologies.length >= 5 ? "Broad technology exposure" : "Specialized tech focus",
    ],
    weaknesses: [
      score < 70 ? "Limited quantifiable impact metrics" : "Could highlight leadership more",
      skills.length < 5 ? "Skill section could be expanded" : "Some skills lack demonstrated depth",
    ],
    improvementSuggestions: [
      "Add 2-3 quantified achievements per role (e.g. 'reduced latency by 40%')",
      "Include a brief technical summary near the top",
      "Tailor keywords to match the job description for ATS",
      "Add links to GitHub / portfolio / LinkedIn",
    ],
    careerCategory: "Engineering",
  }
}
