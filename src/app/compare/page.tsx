import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { CompareView } from "@/components/jobs/compare-view"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const user = await getSession().catch(() => null)
  const jobIds = (sp.ids as string | undefined)?.split(",").filter(Boolean) || []
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <CompareView initialIds={jobIds} />
      </main>
      <AppFooter />
    </div>
  )
}
