import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { SettingsView } from "@/components/dashboard/settings-view"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const user = await getSession().catch(() => null)
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <SettingsView />
      </main>
      <AppFooter />
    </div>
  )
}
