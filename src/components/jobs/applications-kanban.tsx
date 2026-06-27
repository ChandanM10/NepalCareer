"use client"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CompanyLogo } from "@/components/company-logo"
import {
  DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { useDroppable, useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Send, Trash2, Briefcase, ChevronRight, GripVertical } from "lucide-react"
import { timeAgo } from "@/lib/format"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Application {
  id: string
  status: string
  appliedAt?: string | null
  updatedAt: string
  coverLetter?: string | null
  stageHistory: { status: string; at: string }[]
  notes: { text: string; at: string }[]
  rating?: number | null
  job: {
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
    company: { id: string; name: string; slug: string; logoUrl?: string | null; industry?: string | null; rating: number; verified: boolean }
  }
}

const STAGES = [
  { key: "wishlist", label: "Wishlist", color: "border-muted-foreground/30 bg-muted/30", accent: "bg-muted-foreground" },
  { key: "applied", label: "Applied", color: "border-chart-2/30 bg-chart-2/5", accent: "bg-chart-2" },
  { key: "screening", label: "Screening", color: "border-chart-4/30 bg-chart-4/5", accent: "bg-chart-4" },
  { key: "interview", label: "Interview", color: "border-chart-3/30 bg-chart-3/5", accent: "bg-chart-3" },
  { key: "offer", label: "Offer", color: "border-success/30 bg-success/5", accent: "bg-success" },
  { key: "rejected", label: "Rejected", color: "border-destructive/30 bg-destructive/5", accent: "bg-destructive" },
]

export function ApplicationsKanban() {
  const [apps, setApps] = useState<Application[] | null>(null)
  const [, startTransition] = useTransition()

  const load = () => {
    fetch("/api/applications").then((r) => r.json()).then((d) => setApps(d.applications || [])).catch(() => setApps([]))
  }
  useEffect(load, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const onDragEnd = (e: DragEndEvent) => {
    const appId = String(e.active.id)
    const newStatus = String(e.over?.id)
    if (!newStatus || !appId) return
    // Optimistic update
    setApps((prev) => prev?.map((a) => a.id === appId ? { ...a, status: newStatus } : a) || null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: appId, status: newStatus }),
        })
        if (!res.ok) throw new Error()
        toast.success(`Moved to ${newStatus}`)
      } catch {
        toast.error("Failed to update")
        load()
      }
    })
  }

  if (!apps) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-20 w-full rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-chart-2/15 text-chart-2">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Application tracker</h1>
          <p className="text-sm text-muted-foreground">{apps.length} total applications · drag cards between columns</p>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-20">
          <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-muted mb-4">
            <Send className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No applications yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Apply to jobs to start tracking them here.</p>
          <Button asChild><Link href="/jobs"><Briefcase className="h-4 w-4 mr-2" />Browse jobs</Link></Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
            {STAGES.map((stage) => {
              const items = apps.filter((a) => a.status === stage.key)
              return <Column key={stage.key} stage={stage} items={items} />
            })}
          </div>
        </DndContext>
      )}
    </div>
  )
}

function Column({ stage, items }: { stage: any; items: Application[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border-2 border-dashed p-3 min-h-[200px] transition-colors",
        stage.color,
        isOver && "border-solid ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", stage.accent)} />
          <h3 className="text-sm font-semibold">{stage.label}</h3>
        </div>
        <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8">Drop here</div>
        ) : items.map((a) => <CardItem key={a.id} app={a} />)}
      </div>
    </div>
  )
}

function CardItem({ app }: { app: Application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <CompanyLogo name={app.job.company.name} logoUrl={app.job.company.logoUrl} size={28} />
        <div className="flex-1 min-w-0">
          <Link
            href={`/jobs/${app.job.id}`}
            className="text-sm font-medium hover:underline line-clamp-2 leading-tight"
            onClick={(e) => e.stopPropagation()}
          >
            {app.job.title}
          </Link>
          <div className="text-xs text-muted-foreground truncate">{app.job.company.name}</div>
        </div>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{app.appliedAt ? `Applied ${timeAgo(app.appliedAt)}` : "Not applied"}</span>
        {app.notes.length > 0 && <Badge variant="outline" className="text-[9px] px-1">{app.notes.length} notes</Badge>}
      </div>
    </Card>
  )
}
