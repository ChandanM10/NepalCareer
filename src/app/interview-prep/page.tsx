import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { InterviewPrepView } from "@/components/jobs/interview-prep"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function InterviewPrepPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const user = await getSession().catch(() => null)
  const jobId = (sp.jobId as string | undefined) || ""
  const focus = (sp.focus as string | undefined) || ""
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <InterviewPrepView initialJobId={jobId} initialFocus={focus} />
      </main>
      <AppFooter />
    </div>
  )
}
