"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Code2, Brain, Palette, Compass, BarChart3, Server, Megaphone, PenTool, Rocket } from "lucide-react"

const CATEGORY_META: Record<string, { icon: any; color: string }> = {
  Engineering: { icon: Code2, color: "bg-chart-1/15 text-chart-1" },
  "AI/ML": { icon: Brain, color: "bg-chart-4/15 text-chart-4" },
  Design: { icon: Palette, color: "bg-chart-3/15 text-chart-3" },
  Product: { icon: Compass, color: "bg-chart-2/15 text-chart-2" },
  Data: { icon: BarChart3, color: "bg-success/15 text-success" },
  Research: { icon: Rocket, color: "bg-chart-5/15 text-chart-5" },
  Marketing: { icon: Megaphone, color: "bg-info/15 text-info" },
  Sales: { icon: PenTool, color: "bg-warning/15 text-warning" },
}

const FALLBACK = [
  { name: "Engineering", count: 28 },
  { name: "AI/ML", count: 14 },
  { name: "Design", count: 8 },
  { name: "Product", count: 12 },
  { name: "Data", count: 9 },
  { name: "Research", count: 4 },
  { name: "Marketing", count: 4 },
  { name: "Sales", count: 2 },
]

export function LandingCategories() {
  const [cats, setCats] = useState<{ name: string; count: number }[]>(FALLBACK)
  useEffect(() => {
    fetch("/api/jobs/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d?.categories?.length) setCats(d.categories)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Browse by category</h2>
          <p className="mt-2 text-muted-foreground">Find your next role in the function you love.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cats.map((c) => {
            const meta = CATEGORY_META[c.name] || { icon: Code2, color: "bg-muted text-muted-foreground" }
            return (
              <Link key={c.name} href={`/jobs?category=${encodeURIComponent(c.name)}`}>
                <Card className="group p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${meta.color}`}>
                    <meta.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.count} open</div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
