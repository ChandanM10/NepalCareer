"use client"
import { useEffect, useState, useTransition } from "react"
import { JobCard, type JobCardData } from "@/components/job-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Heart, Briefcase } from "lucide-react"
import Link from "next/link"

export function SavedJobsView() {
  const [jobs, setJobs] = useState<JobCardData[] | null>(null)
  const [, startTransition] = useTransition()

  const load = () => {
    fetch("/api/saved-jobs").then((r) => r.json()).then((d) => setJobs(d.saved?.map((s: any) => ({ ...s.job, saved: true })) || [])).catch(() => setJobs([]))
  }
  useEffect(load, [])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-chart-5/15 text-chart-5">
          <Heart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Saved jobs</h1>
          <p className="text-sm text-muted-foreground">{jobs?.length ?? "—"} jobs in your list</p>
        </div>
      </div>

      {!jobs ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-muted mb-4">
            <Heart className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No saved jobs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Tap the heart on any job to save it for later.</p>
          <Button asChild><Link href="/jobs"><Briefcase className="h-4 w-4 mr-2" />Browse jobs</Link></Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}
    </div>
  )
}
