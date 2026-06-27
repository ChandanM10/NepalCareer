"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles, TrendingUp, AlertCircle, CheckCircle2, Lightbulb, Brain,
  ArrowRight, RefreshCw, Target,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Insight {
  type: string
  title: string
  description: string
  severity: "info" | "warning" | "success"
  data?: any
}

const SEVERITY_STYLE: Record<string, { icon: any; border: string; bg: string; iconBg: string; iconColor: string }> = {
  info: { icon: Lightbulb, border: "border-chart-2/30", bg: "bg-chart-2/5", iconBg: "bg-chart-2/10", iconColor: "text-chart-2" },
  warning: { icon: AlertCircle, border: "border-chart-5/30", bg: "bg-chart-5/5", iconBg: "bg-chart-5/10", iconColor: "text-chart-5" },
  success: { icon: CheckCircle2, border: "border-success/30", bg: "bg-success/5", iconBg: "bg-success/10", iconColor: "text-success" },
}

export function InsightsView() {
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [loading, setLoading] = useState(false)

  const load = () => {
    setLoading(true)
    fetch("/api/insights").then((r) => r.json()).then((d) => setInsights(d.insights || [])).catch(() => setInsights([])).finally(() => setLoading(false))
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Career Insights</h1>
            <p className="text-sm text-muted-foreground">Personalized analysis based on your resume, applications, and market data.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {!insights ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : insights.length === 0 ? (
        <Card className="p-12 text-center">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No insights yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload a resume and start applying to unlock personalized insights.</p>
          <Button asChild><Link href="/resume">Upload resume</Link></Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {insights.map((ins, i) => {
            const style = SEVERITY_STYLE[ins.severity]
            const Icon = style.icon
            return (
              <Card key={i} className={cn("p-5 border-2", style.border, style.bg, "animate-in-up")} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex gap-3">
                  <div className={cn("grid h-10 w-10 place-items-center rounded-xl shrink-0", style.iconBg, style.iconColor)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{ins.title}</h3>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{ins.type.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{ins.description}</p>
                    {ins.data && Array.isArray(ins.data) && ins.data.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {ins.data.map((d: any) => (
                          <Badge key={d.name} variant="secondary" className="text-xs gap-1">
                            {d.name}
                            <span className="text-muted-foreground">· {d.count}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}

          <Card className="p-6 mt-6 bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/30">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Ready to act on these insights?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ask the AI Career Advisor for a personalized action plan, or browse jobs that match your updated profile.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/advisor"><Sparkles className="h-3.5 w-3.5" /> Ask AI Advisor</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/jobs"><TrendingUp className="h-3.5 w-3.5" /> Browse matching jobs <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
