"use client"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CompanyLogo } from "@/components/company-logo"
import { GitCompare, Plus, X, Loader2, Sparkles, Trophy, MapPin, DollarSign, Star, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatSalary, timeAgo } from "@/lib/format"
import { toast } from "sonner"

interface CompareJob {
  id: string; slug: string; title: string
  description: string
  requirements: string[]
  responsibilities: string[]
  skills: string[]
  technologies: string[]
  category?: string | null
  location: string
  remoteStatus: string
  employmentType: string
  seniority?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  visaSponsor: boolean
  viewCount: number
  applicationCount: number
  postedAt: string
  match: { score: number; matchedSkills: string[]; missingSkills: string[]; matchedTech: string[]; missingTech: string[] } | null
  company: { id: string; name: string; slug: string; logoUrl?: string | null; industry?: string | null; size?: string | null; rating: number; verified: boolean; headquarters?: string | null }
}

interface SearchResult {
  id: string; title: string; slug: string
  company: { name: string; logoUrl?: string | null }
  location: string
}

export function CompareView({ initialIds }: { initialIds: string[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds.slice(0, 4))
  const [data, setData] = useState<{ jobs: CompareJob[]; summary: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  useEffect(() => {
    if (selectedIds.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null)
      return
    }
    setLoading(true)
    fetch("/api/compare-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobIds: selectedIds }),
    })
      .then((r) => r.json())
      .then((d) => setData({ jobs: d.jobs || [], summary: d.summary || "" }))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [selectedIds])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!searchQ.trim()) { setSearchResults([]); return }
    const t = setTimeout(() => {
      fetch(`/api/jobs?q=${encodeURIComponent(searchQ)}&pageSize=10`)
        .then((r) => r.json())
        .then((d) => setSearchResults((d.jobs || []).map((j: any) => ({
          id: j.id, title: j.title, slug: j.slug,
          company: { name: j.company.name, logoUrl: j.company.logoUrl },
          location: j.location,
        }))))
        .catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(t)
  }, [searchQ])

  const addJob = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= 4) return
    setSelectedIds((prev) => [...prev, id])
    setSearchOpen(false)
    setSearchQ("")
  }
  const removeJob = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  // Find best job for highlighting
  const bestJob = data?.jobs?.reduce((best, j) => (!best || (j.match?.score ?? 0) > (best.match?.score ?? 0)) ? j : best, null as CompareJob | null)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-chart-4/15 text-chart-4">
          <GitCompare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Compare jobs</h1>
          <p className="text-sm text-muted-foreground">Pick 2-4 jobs to compare side-by-side with AI recommendations.</p>
        </div>
      </div>

      {/* Selected chips */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {selectedIds.length === 0 && <span className="text-sm text-muted-foreground">No jobs selected yet.</span>}
        {selectedIds.map((id) => {
          const job = data?.jobs?.find((j) => j.id === id)
          return (
            <Badge key={id} variant="secondary" className="gap-1.5 py-1.5 pl-2 pr-1">
              {job ? `${job.title} · ${job.company.name}` : id.slice(-6)}
              <button onClick={() => removeJob(id)} className="ml-1 grid h-4 w-4 place-items-center rounded-full hover:bg-destructive/20 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )
        })}
        {selectedIds.length < 4 && (
          <Button variant="outline" size="sm" onClick={() => setSearchOpen((v) => !v)} className="gap-1.5 h-7">
            <Plus className="h-3.5 w-3.5" /> Add job
          </Button>
        )}
      </div>

      {/* Search panel */}
      {searchOpen && (
        <Card className="p-4 mb-6 animate-in-up">
          <input
            autoFocus
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search jobs to add…"
            className="w-full bg-transparent text-sm outline-none mb-2"
          />
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addJob(r.id)}
                  disabled={selectedIds.includes(r.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 disabled:opacity-50 text-left"
                >
                  <CompanyLogo name={r.company.name} logoUrl={r.company.logoUrl} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.company.name} · {r.location}</div>
                  </div>
                  {selectedIds.includes(r.id) && <span className="text-xs text-muted-foreground">Added</span>}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {selectedIds.length < 2 ? (
        <Card className="p-12 text-center">
          <GitCompare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Add at least 2 jobs to compare</h3>
          <p className="text-sm text-muted-foreground">Use the “Add job” button above to pick from any open position.</p>
        </Card>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Comparing with AI…</p>
        </div>
      ) : data ? (
        <>
          {/* AI summary */}
          <Card className="p-5 mb-6 bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/30">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">AI recommendation</h3>
                  {bestJob && (
                    <Badge variant="default" className="text-[10px] gap-0.5">
                      <Trophy className="h-2.5 w-2.5" /> Best fit: {bestJob.title}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
              </div>
            </div>
          </Card>

          {/* Side-by-side table */}
          <div className="overflow-x-auto">
            <div className="grid gap-4 min-w-[800px]" style={{ gridTemplateColumns: `200px repeat(${data.jobs.length}, 1fr)` }}>
              {/* Header row */}
              <div></div>
              {data.jobs.map((j) => (
                <Card key={j.id} className={cn("p-4", bestJob?.id === j.id && "ring-2 ring-primary")}>
                  <div className="flex items-start gap-2 mb-2">
                    <Link href={`/companies/${j.company.slug}`}>
                      <CompanyLogo name={j.company.name} logoUrl={j.company.logoUrl} size={36} />
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/jobs/${j.id}`} className="text-sm font-semibold hover:underline line-clamp-2">{j.title}</Link>
                      <div className="text-xs text-muted-foreground truncate">{j.company.name}</div>
                    </div>
                    {bestJob?.id === j.id && <Trophy className="h-4 w-4 text-primary ml-auto shrink-0" />}
                  </div>
                  {j.match && (
                    <div className={cn(
                      "text-center rounded-md py-1 text-xs font-semibold",
                      j.match.score >= 80 ? "bg-success/15 text-success"
                      : j.match.score >= 60 ? "bg-chart-3/15 text-chart-3"
                      : "bg-muted text-muted-foreground"
                    )}>
                      {j.match.score}% match
                    </div>
                  )}
                </Card>
              ))}

              {/* Rows */}
              <Row label="Location" icon={MapPin} />
              {data.jobs.map((j) => <Cell key={j.id}>{j.location}</Cell>)}

              <Row label="Work mode" icon={MapPin} />
              {data.jobs.map((j) => <Cell key={j.id}><span className="capitalize">{j.remoteStatus}</span></Cell>)}

              <Row label="Seniority" icon={Star} />
              {data.jobs.map((j) => <Cell key={j.id}><span className="capitalize">{j.seniority || "—"}</span></Cell>)}

              <Row label="Salary" icon={DollarSign} />
              {data.jobs.map((j) => <Cell key={j.id}>{formatSalary(j.salaryMin, j.salaryMax)}</Cell>)}

              <Row label="Visa sponsor" />
              {data.jobs.map((j) => <Cell key={j.id}>{j.visaSponsor ? "✓ Yes" : "—"}</Cell>)}

              <Row label="Company rating" icon={Star} />
              {data.jobs.map((j) => <Cell key={j.id}>★ {j.company.rating.toFixed(1)}</Cell>)}

              <Row label="Company size" />
              {data.jobs.map((j) => <Cell key={j.id}>{j.company.size || "—"}</Cell>)}

              <Row label="Applicants" icon={Target} />
              {data.jobs.map((j) => <Cell key={j.id}>{j.applicationCount}</Cell>)}

              <Row label="Views" />
              {data.jobs.map((j) => <Cell key={j.id}>{j.viewCount.toLocaleString()}</Cell>)}

              <Row label="Posted" />
              {data.jobs.map((j) => <Cell key={j.id}>{timeAgo(j.postedAt)}</Cell>)}

              <Row label="Matched skills" icon={Target} />
              {data.jobs.map((j) => (
                <Cell key={j.id}>
                  {j.match ? (
                    <div className="flex flex-wrap gap-1">
                      {j.match.matchedSkills.length === 0 ? <span className="text-xs text-muted-foreground">None</span>
                        : j.match.matchedSkills.map((s) => <Badge key={s} variant="secondary" className="text-[10px] bg-success/10 text-success">{s}</Badge>)}
                    </div>
                  ) : "—"}
                </Cell>
              ))}

              <Row label="Missing skills" />
              {data.jobs.map((j) => (
                <Cell key={j.id}>
                  {j.match ? (
                    <div className="flex flex-wrap gap-1">
                      {j.match.missingSkills.length === 0 ? <span className="text-xs text-success">None — full match!</span>
                        : j.match.missingSkills.slice(0, 5).map((s) => <Badge key={s} variant="outline" className="text-[10px] text-muted-foreground">{s}</Badge>)}
                    </div>
                  ) : "—"}
                </Cell>
              ))}

              <Row label="Top skills" />
              {data.jobs.map((j) => (
                <Cell key={j.id}>
                  <div className="flex flex-wrap gap-1">
                    {j.skills.slice(0, 4).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                  </div>
                </Cell>
              ))}

              <div></div>
              {data.jobs.map((j) => (
                <Cell key={j.id}>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/jobs/${j.id}`}>View job</Link>
                  </Button>
                </Cell>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function Row({ label, icon: Icon }: { label: string; icon?: any }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground py-2">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="text-sm py-2 border-t border-border/40">{children}</div>
}
