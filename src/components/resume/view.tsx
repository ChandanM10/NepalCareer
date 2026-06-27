"use client"
import { useEffect, useState, useTransition, useRef } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText, Upload, Sparkles, CheckCircle2, AlertCircle, Lightbulb, TrendingUp,
  Star, Trash2, Loader2, FileCheck, Award, Target,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ResumeData {
  id: string
  fileName: string
  isPrimary: boolean
  rawText?: string | null
  skills: string[]
  technologies: string[]
  experience: any[]
  education: any[]
  certifications: string[]
  languages: string[]
  careerCategory?: string | null
  targetRole?: string | null
  yearsExp?: number | null
  atsScore: number | null
  strengths: string[]
  weaknesses: string[]
  improvementSuggestions: string[]
  analysisCompletedAt?: string | null
  createdAt: string
}

const SAMPLE_RESUME = `Sarah Chen — Senior Software Engineer
San Francisco, CA · sarah.chen@email.com · linkedin.com/in/sarahchen

SUMMARY
Senior Software Engineer with 5+ years building scalable web applications and ML systems. Led teams of 3-5 engineers. Shipped products used by 200k+ users.

EXPERIENCE
Senior Software Engineer · CloudCo (2022 - Present)
- Led migration to event-driven architecture, reducing p99 latency by 60% (800ms → 320ms)
- Mentored 4 engineers; ran weekly architecture review
- Designed and built real-time analytics pipeline processing 50M events/day

Software Engineer · StartupX (2020 - 2022)
- Shipped 3 major features used by 200k+ users
- Cut infrastructure cost 40% by right-sizing Kubernetes clusters
- Built CI/CD pipeline reducing deploy time from 30min to 4min

SKILLS
TypeScript, Python, React, Node.js, PostgreSQL, Docker, Kubernetes, AWS, PyTorch, System Design, Distributed Systems

EDUCATION
B.S. Computer Science · UC Berkeley (2015-2019)`

