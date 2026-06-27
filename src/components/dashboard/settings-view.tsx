"use client"
import { useEffect, useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Settings as SettingsIcon, Save, Loader2, Smartphone, Mail, Bell, User,
  Globe, Send, CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

interface Settings {
  fullName: string
  email: string
  headline?: string | null
  bio?: string | null
  location?: string | null
  whatsappNumber?: string | null
  phoneCountry?: string | null
  notifyWhatsapp: boolean
  notifyEmail: boolean
  notifyInApp: boolean
}

const COUNTRIES = ["Nepal", "India", "Bangladesh", "Sri Lanka", "Pakistan", "United States", "United Kingdom", "Singapore", "Other"]

export function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, startSave] = useTransition()

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setSettings(d.settings)).catch(() => {})
  }, [])

  const onSave = () => {
    if (!settings) return
    startSave(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        toast.success("Settings saved")
      } catch (e: any) {
        toast.error(e.message || "Failed to save")
      }
    })
  }

  const onTest = () => {
    startSave(async () => {
      try {
        const res = await fetch("/api/notifications/test", { method: "POST" })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        toast.success(`Test sent via ${data.delivered.join(", ")}. Check your notifications.`)
      } catch (e: any) {
        toast.error(e.message || "Failed to send test")
      }
    })
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const set = (k: keyof Settings, v: any) => setSettings((prev) => prev ? { ...prev, [k]: v } : prev)

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and notification preferences.</p>
        </div>
      </div>

      {/* Profile section */}
      <Card className="p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5">Full name</Label>
            <Input value={settings.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Email</Label>
            <Input value={settings.email} disabled className="bg-muted/40" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Headline</Label>
            <Input value={settings.headline || ""} onChange={(e) => set("headline", e.target.value)} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Bio</Label>
            <Textarea value={settings.bio || ""} onChange={(e) => set("bio", e.target.value)} placeholder="Short bio" className="min-h-[80px]" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Location</Label>
            <Input value={settings.location || ""} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Kathmandu, Nepal" />
          </div>
        </div>
      </Card>

      {/* Notification channels */}
      <Card className="p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Notification channels</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how you want to receive alerts. WhatsApp and email are mocked in this sandbox — but the configuration is real, and would dispatch to actual WhatsApp Business API / SendGrid in production.
        </p>

        {/* WhatsApp */}
        <div className="space-y-3">
          <ChannelRow
            icon={Smartphone}
            label="WhatsApp"
            description="Get instant alerts on your phone when new jobs match"
            enabled={settings.notifyWhatsapp}
            onToggle={(v) => set("notifyWhatsapp", v)}
          />
          {settings.notifyWhatsapp && (
            <div className="ml-12 grid sm:grid-cols-2 gap-3 pb-3">
              <div>
                <Label className="mb-1.5">WhatsApp number (E.164)</Label>
                <Input
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => set("whatsappNumber", e.target.value)}
                  placeholder="+97798XXXXXXXX"
                />
              </div>
              <div>
                <Label className="mb-1.5">Country</Label>
                <Select value={settings.phoneCountry || "Nepal"} onValueChange={(v) => set("phoneCountry", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <ChannelRow
            icon={Mail}
            label="Email"
            description={`Alerts sent to ${settings.email}`}
            enabled={settings.notifyEmail}
            onToggle={(v) => set("notifyEmail", v)}
          />

          <ChannelRow
            icon={Bell}
            label="In-app"
            description="Show notifications in the bell icon dropdown"
            enabled={settings.notifyInApp}
            onToggle={(v) => set("notifyInApp", v)}
          />
        </div>
      </Card>

      {/* WhatsApp preview */}
      {settings.notifyWhatsapp && settings.whatsappNumber && (
        <Card className="p-5 mb-4 bg-gradient-to-br from-success/5 to-chart-2/5 border-success/30">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4 text-success" />
            <h3 className="font-semibold text-sm">WhatsApp preview</h3>
          </div>
          <div className="ml-12 bg-success/10 rounded-lg p-3 text-sm max-w-md">
            <div className="text-[10px] text-muted-foreground mb-1">NepalCareer · now</div>
            <div className="leading-relaxed">
              <strong>🔔 New job match!</strong>
              <br />
              Fusemachines just posted: <em>AI Engineer — Computer Vision</em> (Kathmandu)
              <br />
              Match score: 82%
              <br />
              <a href="#" className="text-primary underline">View job →</a>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 ml-12">
            Will be sent to <strong>{settings.whatsappNumber}</strong> via WhatsApp Business API
          </p>
        </Card>
      )}

      {/* Email preview */}
      {settings.notifyEmail && (
        <Card className="p-5 mb-4 bg-gradient-to-br from-chart-2/5 to-chart-4/5 border-chart-2/30">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-chart-2" />
            <h3 className="font-semibold text-sm">Email preview</h3>
          </div>
          <div className="ml-12 bg-background border border-border rounded-lg p-3 text-sm max-w-md">
            <div className="font-semibold border-b border-border pb-2 mb-2">
              Subject: 🔔 New job at Fusemachines — 82% match
            </div>
            <div className="text-muted-foreground leading-relaxed">
              Hi {settings.fullName.split(" ")[0]},
              <br /><br />
              Fusemachines just posted <strong>AI Engineer — Computer Vision</strong> in Kathmandu.
              Based on your resume, this is an 82% match.
              <br /><br />
              <a href="#" className="text-primary underline">View job and apply →</a>
              <br /><br />
              — NepalCareer
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 ml-12">
            Will be sent to <strong>{settings.email}</strong> via SendGrid
          </p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={onTest} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send test notification
        </Button>
        <Button onClick={onSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </Button>
      </div>
    </div>
  )
}

function ChannelRow({
  icon: Icon, label, description, enabled, onToggle,
}: {
  icon: any; label: string; description: string; enabled: boolean; onToggle: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`grid h-9 w-9 place-items-center rounded-lg shrink-0 ${enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm flex items-center gap-2">
          {label}
          {enabled && <Badge variant="outline" className="text-[9px] py-0 bg-success/10 text-success border-success/20 gap-0.5">
            <CheckCircle2 className="h-2 w-2" /> Active
          </Badge>}
        </div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  )
}
