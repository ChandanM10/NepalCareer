"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CompanyLogo } from "@/components/company-logo"
import { ArrowLeft, MapPin, Building2, Briefcase, Star, BadgeCheck, ExternalLink, Calendar, Users, Heart, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatSalary, timeAgo } from "@/lib/format"

interface CompanyJob {
  id: string; slug: string; title: string
  category?: string | null; subcategory?: string | null
  location: string; remoteStatus: string; employmentType: string
  seniority?: string | null; salaryMin?: number | null; salaryMax?: number | null
  postedAt: string; urgent: boolean; featured: boolean
}

interface CompanyDetailData {
  id: string; name: string; slug: string
  logoUrl?: string | null; website?: string | null
  industry?: string | null; size?: string | null; founded?: number | null
  headquarters?: string | null; description?: string | null; mission?: string | null
  techStack: string[]; benefits: string[]
  rating: number; verified: boolean; followerCount: number; jobCount: number
  jobs: CompanyJob[]
}

const REMOTE_LABEL: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" }

export function CompanyDetail({ slug }: { slug: string }) {
  const router = useRouter()
  const [company, setCompany] = useState<CompanyDetailData | null>(null)

  useEffect(() => {
    fetch(`/api/companies/${slug}`).then((r) => r.json()).then(setCompany).catch(() => setCompany(null))
  }, [slug])

  if (!company) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <Card className="p-6 mb-6 relative overflow-hidden">
        <div className="aurora -z-10 right-[-10%] top-[-50%] h-[300px] w-[300px] bg-primary/20" />
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
          <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={80} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-2 justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{company.name}</h1>
                  {company.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">{company.industry}</div>
                {company.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3.5 w-3.5 fill-current text-warning" />
                    <span className="text-sm font-medium">{company.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">· {company.followerCount.toLocaleString()} followers</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {company.website && (
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      Website <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1">
                  <Heart className="h-3.5 w-3.5" /> Follow
                </Button>
              </div>
            </div>

            {company.mission && (
              <p className="text-sm italic text-muted-foreground mt-4 border-l-2 border-primary/30 pl-3">
                "{company.mission}"
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <Stat icon={Users} label="Size" value={company.size || "—"} />
              <Stat icon={Calendar} label="Founded" value={company.founded ? String(company.founded) : "—"} />
              <Stat icon={MapPin} label="HQ" value={company.headquarters || "—"} />
              <Stat icon={Briefcase} label="Open jobs" value={String(company.jobCount)} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Description + jobs */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-3">About {company.name}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{company.description}</p>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Open positions · {company.jobs.length}</h2>
            </div>
            <div className="space-y-2">
              {company.jobs.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground">
                  No open positions right now. Check back soon.
                </Card>
              ) : company.jobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`}>
                  <Card className="p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{j.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>
                        <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{REMOTE_LABEL[j.remoteStatus] || j.remoteStatus}</span>
                        {j.seniority && <span className="capitalize">· {j.seniority}</span>}
                        <span>· posted {timeAgo(j.postedAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {(j.salaryMin || j.salaryMax) && (
                        <div className="text-sm font-medium">{formatSalary(j.salaryMin, j.salaryMax)}</div>
                      )}
                      {j.urgent && <Badge variant="destructive" className="text-[10px] mt-1">Urgent</Badge>}
                      {j.featured && !j.urgent && <Badge variant="default" className="text-[10px] mt-1">Featured</Badge>}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {company.techStack.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Tech stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {company.techStack.map((t) => (
                  <Badge key={t} variant="outline" className="font-mono text-xs">{t}</Badge>
                ))}
              </div>
            </Card>
          )}
          {company.benefits.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Benefits</h3>
              <div className="flex flex-wrap gap-1.5">
                {company.benefits.map((b) => (
                  <Badge key={b} variant="secondary">{b}</Badge>
                ))}
              </div>
            </Card>
          )}
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Want to work here?</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Get AI-matched against {company.name}'s roles. Upload your resume to see fit scores.
            </p>
            <Button asChild size="sm" className="w-full gap-1">
              <Link href="/resume">Upload resume</Link>
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}
