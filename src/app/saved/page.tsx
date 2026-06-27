import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { SavedJobsView } from "@/components/jobs/saved-view"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function SavedPage() {
  const user = await getSession().catch(() => null)
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <SavedJobsView />
      </main>
      <AppFooter />
    </div>
  )
}
