"use client"
import { useEffect, useState, useRef, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sparkles, Send, Loader2, MessageSquare, Plus, Trash2, User, Bot,
  TrendingUp, FileText, DollarSign, Target, Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

interface Message {
  role: "user" | "assistant"
  content: string
  ts?: string
}

interface Thread {
  id: string
  title: string
  updatedAt: string
  messageCount: number
  preview: string
}

const SUGGESTIONS = [
  { icon: TrendingUp, label: "Career pivot strategy", prompt: "I want to pivot from full-stack engineering to ML. What's the most effective 3-month plan?" },
  { icon: FileText, label: "Improve my resume", prompt: "What are the top 5 things I can do to improve my resume for senior engineering roles?" },
  { icon: DollarSign, label: "Salary negotiation", prompt: "I just got an offer for $180k. How do I negotiate without losing the offer?" },
  { icon: Target, label: "Interview prep", prompt: "I have a system design interview next week. How should I prepare in 5 days?" },
  { icon: Briefcase, label: "Job search strategy", prompt: "I've been job-hunting for 3 months with no offers. What am I probably doing wrong?" },
]

export function AdvisorChat() {
  const [threads, setThreads] = useState<Thread[] | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, startSend] = useTransition()
  const [loadingThread, setLoadingThread] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch("/api/chat/threads").then((r) => r.json()).then((d) => {
      setThreads(d.threads || [])
      if (d.threads?.length > 0) {
        openThread(d.threads[0].id)
      }
    }).catch(() => setThreads([]))
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const openThread = (id: string) => {
    setActiveThreadId(id)
    setLoadingThread(true)
    fetch(`/api/chat/threads/${id}`).then((r) => r.json()).then((d) => {
      setMessages(d.messages || [])
    }).finally(() => setLoadingThread(false))
  }

  const newThread = async () => {
    const res = await fetch("/api/chat/threads", { method: "POST" })
    const data = await res.json()
    setThreads((prev) => [{ id: data.thread.id, title: "New Conversation", updatedAt: new Date().toISOString(), messageCount: 0, preview: "" }, ...(prev || [])])
    openThread(data.thread.id)
    inputRef.current?.focus()
  }

  const deleteThread = async (id: string) => {
    setThreads((prev) => prev?.filter((t) => t.id !== id) || null)
    if (activeThreadId === id) {
      const next = threads?.find((t) => t.id !== id)
      if (next) openThread(next.id)
      else { setActiveThreadId(null); setMessages([]) }
    }
    fetch(`/api/chat/threads/${id}`, { method: "DELETE" })
  }

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    // Optimistic message
    setMessages((prev) => [...prev, { role: "user", content: trimmed, ts: new Date().toISOString() }])
    setInput("")
    startSend(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: activeThreadId, message: trimmed }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply, ts: new Date().toISOString() }])
        // Refresh threads list (titles may update)
        fetch("/api/chat/threads").then((r) => r.json()).then((d) => setThreads(d.threads || []))
      } catch {
        toast.error("Failed to send message")
        setMessages((prev) => prev.slice(0, -1)) // rollback
      }
    })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 h-[calc(100vh-4rem)]">
      <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-full">
        {/* Threads sidebar */}
        <Card className="p-3 flex flex-col max-h-full overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Conversations</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={newThread} aria-label="New chat">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {!threads ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
            ) : threads.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                No conversations yet.
                <Button variant="outline" size="sm" onClick={newThread} className="mt-2 gap-1 w-full">
                  <Plus className="h-3 w-3" /> Start one
                </Button>
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openThread(t.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg transition-colors group",
                    activeThreadId === t.id ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate flex-1">{t.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteThread(t.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {t.preview && <div className="text-xs text-muted-foreground truncate mt-0.5">{t.preview}</div>}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Chat panel */}
        <Card className="flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b border-border/60">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">AI Career Advisor</div>
              <div className="text-xs text-muted-foreground">Powered by z-ai · context-aware</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
              </span>
              Online
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingThread ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">How can I help your career today?</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  I'm your AI Career Advisor. I know your resume context and can help with pivots, interviews, negotiation, and more.
                </p>
                <div className="grid sm:grid-cols-2 gap-2 max-w-2xl w-full">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => send(s.prompt)}
                      className="flex items-start gap-2 text-left p-3 rounded-lg border border-border/60 hover:bg-accent/50 hover:border-primary/40 transition-colors"
                    >
                      <s.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{s.prompt}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={cn("flex gap-3 animate-in-up", m.role === "user" && "flex-row-reverse")}>
                  <div className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg shrink-0",
                    m.role === "user" ? "bg-accent text-accent-foreground" : "bg-gradient-to-br from-primary to-chart-2 text-primary-foreground"
                  )}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  )}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-foreground">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-3 animate-in-up">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl px-4 py-2.5 bg-muted">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/60 p-3">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask anything about your career…"
                className="min-h-[44px] max-h-32 resize-none"
                rows={1}
              />
              <Button onClick={() => send(input)} disabled={sending || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 px-1">
              Enter to send · Shift+Enter for newline
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
