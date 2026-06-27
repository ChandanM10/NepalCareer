"use client"
import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-chart-2/5 to-chart-4/10 p-8 sm:p-12">
          <div className="aurora -z-10 right-[-20%] top-[-50%] h-[400px] w-[400px] bg-primary/30" />
          <div className="aurora -z-10 left-[-10%] bottom-[-30%] h-[300px] w-[300px] bg-chart-4/20" />

          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-4">
              <Sparkles className="h-3 w-3" />
              No credit card. No spam. Just better matches.
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-balance">
              Your next role is one upload away.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create a free account, upload your resume, and let the matches come to you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full px-6 gap-2 shadow-sm">
                <Link href="/register">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
