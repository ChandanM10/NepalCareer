import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { LandingHero } from "@/components/landing/hero"
import { ResumeSearchSection } from "@/components/landing/resume-search"
import { LandingStats } from "@/components/landing/stats"
import { LandingCategories } from "@/components/landing/categories"
import { LandingFeatured } from "@/components/landing/featured"
import { LandingHowItWorks } from "@/components/landing/how-it-works"
import { LandingCTA } from "@/components/landing/cta"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const user = await getSession().catch(() => null)
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <main className="flex-1">
        <LandingHero />
        <ResumeSearchSection />
        <LandingStats />
        <LandingCategories />
        <LandingFeatured />
        <LandingHowItWorks />
        <LandingCTA />
      </main>
      <AppFooter />
    </div>
  )
}
