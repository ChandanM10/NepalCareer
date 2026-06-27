import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { JobsBrowser } from "@/components/jobs/browser"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const user = await getSession().catch(() => null)

  // Pre-fetch filter facets on the server
  const [categories, regions, countries] = await Promise.all([
    db.job.groupBy({
      by: ["category"],
      where: { status: "open" },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
    }),
    db.job.groupBy({
      by: ["region"],
      where: { status: "open" },
      _count: { _all: true },
      orderBy: { _count: { region: "desc" } },
    }),
    db.job.groupBy({
      by: ["country"],
      where: { status: "open" },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 12,
    }),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <JobsBrowser
          initialParams={sp as Record<string, string>}
          facets={{
            categories: categories.filter((c) => c.category).map((c) => ({ name: c.category as string, count: c._count._all })),
            regions: regions.filter((r) => r.region).map((r) => ({ name: r.region as string, count: r._count._all })),
            countries: countries.filter((c) => c.country).map((c) => ({ name: c.country as string, count: c._count._all })),
          }}
        />
      </main>
      <AppFooter />
    </div>
  )
}
