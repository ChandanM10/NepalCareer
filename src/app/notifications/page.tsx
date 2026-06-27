import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { NotificationsView } from "@/components/dashboard/notifications-view"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const user = await getSession().catch(() => null)
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <NotificationsView />
      </main>
      <AppFooter />
    </div>
  )
}
