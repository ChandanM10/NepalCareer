"use client"
import { useEffect, useState, useCallback, useMemo } from "react"
import { JobCard, type JobCardData } from "@/components/job-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, MapPin, Briefcase, Clock, DollarSign, Plane, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Facets {
  categories: { name: string; count: number }[]
  regions: { name: string; count: number }[]
  countries: { name: string; count: number }[]
}

const REMOTE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
]
const TYPE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
]
const SENIORITY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "staff", label: "Staff" },
]
const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "salary_high", label: "Salary: high → low" },
  { value: "salary_low", label: "Salary: low → high" },
  { value: "popular", label: "Most viewed" },
]

export function JobsBrowser({
  initialParams,
  facets,
}: {
  initialParams: Record<string, string>
  facets: Facets
}) {

  // Local state mirroring URL params
  const [q, setQ] = useState(initialParams.q || "")
  const [category, setCategory] = useState(initialParams.category || "")
  const [remoteStatus, setRemoteStatus] = useState(initialParams.remoteStatus || "")
  const [employmentType, setEmploymentType] = useState(initialParams.employmentType || "")
  const [seniority, setSeniority] = useState(initialParams.seniority || "")
  const [region, setRegion] = useState(initialParams.region || "")
  const [country, setCountry] = useState(initialParams.country || "")
  const [minSalary, setMinSalary] = useState(initialParams.minSalary || "")
  const [visaSponsor, setVisaSponsor] = useState(initialParams.visaSponsor === "true")
  const [featured, setFeatured] = useState(initialParams.featured === "true")
  const [sort, setSort] = useState(initialParams.sort || "recent")
  const [page, setPage] = useState(parseInt(initialParams.page || "1"))
  const [showFilters, setShowFilters] = useState(false)

  const [data, setData] = useState<{ jobs: JobCardData[]; total: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      runSearch()
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  const runSearch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (category) params.set("category", category)
      if (remoteStatus) params.set("remoteStatus", remoteStatus)
      if (employmentType) params.set("employmentType", employmentType)
      if (seniority) params.set("seniority", seniority)
      if (region) params.set("region", region)
      if (country) params.set("country", country)
      if (minSalary) params.set("minSalary", minSalary)
      if (visaSponsor) params.set("visaSponsor", "true")
      if (featured) params.set("featured", "true")
      params.set("sort", sort)
      params.set("page", String(page))
      params.set("pageSize", "12")
      // Update URL WITHOUT triggering server re-render (avoids state reset on pagination)
      const newUrl = `/jobs?${params.toString()}`
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", newUrl)
      }
      const res = await fetch(`/api/jobs?${params.toString()}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData({ jobs: json.jobs, total: json.total, totalPages: json.totalPages })
    } catch {
      setData({ jobs: [], total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [q, category, remoteStatus, employmentType, seniority, region, country, minSalary, visaSponsor, featured, sort, page])

  useEffect(() => { runSearch() }, [runSearch])

  const activeFilters = useMemo(() => {
    const arr: { key: string; label: string; clear: () => void }[] = []
    if (category) arr.push({ key: "category", label: category, clear: () => setCategory("") })
    if (remoteStatus) arr.push({ key: "remote", label: REMOTE_OPTIONS.find(o => o.value === remoteStatus)?.label || remoteStatus, clear: () => setRemoteStatus("") })
    if (employmentType) arr.push({ key: "type", label: TYPE_OPTIONS.find(o => o.value === employmentType)?.label || employmentType, clear: () => setEmploymentType("") })
    if (seniority) arr.push({ key: "seniority", label: SENIORITY_OPTIONS.find(o => o.value === seniority)?.label || seniority, clear: () => setSeniority("") })
    if (region) arr.push({ key: "region", label: region, clear: () => setRegion("") })
    if (country) arr.push({ key: "country", label: country, clear: () => setCountry("") })
    if (minSalary) arr.push({ key: "minSalary", label: `$${(parseInt(minSalary) / 1000).toFixed(0)}k+`, clear: () => setMinSalary("") })
    if (visaSponsor) arr.push({ key: "visa", label: "Visa sponsor", clear: () => setVisaSponsor(false) })
    if (featured) arr.push({ key: "featured", label: "Featured", clear: () => setFeatured(false) })
    return arr
  }, [category, remoteStatus, employmentType, seniority, region, country, minSalary, visaSponsor, featured])

  const clearAll = () => {
    setCategory(""); setRemoteStatus(""); setEmploymentType(""); setSeniority("")
    setRegion(""); setCountry(""); setMinSalary(""); setVisaSponsor(false); setFeatured(false)
    setQ(""); setSort("recent"); setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Browse jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.total} open positions` : "Loading positions…"}
        </p>
      </div>

      {/* Country / region quick-links */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-xs text-muted-foreground mr-1">Quick filter:</span>
        {[
          { label: "🇳🇵 Nepal", value: "Nepal" },
          { label: "🇮🇳 India", value: "India" },
          { label: "🇺🇸 USA", value: "United States" },
          { label: "🇨🇦 Canada", value: "Canada" },
          { label: "🇬🇧 UK", value: "United Kingdom" },
          { label: "🇩🇪 Germany", value: "Germany" },
          { label: "🌐 Remote", value: "__remote__" },
        ].map((c) => {
          const isActive = c.value === "__remote__" ? remoteStatus === "remote" : country === c.value
          return (
            <button
              key={c.value}
              onClick={() => {
                if (c.value === "__remote__") {
                  setRemoteStatus(remoteStatus === "remote" ? "" : "remote")
                  setCountry("")
                } else {
                  setCountry(country === c.value ? "" : c.value)
                }
                setPage(1)
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-all",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background hover:bg-accent/50"
              )}
            >
              {c.label}
            </button>
          )
        })}
        {country && (
          <button
            onClick={() => { setCountry(""); setPage(1) }}
            className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, skill, location…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            className="gap-2"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px]">{activeFilters.length}</Badge>
            )}
          </Button>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={f.clear}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-xs hover:bg-accent transition-colors"
            >
              {f.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <aside className="lg:sticky lg:top-32 lg:self-start space-y-5 p-4 rounded-xl border border-border/60 bg-card/40">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</h3>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setCategory("")}
                  className={cn(
                    "w-full text-left text-sm px-2 py-1 rounded-md hover:bg-accent transition-colors",
                    !category && "bg-accent font-medium"
                  )}
                >
                  Any
                </button>
                {facets.categories.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setCategory(c.name === category ? "" : c.name)}
                    className={cn(
                      "w-full flex items-center justify-between text-sm px-2 py-1 rounded-md hover:bg-accent transition-colors",
                      c.name === category && "bg-accent font-medium"
                    )}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <FilterRow icon={Briefcase} label="Work mode">
              <Select value={remoteStatus} onValueChange={(v) => setRemoteStatus(v === "_" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {REMOTE_OPTIONS.map((o) => <SelectItem key={o.value || "_"} value={o.value || "_"}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterRow>

            <FilterRow icon={Clock} label="Type">
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v === "_" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => <SelectItem key={o.value || "_"} value={o.value || "_"}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterRow>

            <FilterRow icon={Sparkles} label="Seniority">
              <Select value={seniority} onValueChange={(v) => setSeniority(v === "_" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {SENIORITY_OPTIONS.map((o) => <SelectItem key={o.value || "_"} value={o.value || "_"}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterRow>

            <FilterRow icon={MapPin} label="Region">
              <Select value={region} onValueChange={(v) => setRegion(v === "_" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Any</SelectItem>
                  {facets.regions.map((r) => <SelectItem key={r.name} value={r.name}>{r.name} ({r.count})</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterRow>

            <FilterRow icon={DollarSign} label="Min salary">
              <Select value={minSalary} onValueChange={(v) => setMinSalary(v === "_" ? "" : v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Any</SelectItem>
                  <SelectItem value="60000">$60k+</SelectItem>
                  <SelectItem value="100000">$100k+</SelectItem>
                  <SelectItem value="150000">$150k+</SelectItem>
                  <SelectItem value="200000">$200k+</SelectItem>
                  <SelectItem value="250000">$250k+</SelectItem>
                </SelectContent>
              </Select>
            </FilterRow>

            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={visaSponsor}
                  onChange={(e) => setVisaSponsor(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Plane className="h-3.5 w-3.5" />
                Visa sponsorship
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Sparkles className="h-3.5 w-3.5" />
                Featured only
              </label>
            </div>

            <Button variant="ghost" size="sm" className="w-full" onClick={clearAll}>
              Reset all
            </Button>
          </aside>
        )}

        {/* Results */}
        <div className={cn("min-w-0", !showFilters && "lg:col-span-2")}>
          {loading && !data ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : data && data.jobs.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.jobs.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-muted mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No jobs match your filters</h3>
              <p className="text-sm text-muted-foreground mb-4">Try removing some filters or searching for something broader.</p>
              <Button variant="outline" size="sm" onClick={clearAll}>Clear all filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h3>
      </div>
      {children}
    </div>
  )
}
