import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

/**
 * Simulated crawl endpoint.
 *
 * In a real system, this would fetch the company's careers page and parse new jobs.
 * In this sandbox, we can't actually scrape arbitrary URLs (no external fetch from server
 * to most career pages due to CORS/bot protection), so we SIMULATE discovery:
 *
 * - Generate plausible new job titles based on the company's industry
 * - Random chance (50%) of finding 1-2 "new" jobs since last check
 * - Create a notification if new jobs are found
 * - Log WhatsApp/Email delivery (mock)
 *
 * In production, this would be a background cron job that actually fetches the page
 * and sends real WhatsApp Business API / SendGrid emails.
 */

const INDUSTRY_TEMPLATES: Record<string, Array<{ title: string; category: string; seniority: string }>> = {
  "AI / EdTech": [
    { title: "ML Engineer — NLP", category: "AI/ML", seniority: "mid" },
    { title: "Data Scientist", category: "Data", seniority: "senior" },
    { title: "AI Research Intern", category: "AI/ML", seniority: "intern" },
  ],
  "Fintech": [
    { title: "Senior Java Backend Engineer", category: "Engineering", seniority: "senior" },
    { title: "Android Engineer", category: "Engineering", seniority: "mid" },
    { title: "DevOps Engineer", category: "Engineering", seniority: "mid" },
    { title: "Product Manager — Payments", category: "Product", seniority: "senior" },
  ],
  "Healthcare IT": [
    { title: "Java Backend Engineer", category: "Engineering", seniority: "mid" },
    { title: "Healthcare Data Analyst", category: "Data", seniority: "mid" },
    { title: "QA Engineer", category: "Engineering", seniority: "mid" },
  ],
  "Data / AI Training": [
    { title: "Data Pipeline Engineer", category: "Data", seniority: "mid" },
    { title: "Platform Engineer", category: "Engineering", seniority: "senior" },
    { title: "AI Training Operations Lead", category: "Operations", seniority: "lead" },
  ],
  "Data Analytics": [
    { title: "Senior Data Engineer", category: "Data", seniority: "senior" },
    { title: "Actuarial Analyst", category: "Data", seniority: "mid" },
    { title: "Analytics Manager", category: "Data", seniority: "lead" },
  ],
  "Product Studio": [
    { title: "Senior React Engineer", category: "Engineering", seniority: "senior" },
    { title: "Product Designer", category: "Design", seniority: "mid" },
    { title: "Engineering Manager", category: "Engineering", seniority: "lead" },
  ],
}

const DEFAULT_TEMPLATES = [
  { title: "Software Engineer", category: "Engineering", seniority: "mid" },
  { title: "Senior Software Engineer", category: "Engineering", seniority: "senior" },
  { title: "Frontend Developer", category: "Engineering", seniority: "mid" },
]

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await ctx.params

  const source = await db.watchSource.findFirst({ where: { id, userId: user.id } })
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Simulate a crawl delay
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 600))

  // 60% chance of finding new jobs on each check
  const foundNew = Math.random() < 0.6
  const newCount = foundNew ? Math.floor(1 + Math.random() * 2) : 0

  const templates = INDUSTRY_TEMPLATES[source.industry || ""] || DEFAULT_TEMPLATES
  const previousJobs = parseJsonArray<{ title: string; url: string; postedAt: string }>(source.discoveredJobs)
  const picked = pickRandom(templates, newCount)
  const newDiscovered = picked.map((t) => ({
    title: t.title,
    category: t.category,
    seniority: t.seniority,
    url: `${source.url}/${t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    postedAt: new Date().toISOString(),
    isNew: true,
  }))

  const allDiscovered = [...newDiscovered, ...previousJobs.map((j) => ({ ...j, isNew: false }))].slice(0, 20)

  await db.watchSource.update({
    where: { id },
    data: {
      lastCheckedAt: new Date(),
      lastJobCount: allDiscovered.length,
      newJobsCount: newCount,
      discoveredJobs: JSON.stringify(allDiscovered),
      status: "active",
      lastError: null,
    },
  })

  // Create a notification if new jobs found and user has any notify channel enabled
  if (newCount > 0) {
    const fullUser = await db.user.findUnique({ where: { id: user.id } })
    const channels: string[] = []
    if (fullUser?.notifyInApp) channels.push("in_app")
    if (fullUser?.notifyWhatsapp && fullUser?.whatsappNumber) channels.push("whatsapp")
    if (fullUser?.notifyEmail) channels.push("email")

    const deliveryLog: any[] = []
    const nowIso = new Date().toISOString()
    if (channels.includes("whatsapp")) {
      deliveryLog.push({
        channel: "whatsapp",
        status: "delivered",
        at: nowIso,
        message: `Mock delivery to ${fullUser!.whatsappNumber} via WhatsApp Business API (sandboxed)`,
      })
    }
    if (channels.includes("email")) {
      deliveryLog.push({
        channel: "email",
        status: "delivered",
        at: nowIso,
        message: `Mock delivery to ${fullUser!.email} via SendGrid (sandboxed)`,
      })
    }
    if (channels.includes("in_app")) {
      deliveryLog.push({
        channel: "in_app",
        status: "delivered",
        at: nowIso,
        message: "Shown in notification center",
      })
    }

    const newJobsList = newDiscovered.map((j) => j.title).join(", ")
    const notif = await db.notification.create({
      data: {
        userId: user.id,
        type: "watch_source_new",
        title: `${newCount} new job${newCount > 1 ? "s" : ""} at ${source.companyName}`,
        body: `${source.companyName} just posted: ${newJobsList}. ${source.url}`,
        meta: JSON.stringify({
          watchSourceId: source.id,
          companyName: source.companyName,
          url: source.url,
          newJobs: newDiscovered,
        }),
        channels: JSON.stringify(channels),
        deliveryLog: JSON.stringify(deliveryLog),
        read: false,
      },
    })
    return NextResponse.json({
      ok: true,
      newJobs: newDiscovered,
      totalJobs: allDiscovered.length,
      notification: notif,
      delivered: channels,
    })
  }

  return NextResponse.json({
    ok: true,
    newJobs: [],
    totalJobs: allDiscovered.length,
    message: "No new jobs since last check.",
  })
}
