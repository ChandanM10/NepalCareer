"use client"
import { useState, useRef, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Upload, FileText, Loader2, Sparkles, X, ArrowRight, FileImage,
  CheckCircle2, AlertCircle, Briefcase, MapPin, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CompanyLogo } from "@/components/company-logo"
import { formatSalary, timeAgo } from "@/lib/format"

interface MatchedJob {
  id: string
  slug: string
  title: string
  category?: string | null
  location: string
  remoteStatus: string
  employmentType: string
  seniority?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  postedAt: string
  urgent?: boolean
  featured?: boolean
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  skills: string[]
  technologies: string[]
  company: {
    id: string
    name: string
    slug: string
    logoUrl?: string | null
    industry?: string | null
    rating: number
    verified: boolean
  }
}

interface Analysis {
  skills: string[]
  technologies: string[]
  yearsExp: number
  targetRole: string
  atsScore: number
  strengths: string[]
  weaknesses: string[]
  careerCategory: string
}

export function ResumeSearchSection() {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, startSearch] = useTransition()
  const [result, setResult] = useState<{
    analysis: Analysis
    matchedJobs: MatchedJob[]
    fileType: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFile = (f: File) => {
    setFile(f)
    setError(null)
    setResult(null)
  }

  const onSearch = () => {
    if (!file) {
      toast.error("Please upload a resume file first")
      return
    }
    startSearch(async () => {
      try {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/search-by-resume", {
          method: "POST",
          body: fd,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Search failed")
        setResult({
          analysis: data.analysis,
          matchedJobs: data.matchedJobs || [],
          fileType: data.fileType,
        })
        toast.success(`Found ${data.matchedJobs?.length || 0} matching jobs!`)
      } catch (e: any) {
        setError(e.message || "Failed to analyze resume")
        toast.error(e.message || "Failed to analyze resume")
      }
    })
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
  }

  return (
    <section className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <Sparkles className="h-3 w-3" />
            AI-Powered Job Search
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-3">
            Upload your resume and let AI find your perfect job
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Drop your resume (PDF, PNG, JPG, or TXT) below. Our AI extracts your skills,
            scores your ATS, and instantly shows you the best-matching jobs.
          </p>
        </div>

        {/* Upload zone */}
        {!result && (
          <Card className="p-6 sm:p-8 max-w-2xl mx-auto">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) onFile(f)
              }}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer",
                dragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/40 hover:bg-accent/30"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.text,application/pdf,image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
                    {file.type.startsWith("image/") ? <FileImage className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB · {file.type || "unknown type"}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset() }}
                    className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-md">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-base mb-1">
                      Drop your resume here, or click to browse
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] gap-0.5"><FileText className="h-2.5 w-2.5" /> PDF</Badge>
                      <Badge variant="outline" className="text-[10px] gap-0.5"><FileImage className="h-2.5 w-2.5" /> PNG</Badge>
                      <Badge variant="outline" className="text-[10px] gap-0.5"><FileImage className="h-2.5 w-2.5" /> JPG</Badge>
                      <Badge variant="outline" className="text-[10px]">TXT</Badge>
                      <span>· Max 10MB</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onSearch}
                disabled={!file || loading}
                size="lg"
                className="rounded-full px-8 gap-2 shadow-md"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Analyzing your resume…" : "Find my jobs"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>

            {loading && (
              <div className="mt-6 space-y-2 text-center">
                <div className="text-xs text-muted-foreground">
                  {file?.type.startsWith("image/") ? "🔍 AI is reading your resume image…" :
                   file?.type === "application/pdf" ? "📄 Extracting text from PDF…" :
                   "✨ AI is analyzing your skills…"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  This takes 5-15 seconds. We're parsing your resume and matching against 100+ jobs.
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6 animate-in-up">
            {/* Analysis summary */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/30">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* ATS score ring */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative h-24 w-24">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" className="stroke-muted" strokeWidth="6" fill="none" />
                      <circle
                        cx="50" cy="50" r="42"
                        className="text-primary"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(result.analysis.atsScore / 100) * 263.9} 263.9`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{result.analysis.atsScore}</span>
                      <span className="text-[10px] text-muted-foreground">ATS score</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <h3 className="font-semibold">Resume analyzed successfully!</h3>
                    <Badge variant="secondary" className="text-[10px] capitalize">{result.fileType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Detected target role: <strong>{result.analysis.targetRole}</strong> · {result.analysis.yearsExp} years experience · {result.analysis.skills.length} skills found
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {result.analysis.skills.slice(0, 8).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                    {result.analysis.skills.length > 8 && (
                      <Badge variant="outline" className="text-[10px]">+{result.analysis.skills.length - 8} more</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
                      <Upload className="h-3.5 w-3.5" /> Upload different resume
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <Link href="/resume">View full analysis <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Matched jobs header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  {result.matchedJobs.length} jobs matched for you
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Sorted by AI match score — highest fit first
                </p>
              </div>
            </div>

            {/* Job list */}
            {result.matchedJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No strong matches found. Try uploading a more detailed resume.
                </p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.matchedJobs.map((job) => (
                  <MatchedJobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            <div className="text-center pt-4">
              <Button asChild size="lg" variant="outline" className="rounded-full px-6 gap-2">
                <Link href="/jobs">
                  Browse all jobs <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function MatchedJobCard({ job }: { job: MatchedJob }) {
  const scoreColor =
    job.matchScore >= 80 ? "bg-success/15 text-success border-success/30"
    : job.matchScore >= 60 ? "bg-chart-3/15 text-chart-3 border-chart-3/30"
    : "bg-muted text-muted-foreground border-border"

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="p-5 h-full hover:shadow-lg hover:-translate-y-0.5 transition-all group relative overflow-hidden">
        {/* Match score badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold", scoreColor)}>
            <Sparkles className="h-3 w-3" />
            {job.matchScore}% match
          </span>
        </div>

        <div className="flex items-start gap-3 mb-3 pr-12">
          <CompanyLogo name={job.company.name} logoUrl={job.company.logoUrl} size={40} />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {job.title}
            </h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <span className="truncate">{job.company.name}</span>
              {job.company.verified && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" /> {job.location}
          </span>
          <span className="capitalize">· {job.remoteStatus}</span>
          {job.salaryMin && (
            <span className="font-medium text-foreground/80">
              · {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          )}
        </div>

        {/* Matched skills */}
        {job.matchedSkills.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] font-medium text-success mb-1">✓ Matched skills</div>
            <div className="flex flex-wrap gap-1">
              {job.matchedSkills.slice(0, 4).map((s) => (
                <Badge key={s} variant="secondary" className="text-[9px] bg-success/10 text-success border-success/20">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {job.missingSkills.length > 0 && (
          <div className="pt-2 border-t border-border/40">
            <div className="text-[10px] font-medium text-muted-foreground mb-1">Skills to learn</div>
            <div className="flex flex-wrap gap-1">
              {job.missingSkills.slice(0, 3).map((s) => (
                <Badge key={s} variant="outline" className="text-[9px] text-muted-foreground">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 mt-2 border-t border-border/40 text-[10px] text-muted-foreground">
          {timeAgo(job.postedAt)} · <span className="capitalize">{job.employmentType.replace("-", " ")}</span>
        </div>
      </Card>
    </Link>
  )
}
