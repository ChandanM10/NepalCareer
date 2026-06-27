import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { ResumeView } from "@/components/resume/view"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ResumePage() {
  const user = await getSession().catch(() => null)
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <ResumeView />
      </main>
      <AppFooter />
    </div>
  )
}
