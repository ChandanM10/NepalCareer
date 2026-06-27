"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CompanyLogo } from "@/components/company-logo"
import { Search, Building2, MapPin, Briefcase, Star, BadgeCheck, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Company {
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

export function CompaniesBrowser({
  industries,
  sizes,
}: {
  industries: { name: string; count: number }[]
  sizes: { name: string; count: number }[]
}) {
  const [q, setQ] = useState("")
  const [industry, setIndustry] = useState("")
  const [size, setSize] = useState("")
  const [data, setData] = useState<{ companies: Company[]; total: number } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (industry) params.set("industry", industry)
      if (size) params.set("size", size)
      fetch(`/api/companies?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => setData({ companies: d.companies || [], total: d.total || 0 }))
        .catch(() => setData({ companies: [], total: 0 }))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [q, industry, size])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover {data?.total ?? "—"} companies hiring now.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, industry, location…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All industries</option>
          {industries.map((i) => <option key={i.name} value={i.name}>{i.name} ({i.count})</option>)}
        </select>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">Any size</option>
          {sizes.map((s) => <option key={s.name} value={s.name}>{s.name} ({s.count})</option>)}
        </select>
      </div>

      {loading && !data ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : data && data.companies.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.companies.map((c) => <CompanyCard key={c.id} company={c} />)}
        </div>
      ) : (
        <div className="text-center py-16">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No companies found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search.</p>
        </div>
      )}
    </div>
  )
}

function CompanyCard({ company }: { company: Company }) {
  return (
    <Link href={`/companies/${company.slug}`}>
      <Card className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold truncate">{company.name}</h3>
              {company.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            <div className="text-xs text-muted-foreground truncate">{company.industry}</div>
          </div>
          {company.rating > 0 && (
            <div className="flex items-center gap-0.5 text-xs">
              <Star className="h-3 w-3 fill-current text-warning" />
              <span className="font-medium">{company.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{company.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{company.headquarters || "Remote"}</span>
          <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{company.size || "—"}</span>
          <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{company.jobCount} open</span>
        </div>
        {company.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-3 border-t border-border/40">
            {company.techStack.slice(0, 4).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] font-mono py-0">{t}</Badge>
            ))}
            {company.techStack.length > 4 && (
              <Badge variant="outline" className="text-[10px] py-0">+{company.techStack.length - 4}</Badge>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center justify-end text-xs text-primary group-hover:gap-1.5 gap-1 transition-all">
          View profile <ArrowRight className="h-3 w-3" />
        </div>
      </Card>
    </Link>
  )
}
