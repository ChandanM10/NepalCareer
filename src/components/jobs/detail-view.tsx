"use client"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, MapPin, Briefcase, Clock, DollarSign, Plane, BadgeCheck, Zap, Star,
  Heart, ExternalLink, Sparkles, Send, ChevronRight, CheckCircle2, XCircle, Loader2,
  GraduationCap, Users, Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyLogo } from "@/components/company-logo"
import { JobCard, type JobCardData } from "@/components/job-card"
import { formatSalary, timeAgo, parseJsonObject } from "@/lib/format"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MatchInfo {
  score: number | null
  matchedSkills: string[]
  missingSkills: string[]
  matchedTech: string[]
  missingTech: string[]
  explanation: string
}

interface JobDetail {
  id: string
  slug: string
  title: string
  description: string
  requirements: string[]
  responsibilities: string[]
  niceToHave: string[]
  skills: string[]
  technologies: string[]
  tags: string[]
  category?: string | null
  subcategory?: string | null
  location: string
  city?: string | null
  country?: string | null
  region?: string | null
  remoteStatus: string
  employmentType: string
  seniority?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string
  equity?: string | null
  experienceYrs?: number | null
  visaSponsor: boolean
  featured: boolean
  urgent: boolean
  viewCount: number
  applicationCount: number
  postedAt: string
  closingAt?: string | null
  sourceUrl?: string | null
  savedByUser: boolean
  applicationStatus: string | null
  company: {
    id: string
    name: string
    slug: string
    logoUrl?: string | null
    website?: string | null
    industry?: string | null
    size?: string | null
    founded?: number | null
    headquarters?: string | null
    description?: string | null
    mission?: string | null
    techStack: string[]
    benefits: string[]
    rating: number
    verified: boolean
    followerCount: number
    jobCount: number
  }
}

const REMOTE_LABEL: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" }

