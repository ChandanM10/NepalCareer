"use client"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CompanyLogo } from "@/components/company-logo"
import { MatchBadge } from "@/components/job-card"
import {
  Heart, FileText, Bell, Sparkles, TrendingUp, ArrowRight, Briefcase, Send,
  ClipboardList, ChevronRight, Activity, FileCheck, Brain, Zap,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area,
} from "recharts"
import { timeAgo } from "@/lib/format"

export interface DashboardData {
  user: { id: string; fullName: string; headline?: string | null }
  stats: { saved: number; applications: number; resumes: number; alerts: number; avgMatchScore: number }
  pipeline: Record<string, number>
  salaryBuckets: { label: string; count: number }[]
  recommendations: any[]
  applications: any[]
  activities: any[]
  resume: { id: string; fileName: string; atsScore: number | null; skills: string[]; technologies: string[]; targetRole?: string | null } | null
}

const PIPELINE_STAGES = [
  { key: "wishlist", label: "Wishlist", color: "var(--muted-foreground)" },
  { key: "applied", label: "Applied", color: "var(--chart-2)" },
  { key: "screening", label: "Screening", color: "var(--chart-4)" },
  { key: "interview", label: "Interview", color: "var(--chart-3)" },
  { key: "offer", label: "Offer", color: "var(--success)" },
  { key: "rejected", label: "Rejected", color: "var(--destructive)" },
]

const ACTIVITY_ICON: Record<string, any> = {
  saved_job: Heart,
  applied: Send,
  status_change: Activity,
  uploaded_resume: FileCheck,
  created_alert: Bell,
  ai_query: Brain,
}

export function DashboardView({ data }: { data: DashboardData }) {

  const { user, stats, pipeline = {}, salaryBuckets, recommendations, applications, activities, resume } = data

  const pipelineData = PIPELINE_STAGES.map((p) => ({ name: p.label, count: pipeline?.[p.key] || 0, color: p.color }))
    .filter((p) => p.count > 0 || p.name === "Wishlist" || p.name === "Applied")
  const hasPipeline = pipelineData.some((p) => p.count > 0)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user.fullName.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user.headline || "Here's your job search at a glance."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/advisor"><Sparkles className="h-3.5 w-3.5" /> Ask AI Advisor</Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/jobs"><Briefcase className="h-3.5 w-3.5" /> Browse jobs</Link>
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Saved jobs" value={stats.saved} href="/saved" color="text-chart-5" />
        <StatCard icon={Send} label="Applications" value={stats.applications} href="/applications" color="text-chart-2" />
        <StatCard icon={FileText} label="Resumes" value={stats.resumes} href="/resume" color="text-chart-3" />
        <StatCard icon={Sparkles} label="Avg match" value={stats.avgMatchScore ? `${stats.avgMatchScore}%` : "—"} color="text-primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Recommendations */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold">AI-matched for you</h2>
                <p className="text-xs text-muted-foreground">Based on your primary resume</p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/jobs">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
          {recommendations.length > 0 ? (
            <div className="space-y-2">
              {recommendations.map((r) => (
                <Link
                  key={r.id}
                  href={`/jobs/${r.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <CompanyLogo name={r.company.name} logoUrl={r.company.logoUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.company.name} · {r.location} · {r.remoteStatus}
                    </div>
                    {r.matchedSkills.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {r.matchedSkills.slice(0, 3).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <MatchBadge score={r.matchScore} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Upload a resume to unlock AI matches</p>
              <Button asChild size="sm"><Link href="/resume">Upload resume</Link></Button>
            </div>
          )}
        </Card>

        {/* Resume / ATS card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Your resume</h2>
          </div>
          {resume ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative h-16 w-16 shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" className="stroke-muted" strokeWidth="6" fill="none" />
                    <circle
                      cx="40" cy="40" r="34"
                      className="stroke-primary"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${((resume.atsScore ?? 0) / 100) * 213.6} 213.6`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">{resume.atsScore ?? "—"}</span>
                    <span className="text-[9px] text-muted-foreground">ATS</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{resume.fileName}</div>
                  <div className="text-xs text-muted-foreground">{resume.targetRole || "No target role set"}</div>
                  <Button asChild variant="ghost" size="sm" className="mt-1 h-7 text-xs gap-1 px-2">
                    <Link href="/resume">View analysis <ChevronRight className="h-3 w-3" /></Link>
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-1.5">Top skills</div>
              <div className="flex flex-wrap gap-1">
                {resume.skills.slice(0, 6).map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">No resume uploaded</p>
              <Button asChild size="sm"><Link href="/resume">Upload resume</Link></Button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-4 w-4 text-chart-2" />
            <h2 className="font-semibold">Application pipeline</h2>
          </div>
          {hasPipeline ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} layout="vertical" margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--popover", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {pipelineData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No applications yet</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/jobs">Find jobs to apply</Link>
              </Button>
            </div>
          )}
          {applications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Recent</div>
              <div className="space-y-1.5">
                {applications.slice(0, 3).map((a) => (
                  <Link
                    key={a.id}
                    href={`/jobs/${a.job.id}`}
                    className="flex items-center justify-between text-sm py-1 hover:bg-accent/50 rounded px-2 -mx-2"
                  >
                    <span className="truncate flex-1">{a.job.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize ml-2">{a.status}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Salary distribution */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-chart-3" />
            <h2 className="font-semibold">Salary distribution</h2>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salaryBuckets} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                <Tooltip cursor={{ stroke: "var(--border)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="var(--primary)" fill="url(#salaryGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity feed */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-chart-4" />
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : activities.map((a) => {
              const Icon = ACTIVITY_ICON[a.type] || Activity
              return (
                <div key={a.id} className="flex gap-2.5 text-sm">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-tight">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, href, color }: { icon: any; label: string; value: any; href?: string; color?: string }) {
  const content = (
    <Card className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
          <div className="text-3xl font-bold tracking-tight tabular-nums mt-1">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg bg-muted ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
