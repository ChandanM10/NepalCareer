"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Legend, AreaChart, Area, RadialBarChart, RadialBar,
} from "recharts"
import {
  Briefcase, Building2, Users, Send, Heart, Plus, ArrowRight, Eye, TrendingUp,
  BarChart3, Activity, Zap, Clock, Star, ChevronRight, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/format"

interface AdminStats {
  totals: { jobs: number; openJobs: number; companies: number; users: number; applications: number; savedJobs: number }
  topJobs: { id: string; title: string; company: string; applications: number; views: number }[]
  topViewed: { id: string; title: string; company: string; views: number }[]
  appsByStatus: { status: string; count: number }[]
  jobsByCategory: { category: string; count: number }[]
  appsByDay: { day: string; count: number }[]
}

const PIE_COLORS = ["var(--muted-foreground)", "var(--chart-2)", "var(--chart-4)", "var(--chart-3)", "var(--success)", "var(--destructive)"]

const STATUS_LABELS: Record<string, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {})
  }, [])

  const conversionRate = stats && stats.totals.applications > 0
    ? (((stats.appsByStatus.find(a => a.status === "interview")?.count ?? 0) + (stats.appsByStatus.find(a => a.status === "offer")?.count ?? 0)) / stats.totals.applications * 100).toFixed(1)
    : "0"

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-chart-5 via-primary to-chart-2 text-primary-foreground shadow-lg">
            <BarChart3 className="h-6 w-6" />
            <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-success text-success-foreground text-[9px] font-bold">
              <Sparkles className="h-2.5 w-2.5" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recruiter Command Center</h1>
            <p className="text-sm text-muted-foreground">
              Real-time overview of jobs, applications, and hiring funnel performance.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/jobs"><Eye className="h-4 w-4" /> View Site</Link>
          </Button>
          <Button asChild className="gap-1.5 shadow-md">
            <Link href="/admin/jobs/new"><Plus className="h-4 w-4" /> Post a Job</Link>
          </Button>
        </div>
      </div>

      {/* Stat cards — premium glassmorphism with gradient icons */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <PremiumStatCard
          icon={Briefcase}
          label="Total Jobs"
          value={stats?.totals.jobs}
          gradient="from-chart-1 to-chart-2"
          sublabel={`${stats?.totals.openJobs || 0} open`}
        />
        <PremiumStatCard
          icon={Building2}
          label="Companies"
          value={stats?.totals.companies}
          gradient="from-chart-2 to-chart-4"
        />
        <PremiumStatCard
          icon={Users}
          label="Users"
          value={stats?.totals.users}
          gradient="from-chart-4 to-chart-5"
        />
        <PremiumStatCard
          icon={Send}
          label="Applications"
          value={stats?.totals.applications}
          gradient="from-primary to-chart-2"
          sublabel={`${conversionRate}% → interview`}
        />
        <PremiumStatCard
          icon={Heart}
          label="Saved Jobs"
          value={stats?.totals.savedJobs}
          gradient="from-chart-5 to-chart-3"
        />
        <PremiumStatCard
          icon={Zap}
          label="Active Today"
          value={stats?.appsByDay?.[stats.appsByDay.length - 1]?.count || 0}
          gradient="from-chart-3 to-success"
          sublabel="new applications"
        />
      </div>

      {!stats ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="glass-card">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Applications
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            {/* Top row: trends + funnel */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Applications trend — 2 cols */}
              <Card className="lg:col-span-2 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Applications Trend
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Last 14 days · {stats.appsByDay.reduce((s, d) => s + d.count, 0)} total</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
                  </Badge>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.appsByDay} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="appsGradAdmin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                      <Tooltip
                        cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, backdropFilter: "blur(8px)" }}
                      />
                      <Area type="monotone" dataKey="count" stroke="var(--primary)" fill="url(#appsGradAdmin)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Funnel pie — 1 col */}
              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-chart-2" />
                  Pipeline Funnel
                </h3>
                <p className="text-xs text-muted-foreground mb-3">By application status</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.appsByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={45}
                        paddingAngle={2}
                      >
                        {stats.appsByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, backdropFilter: "blur(8px)" }}
                        formatter={(value: any, name: any) => [value, STATUS_LABELS[name as string] || name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-3">
                  {stats.appsByStatus.slice(0, 6).map((s, i) => (
                    <div key={s.status} className="flex items-center gap-1.5 text-[10px]">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{STATUS_LABELS[s.status] || s.status}</span>
                      <span className="font-semibold ml-auto">{s.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Second row: category bar + top jobs */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-chart-3" />
                  Jobs by Category
                </h3>
                <p className="text-xs text-muted-foreground mb-3">Distribution across functions</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.jobsByCategory} layout="vertical" margin={{ left: 8, right: 8, top: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="catGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" hide />
                      <YAxis dataKey="category" type="category" width={80} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "var(--muted)" }}
                        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, backdropFilter: "blur(8px)" }}
                      />
                      <Bar dataKey="count" fill="url(#catGrad)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-chart-4" />
                    Hottest Jobs
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">By applications</Badge>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {stats.topJobs.map((j, i) => (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                      <span className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg text-xs font-bold shrink-0",
                        i === 0 ? "bg-warning/20 text-warning" : i === 1 ? "bg-muted-foreground/20 text-muted-foreground" : i === 2 ? "bg-chart-5/20 text-chart-5" : "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">{j.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{j.company}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold tabular-nums">{j.applications}</div>
                        <div className="text-[10px] text-muted-foreground">{j.views.toLocaleString()} views</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </Card>
            </div>

            {/* Third row: top viewed + quick actions */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-chart-5" />
                    Most Viewed Jobs
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">By views</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {stats.topViewed.map((j, i) => (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-accent/30 transition-all group"
                    >
                      <Eye className="h-4 w-4 text-chart-5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">{j.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{j.company}</div>
                      </div>
                      <div className="text-sm font-bold tabular-nums shrink-0">{j.views.toLocaleString()}</div>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card className="p-5 bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/30">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button asChild className="w-full justify-start gap-2 h-10">
                    <Link href="/admin/jobs/new"><Plus className="h-4 w-4" /> Post a new job</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start gap-2 h-10">
                    <Link href="/jobs"><Briefcase className="h-4 w-4" /> Browse all jobs</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start gap-2 h-10">
                    <Link href="/watch-sources"><Eye className="h-4 w-4" /> Watch sources</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start gap-2 h-10">
                    <Link href="/companies"><Building2 className="h-4 w-4" /> Companies</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* JOBS TAB */}
          <TabsContent value="jobs">
            <AdminJobsList />
          </TabsContent>

          {/* APPLICATIONS TAB */}
          <TabsContent value="applications">
            <AdminApplicationsList />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function PremiumStatCard({
  icon: Icon, label, value, gradient, sublabel,
}: {
  icon: any; label: string; value?: number; gradient: string; sublabel?: string
}) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm", gradient)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-2xl font-bold tabular-nums tracking-tight">{value ?? "—"}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">{label}</div>
      {sublabel && <div className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</div>}
    </Card>
  )
}

function AdminJobsList() {
  const [jobs, setJobs] = useState<any[] | null>(null)
  const [filter, setFilter] = useState("")
  useEffect(() => {
    fetch(`/api/admin/jobs${filter ? `?status=${filter}` : ""}`).then((r) => r.json()).then((d) => setJobs(d.jobs || [])).catch(() => setJobs([]))
  }, [filter])

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold">All Jobs</h3>
          <p className="text-xs text-muted-foreground">{jobs?.length ?? "—"} total</p>
        </div>
        <div className="flex gap-1">
          {["", "open", "closed", "draft"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
              )}
            >
              {s || "all"}
            </button>
          ))}
        </div>
      </div>
      {!jobs ? <Skeleton className="h-40 rounded-lg" /> : jobs.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No jobs found.</div>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-accent/30 transition-all">
              <div className="flex-1 min-w-0">
                <Link href={`/jobs/${j.id}`} className="text-sm font-medium hover:underline">{j.title}</Link>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {j.company.name} · {j.location} · <span className="capitalize">{j.remoteStatus}</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                <div className="text-center">
                  <div className="font-bold text-foreground">{j.applicationCount}</div>
                  <div className="text-[9px]">apps</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-foreground">{j.viewCount.toLocaleString()}</div>
                  <div className="text-[9px]">views</div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] capitalize shrink-0",
                  j.status === "open" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"
                )}
              >
                {j.status}
              </Badge>
              <Button asChild size="sm" variant="ghost" className="h-7 shrink-0">
                <Link href={`/jobs/${j.id}`}>View <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function AdminApplicationsList() {
  const [apps, setApps] = useState<any[] | null>(null)
  useEffect(() => {
    fetch("/api/admin/applications").then((r) => r.json()).then((d) => setApps(d.applications || [])).catch(() => setApps([]))
  }, [])

  const statusColors: Record<string, string> = {
    wishlist: "bg-muted text-muted-foreground",
    applied: "bg-chart-2/15 text-chart-2",
    screening: "bg-chart-4/15 text-chart-4",
    interview: "bg-chart-3/15 text-chart-3",
    offer: "bg-success/15 text-success",
    rejected: "bg-destructive/15 text-destructive",
    accepted: "bg-success/15 text-success",
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">All Applications</h3>
          <p className="text-xs text-muted-foreground">{apps?.length ?? "—"} total across all users</p>
        </div>
      </div>
      {!apps ? <Skeleton className="h-40 rounded-lg" /> : apps.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No applications yet.</div>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
          {apps.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-accent/30 transition-all">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                {a.user.fullName.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{a.user.fullName}</div>
                <div className="text-xs text-muted-foreground truncate">{a.user.email}</div>
              </div>
              <div className="hidden md:block flex-1 min-w-0">
                <div className="text-sm truncate">{a.job.title}</div>
                <div className="text-xs text-muted-foreground truncate">{a.job.company.name}</div>
              </div>
              <div className="hidden sm:block text-xs text-muted-foreground">
                {a.appliedAt ? `Applied ${timeAgo(a.appliedAt)}` : "Not applied"}
              </div>
              <Badge variant="outline" className={cn("text-[10px] capitalize shrink-0", statusColors[a.status])}>
                {a.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
