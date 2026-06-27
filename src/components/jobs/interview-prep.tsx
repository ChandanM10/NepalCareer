"use client"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Brain, Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp, Lightbulb,
  Target, ListChecks, MessageCircle, LightbulbIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Question {
  category: string
  question: string
  hint: string
  difficulty: "easy" | "medium" | "hard"
}

const CATEGORY_ICON: Record<string, any> = {
  Behavioral: MessageCircle,
  Technical: ListChecks,
  "System Design": Target,
  ML: Brain,
  "Reverse interview": LightbulbIcon,
}

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: "bg-success/15 text-success",
  medium: "bg-chart-3/15 text-chart-3",
  hard: "bg-chart-5/15 text-chart-5",
}

export function InterviewPrepView({ initialJobId, initialFocus }: { initialJobId: string; initialFocus: string }) {
  const [jobId, setJobId] = useState(initialJobId)
  const [focus, setFocus] = useState(initialFocus)
  const [data, setData] = useState<{ jobTitle: string; questions: Question[]; source: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const generate = () => {
    setLoading(true)
    fetch("/api/interview-prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: jobId || undefined, focusArea: focus || undefined }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setData({ jobTitle: d.jobTitle, questions: d.questions, source: d.source })
        setExpanded({})
      })
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialJobId || initialFocus) generate()
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Interview Prep</h1>
          <p className="text-sm text-muted-foreground">Generate tailored interview questions for any role.</p>
        </div>
      </div>

      {/* Config card */}
      <Card className="p-5 mb-6">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Target role (optional)</label>
            <input
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Paste a job ID, or leave blank to use your resume target"
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Tip: open any job detail page and copy the ID from the URL, or leave blank to use your resume.
            </p>
          </div>
          <Button onClick={generate} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </Button>
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium mb-1.5 block">Focus area (optional)</label>
          <div className="flex flex-wrap gap-1.5">
            {["", "System Design", "Behavioral", "ML Depth", "Leadership", "Salary Negotiation"].map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  focus === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                )}
              >
                {f || "Balanced"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {!data && !loading && (
        <Card className="p-12 text-center">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Ready when you are</h3>
          <p className="text-sm text-muted-foreground mb-4">Click “Generate” to get 6 tailored interview questions with hints.</p>
        </Card>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      )}

      {data && !loading && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">For: {data.jobTitle}</h2>
              <p className="text-xs text-muted-foreground">{data.questions.length} questions · {data.source === "ai" ? "AI-generated" : "template-based"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={generate} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
          </div>

          <div className="space-y-3">
            {data.questions.map((q, i) => {
              const Icon = CATEGORY_ICON[q.category] || Lightbulb
              const isExpanded = expanded[i]
              return (
                <Card key={i} className="p-5 animate-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{q.category}</Badge>
                          <Badge className={cn("text-[10px]", DIFFICULTY_STYLE[q.difficulty] || "bg-muted")} variant="secondary">
                            {q.difficulty}
                          </Badge>
                        </div>
                        <button
                          onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "Hide hint" : "Show hint"}
                        </button>
                      </div>
                      <p className="text-sm font-medium leading-relaxed mb-2">{q.question}</p>
                      {isExpanded && (
                        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground animate-in-up">
                          <div className="flex items-start gap-1.5">
                            <Lightbulb className="h-3.5 w-3.5 text-chart-3 shrink-0 mt-0.5" />
                            <span>{q.hint}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="p-5 mt-6 bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Need deeper practice?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Try a mock interview with the AI Career Advisor — it can role-play as the interviewer.</p>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/advisor">Open AI Advisor</Link>
            </Button>
          </Card>
        </>
      )}
    </div>
  )
}
