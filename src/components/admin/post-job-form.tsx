"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Loader2, CheckCircle2, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

interface Company {
  id: string; name: string; industry?: string | null
}

const CATEGORIES = ["Engineering", "AI/ML", "Design", "Product", "Data", "Research", "Marketing", "Sales"]
const SENIORITIES = ["intern", "junior", "mid", "senior", "lead", "staff", "director", "vp", "executive"]
const REGIONS = ["Americas", "EMEA", "APAC", "Global"]

export function PostJobForm({ companies }: { companies: Company[] }) {
  const router = useRouter()
  const [saving, startSave] = useTransition()
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [tech, setTech] = useState<string[]>([])
  const [techInput, setTechInput] = useState("")
  const [requirements, setRequirements] = useState<string[]>([])
  const [reqInput, setReqInput] = useState("")
  const [responsibilities, setResponsibilities] = useState<string[]>([])
  const [respInput, setRespInput] = useState("")

  const [form, setForm] = useState({
    title: "", description: "", companyId: "", category: "Engineering", subcategory: "",
    location: "San Francisco, CA", city: "San Francisco", country: "United States", region: "Americas",
    remoteStatus: "hybrid", employmentType: "full-time", seniority: "senior",
    salaryMin: "", salaryMax: "", equity: "", experienceYrs: "3",
    visaSponsor: false, featured: false, urgent: false,
  })

  const set = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }))

  const addSkill = () => {
    const v = skillInput.trim()
    if (v && !skills.includes(v)) { setSkills([...skills, v]); setSkillInput("") }
  }
  const addTech = () => {
    const v = techInput.trim()
    if (v && !tech.includes(v)) { setTech([...tech, v]); setTechInput("") }
  }
  const addReq = () => {
    const v = reqInput.trim()
    if (v) { setRequirements([...requirements, v]); setReqInput("") }
  }
  const addResp = () => {
    const v = respInput.trim()
    if (v) { setResponsibilities([...responsibilities, v]); setRespInput("") }
  }

  const onSubmit = () => {
    if (!form.title || !form.description || !form.companyId) {
      toast.error("Title, description, and company are required")
      return
    }
    startSave(async () => {
      try {
        const res = await fetch("/api/admin/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            salaryMin: form.salaryMin || null,
            salaryMax: form.salaryMax || null,
            experienceYrs: form.experienceYrs || null,
            skills,
            technologies: tech,
            requirements,
            responsibilities,
            niceToHave: [],
          }),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.error || "Failed")
        }
        const data = await res.json()
        toast.success("Job posted successfully!")
        router.push(`/jobs/${data.job.id}`)
      } catch (e: any) {
        toast.error(e.message || "Failed to post job")
      }
    })
  }

  const generateDescription = () => {
    const tpl = `We're hiring a ${form.title || "Senior Engineer"} to join our team. You'll work on features that touch millions of users and partner directly with product and ML teams to ship outcomes, not tickets. This is a high-impact role with room to grow.`
    set("description", tpl)
    toast.success("Draft description generated")
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1">
        <Link href="/admin"><ArrowLeft className="h-4 w-4" /> Back to admin</Link>
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Plus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Post a new job</h1>
          <p className="text-sm text-muted-foreground">Fill out the details and your job goes live instantly.</p>
        </div>
      </div>

      <Card className="p-6 space-y-5">
        {/* Basics */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basics</h3>
          <div>
            <Label className="mb-1.5">Job title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Full-Stack Engineer" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Description *</Label>
              <Button variant="ghost" size="sm" onClick={generateDescription} className="h-6 text-xs gap-1">
                <Sparkles className="h-3 w-3" /> Draft for me
              </Button>
            </div>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the role, the team, and what success looks like." className="min-h-[120px]" />
          </div>
          <div>
            <Label className="mb-1.5">Company *</Label>
            <Select value={form.companyId} onValueChange={(v) => set("companyId", v)}>
              <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.industry}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Subcategory (optional)</Label>
              <Input value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} placeholder="e.g. Full-Stack" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3 pt-4 border-t border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location & work mode</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Location</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5">Region</Label>
              <Select value={form.region} onValueChange={(v) => set("region", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Work mode</Label>
              <Select value={form.remoteStatus} onValueChange={(v) => set("remoteStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Employment type</Label>
              <Select value={form.employmentType} onValueChange={(v) => set("employmentType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div className="space-y-3 pt-4 border-t border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compensation & seniority</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5">Salary min ($)</Label>
              <Input type="number" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="140000" />
            </div>
            <div>
              <Label className="mb-1.5">Salary max ($)</Label>
              <Input type="number" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="220000" />
            </div>
            <div>
              <Label className="mb-1.5">Experience (yrs)</Label>
              <Input type="number" value={form.experienceYrs} onChange={(e) => set("experienceYrs", e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Seniority</Label>
              <Select value={form.seniority} onValueChange={(v) => set("seniority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SENIORITIES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Equity (optional)</Label>
              <Input value={form.equity} onChange={(e) => set("equity", e.target.value)} placeholder="0.05% - 0.2%" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.visaSponsor} onChange={(e) => set("visaSponsor", e.target.checked)} className="h-4 w-4 rounded" />
              Visa sponsorship
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 rounded" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.urgent} onChange={(e) => set("urgent", e.target.checked)} className="h-4 w-4 rounded" />
              Urgent
            </label>
          </div>
        </div>

        {/* Skills & tech */}
        <div className="space-y-3 pt-4 border-t border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skills & technologies</h3>
          <TagInput label="Skills" items={skills} setItems={setSkills} input={skillInput} setInput={setSkillInput} onAdd={addSkill} placeholder="e.g. System Design" />
          <TagInput label="Technologies" items={tech} setItems={setTech} input={techInput} setInput={setTechInput} onAdd={addTech} placeholder="e.g. TypeScript" mono />
        </div>

        {/* Requirements & responsibilities */}
        <div className="space-y-3 pt-4 border-t border-border/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Requirements & responsibilities</h3>
          <ListInput label="Requirements" items={requirements} setItems={setRequirements} input={reqInput} setInput={setReqInput} onAdd={addReq} placeholder="e.g. 3+ years building production web apps" />
          <ListInput label="Responsibilities" items={responsibilities} setItems={setResponsibilities} input={respInput} setInput={setRespInput} onAdd={addResp} placeholder="e.g. Design and ship user-facing features" />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
          <Button asChild variant="outline"><Link href="/admin">Cancel</Link></Button>
          <Button onClick={onSubmit} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Posting…" : "Post job"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function TagInput({ label, items, setItems, input, setInput, onAdd, placeholder, mono }: any) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd() } }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={onAdd} size="icon"><Plus className="h-4 w-4" /></Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {items.map((s: string) => (
            <Badge key={s} variant="secondary" className={`gap-1 ${mono ? "font-mono" : ""}`}>
              {s}
              <button onClick={() => setItems(items.filter((x: string) => x !== s))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function ListInput({ label, items, setItems, input, setInput, onAdd, placeholder }: any) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd() } }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={onAdd} size="icon"><Plus className="h-4 w-4" /></Button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((s: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm group">
              <span className="text-primary mt-0.5">→</span>
              <span className="flex-1">{s}</span>
              <button onClick={() => setItems(items.filter((_: any, idx: number) => idx !== i))} className="opacity-0 group-hover:opacity-100 text-destructive">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
