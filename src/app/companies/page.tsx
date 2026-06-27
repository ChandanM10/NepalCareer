import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { CompaniesBrowser } from "@/components/companies/browser"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function CompaniesPage() {
  const user = await getSession().catch(() => null)
  const industries = await db.company.groupBy({
    by: ["industry"],
    _count: { _all: true },
    orderBy: { _count: { industry: "desc" } },
  })
  const sizes = await db.company.groupBy({
    by: ["size"],
    _count: { _all: true },
    orderBy: { _count: { size: "desc" } },
  })
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <CompaniesBrowser
          industries={industries.map((i) => ({ name: i.industry || "", count: i._count._all })).filter((i) => i.name)}
          sizes={sizes.map((s) => ({ name: s.size || "", count: s._count._all })).filter((s) => s.name)}
        />
      </main>
      <AppFooter />
    </div>
  )
}
