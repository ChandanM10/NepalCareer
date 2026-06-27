"use client"
import Link from "next/link"
import { MapPin, Briefcase, DollarSign, Clock, Zap, BadgeCheck, Heart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CompanyLogo } from "@/components/company-logo"
import { formatSalary, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useState, useTransition } from "react"
import { toast } from "sonner"

export interface JobCardData {
  id: string
  slug: string
  title: string
  description?: string
  category?: string | null
  subcategory?: string | null
  location: string
  city?: string | null
  country?: string | null
  remoteStatus: "remote" | "hybrid" | "onsite"
  employmentType: string
  seniority?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string
  equity?: string | null
  postedAt: string
  skills?: string[]
  technologies?: string[]
  urgent?: boolean
  featured?: boolean
  matchScore?: number | null
  saved?: boolean
  company: {
    id: string
    name: string
    slug: string
    logoUrl?: string | null
    industry?: string | null
    rating?: number
    verified?: boolean
  }
}

const REMOTE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
}

export function JobCard({ job, compact = false }: { job: JobCardData; compact?: boolean }) {
  const [saved, setSaved] = useState(!!job.saved)
  const [pending, startTransition] = useTransition()

  const toggleSave = () => {
    startTransition(async () => {
      const wasSaved = saved
      setSaved(!wasSaved)
      try {
        const res = await fetch(`/api/jobs/${job.id}/save`, {
          method: wasSaved ? "DELETE" : "POST",
        })
        if (!res.ok) throw new Error()
        toast.success(wasSaved ? "Removed from saved" : "Saved to your list")
      } catch {
        setSaved(wasSaved)
        toast.error("Failed to update")
      }
    })
  }

  const skills = (job.skills || []).slice(0, 4)
  const techs = (job.technologies || []).slice(0, 4)
  const allTags = [...skills, ...techs]

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        "border-border/60 hover:border-primary/40",
        job.urgent && "border-destructive/30",
        compact ? "p-3" : "p-5"
      )}
    >
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary group-hover:via-chart-2 group-hover:to-chart-4 transition-all duration-500" />

      <div className="flex items-start gap-3 mb-3">
        <Link href={`/companies/${job.company.slug}`} className="shrink-0 no-tap">
          <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} size={compact ? 36 : 44} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/jobs/${job.id}`}
              className={cn(
                "font-semibold leading-tight hover:text-primary transition-colors line-clamp-2",
                compact ? "text-sm" : "text-base"
              )}
            >
              {job.title}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 shrink-0 rounded-full", saved && "text-destructive")}
              onClick={toggleSave}
              disabled={pending}
              aria-label={saved ? "Unsave" : "Save"}
            >
              <Heart className={cn("h-4 w-4", saved && "fill-current")} />
            </Button>
          </div>
          <Link
            href={`/companies/${job.company.slug}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="truncate">{job.company.name}</span>
            {job.company.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
            {job.company.rating ? (
              <span className="text-xs">· ★ {job.company.rating.toFixed(1)}</span>
            ) : null}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {REMOTE_LABEL[job.remoteStatus] || job.remoteStatus}
        </span>
        <span className="inline-flex items-center gap-1 capitalize">
          <Clock className="h-3 w-3" />
          {job.employmentType.replace("-", " ")}
        </span>
        {(job.salaryMin || job.salaryMax) && (
          <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
            <DollarSign className="h-3 w-3" />
            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
          </span>
        )}
      </div>

      {allTags.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {allTags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{timeAgo(job.postedAt)}</span>
          {job.urgent && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
              <Zap className="h-2.5 w-2.5" /> Urgent
            </Badge>
          )}
          {job.featured && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
              Featured
            </Badge>
          )}
        </div>
        {typeof job.matchScore === "number" && (
          <MatchBadge score={job.matchScore} />
        )}
      </div>
    </Card>
  )
}

export function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-success/15 text-success border-success/30"
    : score >= 60 ? "bg-chart-3/15 text-chart-3 border-chart-3/30"
    : "bg-muted text-muted-foreground border-border"
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", color)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score}% match
    </span>
  )
}
