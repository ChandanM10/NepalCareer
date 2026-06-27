"use client"
import { useState, useTransition } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, Phone, FileText } from "lucide-react"
import { toast } from "sonner"
import { AppFooter } from "@/components/app-footer"
import { ThemeToggle } from "@/components/theme-toggle"
import { NepalCareerLogo } from "@/components/nepalcareer-logo"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!fullName || !email || !password) {
      setError("Full name, email, and password are required")
      return
    }
    // Validate password strength (must match backend requirements)
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain uppercase letter")
      return
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain lowercase letter")
      return
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain number")
      return
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError("Password must contain special character (!@#$%^&*...)")
      return
    }
    if (whatsappNumber && !/^\+?\d{7,15}$/.test(whatsappNumber)) {
      setError("WhatsApp number must be in E.164 format (e.g. +97798XXXXXXXX)")
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, password, headline: whatsappNumber ? `Looking for IT roles · ${whatsappNumber}` : undefined }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Registration failed")
          return
        }
        // If they provided a WhatsApp number, save it via settings
        if (whatsappNumber) {
          await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ whatsappNumber, phoneCountry: "Nepal" }),
          })
        }
        toast.success(`Welcome to NepalCareer, ${data.fullName.split(" ")[0]}!`)
        // Use window.location.replace for a FULL page load — ensures the
        // session cookie is sent with the navigation request. Redirect to
        // dashboard where new users can start their job search.
        setTimeout(() => {
          window.location.replace("/dashboard")
        }, 500)
      } catch (e: any) {
        setError(e.message || "Network error")
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left: Form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <NepalCareerLogo size={36} />
              <span className="font-bold tracking-tight">NepalCareer</span>
            </Link>

            <h1 className="text-2xl font-bold tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Free forever. No credit card required.
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="mb-1.5">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Chandan Singh"
                    className="pl-9"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

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
                    placeholder="At least 6 characters"
                    className="pl-9 pr-9"
                    autoComplete="new-password"
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

              <div>
                <Label htmlFor="whatsapp" className="mb-1.5">
                  WhatsApp number <span className="text-muted-foreground font-normal">(optional, for job alerts)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+97798XXXXXXXX"
                    className="pl-9"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  We&apos;ll send you a WhatsApp message when monitored companies post new jobs.
                </p>
              </div>

              <Button type="submit" disabled={pending} className="w-full gap-1.5">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {pending ? "Creating account…" : "Create account"}
                {!pending && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right: Hero — AI agent pitch */}
        <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary/10 via-chart-2/5 to-chart-4/10 items-center justify-center p-12">
          <div className="aurora -z-10 right-[-20%] top-[-10%] h-[400px] w-[400px] bg-primary/30" />
          <div className="aurora -z-10 left-[-10%] bottom-[-20%] h-[400px] w-[400px] bg-chart-4/20" />
          <div className="absolute inset-0 bg-grid opacity-50" />

          <div className="relative max-w-lg text-center">
            {/* Headline with AI agent pitch */}
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

            {/* How it works — 3 steps */}
            <div className="grid gap-3 text-left">
              <div className="flex items-start gap-3 p-3 rounded-xl glass-card">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">1. Upload your resume (PDF)</div>
                  <div className="text-xs text-muted-foreground">
                    AI parses it, scores ATS-friendliness, extracts skills & tech stack.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl glass-card">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-chart-2/15 text-chart-2 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">2. AI agents match you instantly</div>
                  <div className="text-xs text-muted-foreground">
                    Every job gets a match score (0-100) with skill-gap analysis.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl glass-card">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">3. Get WhatsApp alerts</div>
                  <div className="text-xs text-muted-foreground">
                    When a monitored company posts a new job that fits, you get an alert.
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Free forever · No credit card · Cancel anytime
            </p>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
