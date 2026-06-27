import Link from "next/link"
import { Github, Twitter, Linkedin } from "lucide-react"
import { NepalCareerLogo } from "@/components/nepalcareer-logo"

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <NepalCareerLogo size={32} />
              <span className="font-bold tracking-tight">NepalCareer</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Nepal&apos;s AI-powered job platform — find IT jobs that fit your story.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/jobs" className="hover:text-foreground">Browse jobs</Link></li>
              <li><Link href="/companies" className="hover:text-foreground">Companies</Link></li>
              <li><Link href="/advisor" className="hover:text-foreground">AI Advisor</Link></li>
              <li><Link href="/resume" className="hover:text-foreground">Resume analyzer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              <li><Link href="/saved" className="hover:text-foreground">Saved jobs</Link></li>
              <li><Link href="/applications" className="hover:text-foreground">Applications</Link></li>
              <li><Link href="/alerts" className="hover:text-foreground">Alerts</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Connect</h4>
            <div className="flex gap-2">
              <a href="#" className="grid h-8 w-8 place-items-center rounded-lg border hover:bg-accent" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" className="grid h-8 w-8 place-items-center rounded-lg border hover:bg-accent" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="grid h-8 w-8 place-items-center rounded-lg border hover:bg-accent" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NepalCareer.
          </p>
        </div>
      </div>
    </footer>
  )
}
