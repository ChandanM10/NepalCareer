"use client"
import { FileText, Sparkles, Send, TrendingUp } from "lucide-react"

const STEPS = [
  {
    icon: FileText,
    title: "1. Upload your resume",
    desc: "Drop in your resume (PDF or paste text). Our AI parses it, scores it for ATS-friendliness, and extracts the skills and tech that make you — you.",
  },
  {
    icon: Sparkles,
    title: "2. Get AI-matched",
    desc: "Every job you browse is scored against your resume. See matched and missing skills at a glance, plus a plain-English fit explanation.",
  },
  {
    icon: Send,
    title: "3. Apply with confidence",
    desc: "Generate a tailored cover letter in one click. Track your pipeline from wishlist to offer. Get reminders so nothing slips through.",
  },
  {
    icon: TrendingUp,
    title: "4. Iterate with the Advisor",
    desc: "Ask our AI Career Advisor anything — pivot strategy, interview prep, salary negotiation. It knows your context and improves over time.",
  },
]

export function LandingHowItWorks() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">From resume to offer, faster.</h2>
          <p className="mt-2 text-muted-foreground">A four-step workflow designed around how great candidates actually search.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="relative group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-sm mb-4">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
