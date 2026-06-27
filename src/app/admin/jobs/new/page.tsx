import { redirect } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { PostJobForm } from "@/components/admin/post-job-form"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function PostJobPage() {
  const session = await getSession().catch(() => null)
  if (!session) redirect("/login?redirect=/admin/jobs/new")

  // Admin-only
  const fullUser = await db.user.findUnique({ where: { id: session.id } })
  if (!fullUser || fullUser.role !== "admin") {
    redirect("/dashboard")
  }

  const companies = await db.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, industry: true } })
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={session} />
      <main className="flex-1">
        <PostJobForm companies={companies} />
      </main>
      <AppFooter />
    </div>
  )
}
