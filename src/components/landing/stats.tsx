"use client"
import { useEffect, useState } from "react"
import { Briefcase, Building2, Globe, Plane } from "lucide-react"

export function LandingStats() {
  const [stats, setStats] = useState<{ totalJobs: number; totalCompanies: number; remoteJobs: number; visaJobs: number } | null>(null)
  useEffect(() => {
    fetch("/api/jobs/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const items = [
    { icon: Briefcase, label: "Open positions", value: stats?.totalJobs ?? "—" },
    { icon: Building2, label: "Hiring companies", value: stats?.totalCompanies ?? "—" },
    { icon: Globe, label: "Remote-friendly", value: stats?.remoteJobs ?? "—" },
    { icon: Plane, label: "Visa sponsors", value: stats?.visaJobs ?? "—" },
  ]

  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight tabular-nums">{it.value}</div>
                <div className="text-xs text-muted-foreground">{it.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
