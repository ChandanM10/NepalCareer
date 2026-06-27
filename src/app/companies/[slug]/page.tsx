import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { CompanyDetail } from "@/components/companies/detail"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getSession().catch(() => null)
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <CompanyDetail slug={slug} />
      </main>
      <AppFooter />
    </div>
  )
}