export function ResumeView() {
  const [resumes, setResumes] = useState<ResumeData[] | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [fileName, setFileName] = useState("")
  const [rawText, setRawText] = useState("")
  const [analyzing, startAnalyze] = useTransition()
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    fetch("/api/resumes").then((r) => r.json()).then((d) => setResumes(d.resumes || [])).catch(() => setResumes([]))
  }
  useEffect(load, [])

  const onAnalyze = () => {
    if (!fileName || !rawText) {
      toast.error("Please provide a filename and resume text")
      return
    }
    startAnalyze(async () => {
      try {
        const res = await fetch("/api/resumes/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName, rawText, makePrimary: true }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        toast.success(`Analyzed · ATS score: ${data.analysis.atsScore}/100`)
        setShowUpload(false)
        setFileName("")
        setRawText("")
        load()
      } catch {
        toast.error("Failed to analyze resume")
      }
    })
  }

  const onAnalyzeSample = () => {
    startAnalyze(async () => {
      try {
        const res = await fetch("/api/resumes/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: "sample-resume.txt", rawText: SAMPLE_RESUME, makePrimary: true }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        toast.success(`Sample resume analyzed · ATS ${data.analysis.atsScore}/100`)
        load()
      } catch {
        toast.error("Failed to analyze sample resume")
      }
    })
  }

  const onUploadPdf = (file: File) => {
    setUploadingPdf(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("makePrimary", "true")
    fetch("/api/resumes/upload-pdf", { method: "POST", body: fd })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Upload failed")
        toast.success(`${file.name} analyzed · ATS ${data.analysis.atsScore}/100`)
        setShowUpload(false)
        load()
      })
      .catch((e) => toast.error(e.message || "Failed to upload"))
      .finally(() => setUploadingPdf(false))
  }

  const onDelete = (id: string) => {
    setResumes((prev) => prev?.filter((r) => r.id !== id) || null)
    fetch(`/api/resumes/${id}`, { method: "DELETE" })
    toast.success("Resume deleted")
  }

  const onMakePrimary = (id: string) => {
    setResumes((prev) => prev?.map((r) => ({ ...r, isPrimary: r.id === id })) || null)
    fetch(`/api/resumes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ makePrimary: true }) })
    toast.success("Set as primary resume")
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-chart-3/15 text-chart-3">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your resumes</h1>
            <p className="text-sm text-muted-foreground">Upload your resume for AI matching and ATS analysis.</p>
          </div>
        </div>
        <Button onClick={() => setShowUpload((v) => !v)} className="gap-1.5">
          <Upload className="h-4 w-4" /> Upload
        </Button>
      </div>

      {showUpload && (
        <Card className="p-6 mb-6 animate-in-up">
          <Tabs defaultValue="file">
            <TabsList className="mb-4">
              <TabsTrigger value="file" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Upload file</TabsTrigger>
              <TabsTrigger value="text" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Paste text</TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) onUploadPdf(f)
                }}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/30"
                )}
                onClick={() => pdfInputRef.current?.click()}
              >
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.text,application/pdf,image/*,text/plain"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onUploadPdf(e.target.files[0])}
                />
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-xl bg-primary/10 text-primary mb-3">
                  {uploadingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </div>
                <div className="font-semibold text-sm mb-1">
                  {uploadingPdf ? "Parsing & analyzing…" : "Drop your resume here, or click to browse"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Supports <Badge variant="outline" className="mx-0.5 text-[10px] py-0">PDF</Badge>
                  <Badge variant="outline" className="mx-0.5 text-[10px] py-0">PNG</Badge>
                  <Badge variant="outline" className="mx-0.5 text-[10px] py-0">JPG</Badge>
                  <Badge variant="outline" className="mx-0.5 text-[10px] py-0">TXT</Badge>
                  · Max 5MB · AI will analyze skills, ATS score, and improvements
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => { setFileName("sample-resume.txt"); setRawText(SAMPLE_RESUME); setShowUpload(false); onAnalyzeSample() }}>
                  <Sparkles className="h-3 w-3 mr-1" /> Use sample resume
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="text">
              <div className="grid gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">File name</label>
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. sarah-chen-resume.txt"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Resume text</label>
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your resume text here…"
                    className="min-h-[200px] font-mono text-xs"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => { setFileName("sample-resume.txt"); setRawText(SAMPLE_RESUME) }} className="w-fit">
                  <Sparkles className="h-3 w-3 mr-1" /> Use sample resume
                </Button>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
                <Button onClick={onAnalyze} disabled={analyzing} className="gap-1.5">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {analyzing ? "Analyzing…" : "Analyze with AI"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {!resumes ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : resumes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No resume uploaded</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload your resume to unlock AI matching and ATS scoring.</p>
          <Button onClick={() => setShowUpload(true)} className="gap-1.5">
            <Upload className="h-4 w-4" /> Upload your resume
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {resumes.map((r) => <ResumeCard key={r.id} resume={r} onDelete={onDelete} onMakePrimary={onMakePrimary} />)}
        </div>
      )}
    </div>
  )
}

function ResumeCard({
  resume,
  onDelete,
  onMakePrimary,
}: {
  resume: ResumeData
  onDelete: (id: string) => void
  onMakePrimary: (id: string) => void
}) {
  const score = resume.atsScore ?? 0
  const scoreColor = score >= 80 ? "text-success" : score >= 60 ? "text-chart-3" : "text-destructive"
  const scoreLabel = score >= 80 ? "Strong" : score >= 60 ? "Good" : "Needs work"

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: ATS score */}
        <div className="sm:w-48 shrink-0 flex flex-col items-center justify-center bg-muted/30 rounded-xl p-4">
          <div className="relative h-28 w-28">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" className="stroke-muted" strokeWidth="6" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                className={cn("transition-all", scoreColor)}
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 263.9} 263.9`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold", scoreColor)}>{score}</span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="text-center mt-2">
            <div className="text-sm font-semibold">{scoreLabel}</div>
            <div className="text-[10px] text-muted-foreground">ATS score</div>
          </div>
        </div>

        {/* Right: analysis */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{resume.fileName}</h2>
                {resume.isPrimary && <Badge variant="default" className="text-[10px]">Primary</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {resume.targetRole || "No target role"} · {resume.yearsExp ?? "?"} yrs exp · {resume.careerCategory || "General"}
              </div>
            </div>
            <div className="flex gap-1">
              {!resume.isPrimary && (
                <Button variant="outline" size="sm" onClick={() => onMakePrimary(resume.id)}>
                  Set primary
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => onDelete(resume.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="feedback">AI feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-success mb-2">
                    <CheckCircle2 className="h-3 w-3" /> Strengths
                  </div>
                  <ul className="space-y-1 text-sm">
                    {resume.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-success">+</span>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-2">
                    <AlertCircle className="h-3 w-3" /> Weaknesses
                  </div>
                  <ul className="space-y-1 text-sm">
                    {resume.weaknesses.map((s, i) => <li key={i} className="flex gap-2"><span className="text-destructive">−</span>{s}</li>)}
                  </ul>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-2">ATS score breakdown</div>
                <Progress value={score} className="h-2" />
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-4 space-y-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Technologies</div>
                <div className="flex flex-wrap gap-1.5">
                  {resume.technologies.map((t) => <Badge key={t} variant="outline" className="font-mono">{t}</Badge>)}
                </div>
              </div>
              {resume.certifications.length > 0 && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Certifications</div>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.certifications.map((c) => <Badge key={c} variant="outline" className="gap-1"><Award className="h-3 w-3" />{c}</Badge>)}
                  </div>
                </div>
              )}
              {resume.languages.length > 0 && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Languages</div>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.languages.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="feedback" className="mt-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-chart-3" />
                <h3 className="font-semibold text-sm">AI improvement suggestions</h3>
              </div>
              <div className="space-y-2">
                {resume.improvementSuggestions.map((s, i) => (
                  <div key={i} className="flex gap-2 p-3 rounded-lg bg-muted/30 text-sm">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">{i + 1}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" size="sm" className="mt-2 gap-1.5">
                <Link href="/advisor">
                  <Sparkles className="h-3.5 w-3.5" /> Ask AI Advisor for more help
                </Link>
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  )
}
