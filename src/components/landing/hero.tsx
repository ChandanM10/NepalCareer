"use client"
import Link from "next/link"
import { Sparkles, ArrowRight, Search, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function LandingHero() {
  const [q, setQ] = useState("")
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d?.user) setUser({ fullName: d.user.fullName, role: d.user.role })
    }).catch(() => {})
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/jobs?q=${encodeURIComponent(q)}`)
  }

  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="absolute inset-0 -z-10 bg-grid" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background" />
      <div className="aurora -z-10 left-[-10%] top-[-10%] h-[400px] w-[400px] bg-primary/30" />
      <div className="aurora -z-10 right-[-10%] top-[20%] h-[500px] w-[500px] bg-chart-2/25" />
      <div className="aurora -z-10 left-[30%] bottom-[-30%] h-[400px] w-[400px] bg-chart-4/20" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6 animate-in-up">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          AI-matched to your resume · {new Date().getFullYear()}
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance animate-in-up" style={{ animationDelay: "60ms" }}>
          Find the job that fits your{" "}
          <span className="text-primary">Resume</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground text-balance max-w-2xl mx-auto animate-in-up" style={{ animationDelay: "120ms" }}>
          NepalCareer uses AI to match your resume against thousands of roles, then coaches you
          through every step — from application to offer.
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto animate-in-up" style={{ animationDelay: "180ms" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder='Try "Senior Engineer", "Remote", "ML"…'
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 h-12 text-base rounded-full glass-strong border-border/60"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 rounded-full px-6 gap-2 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Search
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 justify-center animate-in-up" style={{ animationDelay: "240ms" }}>
          {["Senior Software Engineer", "Remote", "ML Engineer", "Product Manager", "Visa Sponsor"].map((tag) => (
            <Link
              key={tag}
              href={`/jobs?q=${encodeURIComponent(tag)}`}
              className="rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* Auth-aware CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center animate-in-up" style={{ animationDelay: "300ms" }}>
          {user ? (
            <>
              <Button asChild size="lg" className="rounded-full px-6 gap-2 shadow-sm">
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                  Go to {user.role === "admin" ? "Admin Dashboard" : "Dashboard"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6 gap-2">
                <Link href="/jobs">
                  Browse all jobs
                </Link>
              </Button>
            </>
          ) : (
            <>
              {/* Admin sign in */}
              <Button asChild size="lg" className="rounded-full px-6 gap-2 shadow-sm">
                <Link href="/login">
                  <Shield className="h-4 w-4" />
                  Sign in as Admin
                </Link>
              </Button>
              {/* New user sign up */}
              <Button asChild size="lg" variant="default" className="rounded-full px-6 gap-2 bg-gradient-to-r from-chart-2 to-primary">
                <Link href="/register">
                  <User className="h-4 w-4" />
                  Sign up (New User)
                </Link>
              </Button>
              {/* Existing user sign in */}
              <Button asChild size="lg" variant="outline" className="rounded-full px-6 gap-2">
                <Link href="/login">
                  Sign in
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Role explainer */}
        {!user && (
          <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto animate-in-up" style={{ animationDelay: "360ms" }}>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Admin / Recruiter</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Post jobs, view all applications, manage companies, and access recruiter analytics.
                <br />
                <Link href="/login" className="text-primary hover:underline font-medium">Sign in with admin credentials →</Link>
              </p>
            </div>
            <div className="rounded-xl border border-chart-2/20 bg-chart-2/5 p-4 text-left">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-chart-2" />
                <span className="text-sm font-semibold">Job Seeker</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your resume, get AI-matched jobs, track applications, and receive WhatsApp alerts.
                <br />
                <Link href="/register" className="text-chart-2 hover:underline font-medium">Create a free account →</Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
