"use client"
import { useState, useTransition, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Shield, FileText, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { AppFooter } from "@/components/app-footer"
import { ThemeToggle } from "@/components/theme-toggle"
import { NepalCareerLogo } from "@/components/nepalcareer-logo"

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || ""
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Login failed")
          return
        }
        toast.success(`Welcome back, ${data.fullName.split(" ")[0]}!`)
        // Use window.location.replace for a FULL page load — this ensures
        // the session cookie (set by the API response) is sent with the
        // navigation request. The 300ms delay ensures the browser has
        // fully stored the cookie before navigating. Always go to dashboard
        // after login unless a specific redirect was requested.
        const target = redirectTo || "/dashboard"
        setTimeout(() => {
          window.location.replace(target)
        }, 500)
      } catch (e: any) {
        setError(e.message || "Network error. Please check your connection and try again.")
      }
    })
  }

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="inline-flex items-center gap-2 mb-8">
        <NepalCareerLogo size={36} />
        <span className="font-bold tracking-tight">NepalCareer</span>
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-1">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Sign in to your NepalCareer account to continue your job search.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1.5">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-9"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="mb-1.5">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-9 pr-9"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={pending} className="w-full gap-1.5">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {pending ? "Signing in…" : "Sign in"}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      {/* Quick admin login */}
      <div className="mt-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Admin access</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Sign in with your admin credentials to manage jobs and view all applications.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create one free
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left: Form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Right: Hero — AI agent pitch */}
        <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary/10 via-chart-2/5 to-chart-4/10 items-center justify-center p-12">
          <div className="aurora -z-10 right-[-20%] top-[-10%] h-[400px] w-[400px] bg-primary/30" />
          <div className="aurora -z-10 left-[-10%] bottom-[-20%] h-[400px] w-[400px] bg-chart-4/20" />
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="relative max-w-lg text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-5">
              <Sparkles className="h-3 w-3" />
              AI-powered job matching
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-balance mb-4">
              Upload your resume,{" "}
              <span className="text-primary">AI agents will find a job for you.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Our AI reads your resume, scores it for ATS, extracts your skills, and
              matches you against every open role — then alerts you on WhatsApp the moment
              a new job fits.
            </p>
            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="p-3 rounded-xl glass-card">
                <FileText className="h-5 w-5 text-primary mb-2" />
                <div className="text-xs font-semibold">1. Upload resume</div>
                <div className="text-[10px] text-muted-foreground">AI parses & scores</div>
              </div>
              <div className="p-3 rounded-xl glass-card">
                <Sparkles className="h-5 w-5 text-chart-2 mb-2" />
                <div className="text-xs font-semibold">2. AI matches</div>
                <div className="text-[10px] text-muted-foreground">Score 0-100 per job</div>
              </div>
              <div className="p-3 rounded-xl glass-card">
                <Smartphone className="h-5 w-5 text-success mb-2" />
                <div className="text-xs font-semibold">3. WhatsApp alerts</div>
                <div className="text-[10px] text-muted-foreground">When new jobs fit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
