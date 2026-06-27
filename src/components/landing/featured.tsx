"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobCard, type JobCardData } from "@/components/job-card"
import { Skeleton } from "@/components/ui/skeleton"

export function LandingFeatured() {
  const [jobs, setJobs] = useState<JobCardData[] | null>(null)
  useEffect(() => {
    fetch("/api/jobs/featured")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs || []))
      .catch(() => setJobs([]))
  }, [])

  return (
    <section className="py-16 sm:py-20 bg-card/30 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Featured roles</h2>
            <p className="mt-2 text-muted-foreground">Hand-picked positions from top companies.</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:flex gap-1">
            <Link href="/jobs">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!jobs
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))
            : jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button asChild variant="outline" className="gap-1">
            <Link href="/jobs">
              View all jobs <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
