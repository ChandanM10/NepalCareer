"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Briefcase,
  Building2,
  LayoutDashboard,
  Sparkles,
  Heart,
  Bell,
  FileText,
  MessageSquare,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  GitCompare,
  Brain,
  BarChart3,
  ArrowLeft,
  Eye,
  Settings as SettingsIcon,
  CheckCheck,
  Plus,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { timeAgo } from "@/lib/format"
import { NepalCareerLogo } from "@/components/nepalcareer-logo"

const NAV_USER = [
  { href: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/advisor", label: "AI Advisor", icon: Sparkles },
  { href: "/insights", label: "Insights", icon: Brain },
  { href: "/compare", label: "Compare", icon: GitCompare },
]

const NAV_ADMIN = [
  { href: "/admin", label: "Recruiter", icon: BarChart3 },
  { href: "/admin/jobs/new", label: "Post Job", icon: Plus },
  { href: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/watch-sources", label: "Watched", icon: Eye },
]

const SECONDARY_NAV = [
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/interview-prep", label: "Interview Prep", icon: Brain },
]

// Routes where we should NOT show the back button (top-level landing/destination routes)
const NO_BACK_ROUTES = ["/", "/jobs", "/dashboard", "/admin", "/advisor", "/insights", "/compare", "/saved", "/applications", "/alerts", "/watch-sources", "/resume", "/interview-prep", "/companies", "/notifications", "/settings", "/login", "/register"]

export function AppHeader({ user }: { user: { fullName: string; email: string; role?: string } | null }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [unread, setUnread] = useState(0)
  const [recentNotifs, setRecentNotifs] = useState<Array<{ id: string; title: string; body: string; createdAt: string; read: boolean }>>([])
  const router = useRouter()
  const { toast } = useToast()

  const isAdmin = user?.role === "admin"
  const NAV = isAdmin ? NAV_ADMIN : NAV_USER

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close mobile drawer on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [pathname])

  // Fetch unread notifications count
  useEffect(() => {
    const fetchNotifs = () => {
      fetch("/api/notifications", { credentials: "include" }).then((r) => r.json()).then((d) => {
        setUnread(d.unread || 0)
        setRecentNotifs((d.notifications || []).slice(0, 5))
      }).catch(() => {})
    }
    fetchNotifs()
    // Poll every 30s
    const i = setInterval(fetchNotifs, 30000)
    return () => clearInterval(i)
  }, [pathname])

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    toast({ title: "Logged out" })
    router.push("/")
    router.refresh()
  }

  const onMarkAllRead = async () => {
    setUnread(0)
    setRecentNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" })
  }

  const showBackButton = !NO_BACK_ROUTES.includes(pathname)

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled ? "glass-strong border-b border-border/60 shadow-sm" : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
          {/* Back button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full shrink-0"
              aria-label="Go back"
              title="Back to previous page"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-2 no-tap shrink-0">
            <NepalCareerLogo size={36} />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight">NepalCareer</span>
              <span className="text-[10px] text-muted-foreground">Nepal IT Jobs &amp; Careers</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={`nav-${item.href}`}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex-1" />

          {/* Search shortcut */}
          <Link
            href="/jobs?country=Nepal"
            className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
            title="Browse Nepal IT jobs"
          >
            <span className="text-sm">🇳🇵</span>
            <span>Nepal jobs</span>
          </Link>

          {/* Notifications bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full relative shrink-0" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5" />
                  Notifications
                  {unread > 0 && <span className="text-xs text-muted-foreground">({unread} new)</span>}
                </div>
                {unread > 0 && (
                  <button onClick={onMarkAllRead} className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                    <CheckCheck className="h-3 w-3" /> Mark all
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {recentNotifs.length === 0 ? (
                  <div className="px-3 py-8 text-center text-xs text-muted-foreground">No notifications yet</div>
                ) : recentNotifs.map((n) => (
                  <Link
                    key={n.id}
                    href="/notifications"
                    className={cn(
                      "block px-3 py-2 hover:bg-accent/50 border-b border-border/40 last:border-0 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2">{n.body}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="border-t border-border p-1">
                <DropdownMenuItem asChild className="text-xs justify-center text-primary">
                  <Link href="/notifications">View all notifications</Link>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 rounded-full pl-1 pr-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className={cn("text-xs font-semibold", isAdmin ? "bg-chart-5/15 text-chart-5" : "bg-primary/15 text-primary")}>
                      {user.fullName.split(" ").map(p => p[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{user.fullName.split(" ")[0]}</span>
                  {isAdmin && <Shield className="h-3 w-3 text-chart-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{user.fullName}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        <Shield className="h-2.5 w-2.5" /> ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin"><BarChart3 className="mr-2 h-4 w-4" />Recruiter Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/jobs/new"><Plus className="mr-2 h-4 w-4" />Post a Job</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />{isAdmin ? "User Dashboard" : "Dashboard"}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/resume"><FileText className="mr-2 h-4 w-4" />My Resume</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/advisor"><MessageSquare className="mr-2 h-4 w-4" />Career Advisor</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/watch-sources"><Eye className="mr-2 h-4 w-4" />Watched Companies</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/notifications"><Bell className="mr-2 h-4 w-4" />Notifications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings"><SettingsIcon className="mr-2 h-4 w-4" />Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-card border-l shadow-2xl p-4 animate-in slide-in-from-right overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col gap-1">
              {[...NAV, ...SECONDARY_NAV, { href: "/watch-sources", label: "Watched Companies", icon: Eye }, { href: "/notifications", label: "Notifications", icon: Bell }, { href: "/settings", label: "Settings", icon: SettingsIcon }].map((item, idx) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={`${item.href}-${idx}`}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.href === "/notifications" && unread > 0 && (
                      <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                        {unread}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
