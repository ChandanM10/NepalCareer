import { redirect } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { AdminDashboard } from "@/components/admin/dashboard"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await getSession().catch(() => null)
  if (!session) redirect("/login?redirect=/admin")

  // Verify the user is an admin
  const fullUser = await db.user.findUnique({ where: { id: session.id } })
  if (!fullUser || fullUser.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={session} />
      <main className="flex-1">
        <AdminDashboard />
      </main>
      <AppFooter />
    </div>
  )
}
