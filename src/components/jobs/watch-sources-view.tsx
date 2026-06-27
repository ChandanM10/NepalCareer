"use client"
import { useEffect, useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Eye, Plus, Trash2, RefreshCw, ExternalLink, Loader2, Globe, Building2,
  CheckCircle2, AlertCircle, Clock, Bell,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/format"

interface WatchSource {
  id: string
  companyName: string
  url: string
  country: string
  industry?: string | null
  lastCheckedAt?: string | null
  lastJobCount: number
  newJobsCount: number
  status: string
  lastError?: string | null
  discoveredJobs: Array<{ title: string; url?: string; postedAt: string; isNew?: boolean; category?: string; seniority?: string }>
  createdAt: string
}

const NEPAL_INDUSTRIES = [
  "AI / EdTech", "Fintech", "Healthcare IT", "Data / AI Training", "Data Analytics",
  "Product Studio", "Software Development", "IT Services", "Mobile / Fintech", "AgriTech",
  "E-commerce", "Telecom",
]

const COUNTRIES = ["Nepal", "India", "Bangladesh", "Sri Lanka", "Pakistan", "United States", "United Kingdom", "Singapore", "Other"]

export function WatchSourcesView() {
  const [sources, setSources] = useState<WatchSource[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [checking, setChecking] = useState<string | null>(null)
  const [form, setForm] = useState({ companyName: "", url: "", country: "Nepal", industry: "Software Development" })

  const load = () => {
    fetch("/api/watch-sources").then((r) => r.json()).then((d) => setSources(d.sources || [])).catch(() => setSources([]))
  }
  useEffect(load, [])

  const onAdd = () => {
    if (!form.companyName || !form.url) {
      toast.error("Company name and URL required")
      return
    }
    try { new URL(form.url) } catch { toast.error("Invalid URL"); return }

    fetch("/api/watch-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        toast.success(`Now watching ${form.companyName}`)
        setForm({ companyName: "", url: "", country: "Nepal", industry: "Software Development" })
        setShowForm(false)
        load()
      })
      .catch((e) => toast.error(e.message || "Failed to add"))
  }

  const onCheck = (id: string, name: string) => {
    setChecking(id)
    fetch(`/api/watch-sources/${id}/check`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        if (d.newJobs?.length > 0) {
          toast.success(`${name}: ${d.newJobs.length} new job${d.newJobs.length > 1 ? "s" : ""}! Notification sent.`)
        } else {
          toast.info(`${name}: No new jobs since last check.`)
        }
        load()
      })
      .catch((e) => toast.error(e.message || "Check failed"))
      .finally(() => setChecking(null))
  }

  const onDelete = (id: string, name: string) => {
    setSources((prev) => prev?.filter((s) => s.id !== id) || null)
    fetch(`/api/watch-sources/${id}`, { method: "DELETE" })
    toast.success(`Stopped watching ${name}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-chart-4/15 text-chart-4">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Watched companies</h1>
            <p className="text-sm text-muted-foreground">
              Add any company career page (e.g. <code className="text-xs px-1 py-0.5 bg-muted rounded">fusemachines.com/careers</code>) and we'll alert you when new jobs post.
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add URL
        </Button>
      </div>

      {/* How it works banner */}
      <Card className="p-4 mb-6 bg-gradient-to-br from-chart-4/5 to-chart-2/5 border-chart-4/30">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-chart-4/10 text-chart-4 shrink-0">
            <Bell className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <div className="font-semibold mb-0.5">How monitoring works</div>
            <p className="text-muted-foreground leading-relaxed">
              When you add a URL, NepalCareer periodically "crawls" that careers page. When a new job appears,
              you get an alert via your configured channels (WhatsApp + Email + In-app).
              Click <strong>Check now</strong> to simulate a crawl instantly — the system will randomly discover new jobs and dispatch a notification.
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> Real crawl = scheduled job in production</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> Real WhatsApp = WhatsApp Business API</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> Real email = SendGrid/SES</span>
            </div>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card className="p-5 mb-6 animate-in-up">
          <h3 className="font-semibold mb-3">Add a company career page to monitor</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Company name *</label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="e.g. Fusemachines" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Careers page URL *</label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://fusemachines.com/careers" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Country</label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Industry</label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NEPAL_INDUSTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={onAdd} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add to watch list</Button>
          </div>
        </Card>
      )}

      {!sources ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : sources.length === 0 ? (
        <Card className="p-12 text-center">
          <Eye className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Not watching any companies yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add a careers page URL to start monitoring.</p>
          <Button onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Add your first URL</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sources.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{s.companyName}</h3>
                        <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{s.status}</Badge>
                        {s.newJobsCount > 0 && <Badge variant="destructive" className="text-[10px] gap-0.5"><Bell className="h-2.5 w-2.5" /> {s.newJobsCount} new</Badge>}
                      </div>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5">
                        <Globe className="h-3 w-3" /> {s.url} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCheck(s.id, s.companyName)}
                        disabled={checking === s.id}
                        className="gap-1.5 h-8"
                      >
                        {checking === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Check now
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(s.id, s.companyName)} className="h-8 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{s.country}</span>
                    {s.industry && <span>· {s.industry}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last checked: {s.lastCheckedAt ? timeAgo(s.lastCheckedAt) : "never"}
                    </span>
                    <span>· {s.lastJobCount} jobs tracked</span>
                  </div>
                  {s.discoveredJobs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Recent discovered jobs</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                        {s.discoveredJobs.slice(0, 5).map((j, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-sm py-0.5">
                            <span className="flex items-center gap-2 min-w-0">
                              {j.isNew && <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />}
                              <span className="truncate">{j.title}</span>
                              {j.category && <Badge variant="outline" className="text-[9px] py-0">{j.category}</Badge>}
                            </span>
                            <a
                              href={j.url || s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground shrink-0 inline-flex items-center gap-0.5"
                            >
                              {timeAgo(j.postedAt)} <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {s.lastError && (
                    <div className="mt-2 text-xs text-destructive inline-flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {s.lastError}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Notification preferences</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Choose where alerts are delivered. Configure WhatsApp number and email in Settings.
        </p>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/settings">Open settings</Link>
        </Button>
      </Card>
    </div>
  )
}
