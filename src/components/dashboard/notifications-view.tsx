"use client"
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell, BellOff, CheckCheck, Trash2, ExternalLink, MessageCircle, Mail,
  Smartphone, Sparkles, Briefcase, Send, Settings as SettingsIcon, CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/format"

interface DeliveryLogEntry {
  channel: string
  status: string
  at: string
  message: string
}

interface Notification {
  id: string
  type: string
  title: string
  body: string
  meta: any
  channels: string[]
  deliveryLog: DeliveryLogEntry[]
  read: boolean
  createdAt: string
}

const TYPE_ICON: Record<string, any> = {
  watch_source_new: Briefcase,
  application_update: CheckCircle2,
  new_job_match: Sparkles,
  test: Send,
  system: Bell,
}

const CHANNEL_ICON: Record<string, any> = {
  whatsapp: Smartphone,
  email: Mail,
  in_app: MessageCircle,
}

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  in_app: "In-app",
}

export function NotificationsView() {
  const [notifs, setNotifs] = useState<Notification[] | null>(null)
  const [unread, setUnread] = useState(0)
  const [, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      setNotifs(d.notifications || [])
      setUnread(d.unread || 0)
    }).catch(() => setNotifs([]))
  }
  useEffect(load, [])

  const onMarkRead = (id: string) => {
    setNotifs((prev) => prev?.map((n) => n.id === id ? { ...n, read: true } : n) || null)
    setUnread((u) => Math.max(0, u - 1))
    fetch(`/api/notifications/${id}/read`, { method: "POST" })
  }

  const onMarkAllRead = () => {
    setNotifs((prev) => prev?.map((n) => ({ ...n, read: true })) || null)
    setUnread(0)
    fetch("/api/notifications/read-all", { method: "POST" })
    toast.success("All marked as read")
  }

  const onTest = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications/test", { method: "POST" })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        toast.success(`Test sent via ${data.delivered.join(", ")}`)
        load()
      } catch (e: any) {
        toast.error(e.message || "Failed to send test")
      }
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-chart-4/15 text-chart-4">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                {unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"} · alerts from watched companies and your applications
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onTest} className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Test
          </Button>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={onMarkAllRead} className="gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {!notifs ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : notifs.length === 0 ? (
        <Card className="p-12 text-center">
          <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No notifications yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add companies to your watch list and you'll get alerts here when they post new jobs.
          </p>
          <Button asChild className="gap-1.5">
            <Link href="/watch-sources">Add company URLs</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const Icon = TYPE_ICON[n.type] || Bell
            const isExpanded = expanded === n.id
            return (
              <Card
                key={n.id}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-sm",
                  !n.read && "border-l-4 border-l-primary"
                )}
                onClick={() => {
                  setExpanded(isExpanded ? null : n.id)
                  if (!n.read) onMarkRead(n.id)
                }}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg shrink-0",
                    n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={cn("text-sm", n.read ? "font-medium" : "font-semibold")}>{n.title}</h3>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>

                    {/* Channel badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {n.channels.map((c) => {
                        const CIcon = CHANNEL_ICON[c] || Bell
                        return (
                          <Badge key={c} variant="outline" className="text-[10px] gap-0.5 py-0">
                            <CIcon className="h-2.5 w-2.5" />
                            {CHANNEL_LABEL[c] || c}
                          </Badge>
                        )
                      })}
                      {!n.read && <Badge variant="destructive" className="text-[10px] py-0">Unread</Badge>}
                    </div>

                    {/* Delivery log (expandable) */}
                    {isExpanded && n.deliveryLog.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/40 animate-in-up">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                          Delivery log (mock — real delivery requires WhatsApp Business API / SendGrid credentials)
                        </div>
                        <div className="space-y-1.5">
                          {n.deliveryLog.map((d, i) => {
                            const CIcon = CHANNEL_ICON[d.channel] || Bell
                            return (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <CIcon className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium">{CHANNEL_LABEL[d.channel] || d.channel}</span>
                                    <Badge variant="outline" className="text-[9px] py-0 bg-success/10 text-success border-success/20">
                                      <CheckCircle2 className="h-2 w-2 mr-0.5" /> {d.status}
                                    </Badge>
                                    <span className="text-muted-foreground">{timeAgo(d.at)}</span>
                                  </div>
                                  <div className="text-muted-foreground mt-0.5">{d.message}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action link */}
                    {n.meta?.url && (
                      <a
                        href={n.meta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                      >
                        View source <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-5 mt-6 bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/30">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Want real WhatsApp / Email alerts?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          This sandbox mocks delivery. To enable real alerts in production, configure your WhatsApp number and email in Settings — when deployed with WhatsApp Business API + SendGrid credentials, alerts go out for real.
        </p>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/settings">Configure notifications</Link>
        </Button>
      </Card>
    </div>
  )
}
