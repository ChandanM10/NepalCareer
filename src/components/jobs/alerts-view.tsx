"use client"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Plus, Trash2, Search, Clock, Zap, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { timeAgo } from "@/lib/format"

interface Alert {
  id: string
  name: string
  query: string
  filters: Record<string, any>
  frequency: string
  active: boolean
  lastTriggeredAt?: string | null
  matchCount: number
  createdAt: string
}

export function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [query, setQuery] = useState("")
  const [remoteStatus, setRemoteStatus] = useState("")
  const [employmentType, setEmploymentType] = useState("")
  const [frequency, setFrequency] = useState("instant")
  const [, startTransition] = useTransition()

  const load = () => {
    fetch("/api/alerts").then((r) => r.json()).then((d) => setAlerts(d.alerts || [])).catch(() => setAlerts([]))
  }
  useEffect(load, [])

  const onCreate = () => {
    if (!name || !query) {
      toast.error("Name and search query are required")
      return
    }
    startTransition(async () => {
      try {
        await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, query,
            filters: { remote: remoteStatus, type: employmentType },
            frequency,
          }),
        })
        toast.success("Alert created")
        setName(""); setQuery(""); setRemoteStatus(""); setEmploymentType(""); setFrequency("instant")
        setShowForm(false)
        load()
      } catch {
        toast.error("Failed to create alert")
      }
    })
  }

  const onToggle = (id: string, active: boolean) => {
    setAlerts((prev) => prev?.map((a) => a.id === id ? { ...a, active } : a) || null)
    fetch(`/api/alerts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) })
  }

  const onDelete = (id: string) => {
    setAlerts((prev) => prev?.filter((a) => a.id !== id) || null)
    fetch(`/api/alerts/${id}`, { method: "DELETE" })
    toast.success("Alert deleted")
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-chart-4/15 text-chart-4">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Job alerts</h1>
            <p className="text-sm text-muted-foreground">Get notified when new jobs match your criteria.</p>
          </div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New alert
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 mb-6 animate-in-up">
          <h3 className="font-semibold mb-3">Create a new alert</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1 block">Alert name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senior remote SWE" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1 block">Search query</label>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Work mode</label>
              <Select value={remoteStatus} onValueChange={(v) => setRemoteStatus(v === "_" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Any</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Type</label>
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v === "_" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Any</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Frequency</label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={onCreate}>Create alert</Button>
          </div>
        </Card>
      )}

      {!alerts ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No alerts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create an alert to get notified about matching jobs.</p>
          <Button onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Create your first alert
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id} className="p-4 flex items-center gap-4">
              <div className={`grid h-10 w-10 place-items-center rounded-lg shrink-0 ${a.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {a.frequency === "instant" ? <Zap className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{a.name}</span>
                  <Badge variant={a.active ? "default" : "secondary"} className="text-[10px]">
                    {a.active ? "Active" : "Paused"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <Search className="h-3 w-3 inline mr-1" />
                  "{a.query}"
                  {a.filters?.remote && <Badge variant="outline" className="ml-2 text-[10px] py-0">{a.filters.remote}</Badge>}
                  {a.filters?.type && <Badge variant="outline" className="ml-1 text-[10px] py-0">{a.filters.type}</Badge>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {a.matchCount} matches · last triggered {a.lastTriggeredAt ? timeAgo(a.lastTriggeredAt) : "never"} · {a.frequency} frequency
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={a.active} onCheckedChange={(c) => onToggle(a.id, c)} />
                <Button asChild variant="ghost" size="sm" className="h-8 gap-1">
                  <Link href={`/jobs?q=${encodeURIComponent(a.query)}`}>
                    View matches <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