export function JobDetailView({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [similar, setSimilar] = useState<JobCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [generatingCL, startCL] = useTransition()
  const [applying, startApply] = useTransition()
  const [saving, startSave] = useTransition()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        setJob(j)
        setSaved(j.savedByUser)
        setApplied(j.applicationStatus)
      })
      .finally(() => !cancelled && setLoading(false))
    fetch(`/api/jobs/${jobId}/match`).then((r) => r.json()).then((m) => !cancelled && setMatch(m)).catch(() => {})
    fetch(`/api/jobs/${jobId}/similar`).then((r) => r.json()).then((d) => !cancelled && setSimilar(d.jobs || [])).catch(() => {})
    return () => { cancelled = true }
  }, [jobId])

  const onToggleSave = () => {
    const wasSaved = saved
    setSaved(!wasSaved)
    startSave(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/save`, { method: wasSaved ? "DELETE" : "POST" })
        if (!res.ok) throw new Error()
        toast.success(wasSaved ? "Removed from saved" : "Saved to your list")
      } catch {
        setSaved(wasSaved)
        toast.error("Failed to update")
      }
    })
  }

  const onGenerateCoverLetter = () => {
    startCL(async () => {
      try {
        const res = await fetch("/api/cover-letter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setCoverLetter(data.coverLetter)
        toast.success("Cover letter generated")
      } catch {
        toast.error("Failed to generate cover letter")
      }
    })
  }

  const onApply = () => {
    if (!coverLetter) {
      toast.error("Generate a cover letter first")
      return
    }
    startApply(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "applied", coverLetter }),
        })
        if (!res.ok) throw new Error()
        setApplied("applied")
        toast.success("Application submitted!")
      } catch {
        toast.error("Failed to apply")
      }
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Job not found</h1>
        <p className="text-muted-foreground mb-6">This job may have been removed or you followed a bad link.</p>
        <Button asChild><Link href="/jobs">Back to jobs</Link></Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Header card */}
      <Card className="p-6 mb-6 relative overflow-hidden">
        {job.urgent && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive via-warning to-destructive" />
        )}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
          <Link href={`/companies/${job.company.slug}`}>
            <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} size={72} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-2 justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{job.title}</h1>
                <Link
                  href={`/companies/${job.company.slug}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mt-1"
                >
                  <span className="font-medium">{job.company.name}</span>
                  {job.company.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                  {job.company.rating > 0 && (
                    <span className="text-sm flex items-center gap-0.5">
                      · <Star className="h-3 w-3 fill-current text-warning" /> {job.company.rating.toFixed(1)}
                    </span>
                  )}
                </Link>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant={saved ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  <Heart className={cn("h-4 w-4", saved && "fill-current")} />
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Info icon={MapPin}>{job.location}</Info>
              <Info icon={Briefcase}>{REMOTE_LABEL[job.remoteStatus] || job.remoteStatus}</Info>
              <Info icon={Clock} className="capitalize">{job.employmentType.replace("-", " ")}</Info>
              {job.seniority && <Info icon={Sparkles} className="capitalize">{job.seniority}</Info>}
              {(job.salaryMin || job.salaryMax) && (
                <Info icon={DollarSign} className="font-medium">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</Info>
              )}
              {job.equity && <Info icon={Star}>Equity: {job.equity}</Info>}
              {job.visaSponsor && <Info icon={Plane} className="text-primary">Visa sponsor</Info>}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Posted {timeAgo(job.postedAt)}</span>
              <span>·</span>
              <span>{job.viewCount.toLocaleString()} views</span>
              <span>·</span>
              <span>{job.applicationCount} applications</span>
              {job.closingAt && (
                <>
                  <span>·</span>
                  <span>Closes {new Date(job.closingAt).toLocaleDateString()}</span>
                </>
              )}
              {job.featured && <Badge variant="default" className="ml-2">Featured</Badge>}
              {job.urgent && <Badge variant="destructive" className="ml-1 gap-0.5"><Zap className="h-2.5 w-2.5" /> Urgent</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Main content */}
        <div className="min-w-0 space-y-6">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4 space-y-6">
              <Card className="p-6">
                <h2 className="font-semibold mb-3">About the role</h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{job.description}</p>
              </Card>

              {job.responsibilities.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-semibold mb-3">What you'll do</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-primary mt-0.5">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {(job.skills.length > 0 || job.technologies.length > 0) && (
                <Card className="p-6">
                  <h2 className="font-semibold mb-3">Skills & technologies</h2>
                  {job.skills.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Skills</div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.technologies.length > 0 && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Tech stack</div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.technologies.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs font-mono">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="mt-4 space-y-6">
              <Card className="p-6">
                <h2 className="font-semibold mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              {job.niceToHave.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-semibold mb-3">Nice to have</h2>
                  <ul className="space-y-2">
                    {job.niceToHave.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {job.experienceYrs && (
                <Card className="p-6">
                  <h2 className="font-semibold mb-3">Experience</h2>
                  <p className="text-sm">{job.experienceYrs}+ years relevant experience</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="company" className="mt-4 space-y-4">
              <Card className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Link href={`/companies/${job.company.slug}`}>
                    <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} size={56} />
                  </Link>
                  <div className="flex-1">
                    <Link href={`/companies/${job.company.slug}`} className="font-semibold hover:underline">
                      {job.company.name}
                    </Link>
                    <div className="text-sm text-muted-foreground">{job.company.industry}</div>
                  </div>
                  {job.company.website && (
                    <Button asChild variant="outline" size="sm">
                      <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="gap-1">
                        Website <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{job.company.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Size</div>
                    <div className="font-medium">{job.company.size || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Founded</div>
                    <div className="font-medium">{job.company.founded || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">HQ</div>
                    <div className="font-medium">{job.company.headquarters || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Open jobs</div>
                    <div className="font-medium">{job.company.jobCount}</div>
                  </div>
                </div>
              </Card>
              {job.company.benefits.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Benefits</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.company.benefits.map((b) => (
                      <Badge key={b} variant="secondary">{b}</Badge>
                    ))}
                  </div>
                </Card>
              )}
              {job.company.techStack.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Tech stack</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.company.techStack.map((t) => (
                      <Badge key={t} variant="outline" className="font-mono text-xs">{t}</Badge>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Similar jobs */}
          {similar.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Similar jobs</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {similar.map((j) => <JobCard key={j.id} job={j} compact />)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — apply + match */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Apply card */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Apply for this role</h3>
            {applied && applied !== "wishlist" ? (
              <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm">
                <div className="flex items-center gap-2 font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Application submitted
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Status: <span className="capitalize">{applied}</span>. Track progress in your{" "}
                  <Link href="/applications" className="underline">applications</Link>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button onClick={onApply} disabled={applying || !coverLetter} className="w-full gap-2">
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit application
                </Button>
                <Button variant="outline" onClick={onGenerateCoverLetter} disabled={generatingCL} className="w-full gap-2">
                  {generatingCL ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {coverLetter ? "Regenerate" : "Generate"} cover letter
                </Button>
                <Button asChild variant="ghost" className="w-full gap-2">
                  <Link href={`/companies/${job.company.slug}`}>
                    View company <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                {job.sourceUrl && (
                  <Button asChild variant="ghost" size="sm" className="w-full text-xs gap-1">
                    <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                      View original posting <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* AI Match card */}
          {match && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-semibold">AI match analysis</h3>
              </div>
              {match.score === null ? (
                <p className="text-sm text-muted-foreground">{match.explanation}</p>
              ) : (
                <>
                  <MatchScoreRing score={match.score} />
                  <p className="text-xs text-muted-foreground leading-relaxed mt-3">{match.explanation}</p>
                  {match.matchedSkills.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-success mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Matched ({match.matchedSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.matchedSkills.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px] bg-success/10 text-success border-success/20">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {match.missingSkills.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-destructive mb-1.5 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Missing ({match.missingSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.missingSkills.map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] text-muted-foreground">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Cover letter preview */}
          {coverLetter && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Generated cover letter</h3>
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(coverLetter).then(() => toast.success("Copied"))}>
                  Copy
                </Button>
              </div>
              <div className="text-xs text-muted-foreground whitespace-pre-line max-h-72 overflow-y-auto leading-relaxed">
                {coverLetter}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}

function Info({ icon: Icon, children, className }: { icon: any; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-muted-foreground", className)}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}

function MatchScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "stroke-success"
    : score >= 60 ? "stroke-chart-3"
    : "stroke-muted-foreground"
  const label =
    score >= 80 ? "Strong match"
    : score >= 60 ? "Good match"
    : "Developing match"
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" className="stroke-muted" strokeWidth="6" fill="none" />
          <circle
            cx="40" cy="40" r="34"
            className={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 213.6} 213.6`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">Based on your resume</div>
      </div>
    </div>
  )
}
