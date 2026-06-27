import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { parseJsonArray } from "@/lib/format"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const sources = await db.watchSource.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({
    sources: sources.map((s) => ({
      id: s.id,
      companyName: s.companyName,
      url: s.url,
      country: s.country,
      industry: s.industry,
      lastCheckedAt: s.lastCheckedAt,
      lastJobCount: s.lastJobCount,
      newJobsCount: s.newJobsCount,
      status: s.status,
      lastError: s.lastError,
      discoveredJobs: parseJsonArray(s.discoveredJobs),
      createdAt: s.createdAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { companyName, url, country, industry } = body
  if (!companyName || !url) {
    return NextResponse.json({ error: "companyName and url required" }, { status: 400 })
  }
  // Validate URL
  try { new URL(url) } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }) }

  const created = await db.watchSource.create({
    data: {
      userId: user.id,
      companyName,
      url,
      country: country || "Nepal",
      industry: industry || null,
      status: "active",
      discoveredJobs: "[]",
    },
  })
  await db.activity.create({
    data: {
      userId: user.id,
      type: "created_alert",
      title: `Started watching ${companyName}`,
      meta: JSON.stringify({ watchSourceId: created.id, url }),
    },
  })
  return NextResponse.json({ ok: true, source: created })
}
