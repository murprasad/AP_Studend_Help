"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCourse } from "@/hooks/use-course"
import { useToast } from "@/hooks/use-toast"
import {
  MessageSquare, Plus, ChevronLeft, Loader2,
  Users, Pin, Sparkles,
} from "lucide-react"

interface Thread {
  id: string
  title: string
  body: string
  isPinned: boolean
  createdAt: string
  user: { firstName: string; lastName: string }
  _count: { replies: number }
}

interface Reply {
  id: string
  body: string
  isAiTutor: boolean
  createdAt: string
  user: { firstName: string; lastName: string }
}

export default function CommunityPage() {
  const [course] = useCourse()
  const { toast } = useToast()
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewThread, setShowNewThread] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newBody, setNewBody] = useState("")
  const [replyBody, setReplyBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [aiTutorLoading, setAiTutorLoading] = useState(false)

  useEffect(() => {
    loadThreads()
  }, [course])

  async function loadThreads() {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/threads?course=${course}`)
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
      } else if (res.status === 401) {
        toast({ title: "Session expired", description: "Please refresh the page and log in again.", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadReplies(thread: Thread) {
    setSelectedThread(thread)
    const res = await fetch(`/api/community/threads/${thread.id}/replies`)
    if (res.ok) {
      const data = await res.json()
      setReplies(data.replies || [])
    }
  }

  async function createThread() {
    if (!newTitle.trim() || !newBody.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/community/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, title: newTitle, body: newBody }),
      })
      if (res.ok) {
        setNewTitle("")
        setNewBody("")
        setShowNewThread(false)
        toast({ title: "Thread created!" })
        loadThreads()
      } else {
        let errorMsg = "Something went wrong. Please try again."
        try {
          const data = await res.json()
          if (res.status === 401) errorMsg = "Session expired — please refresh the page and log in again."
          else if (res.status === 422) errorMsg = data.error || "Post blocked by moderation."
          else errorMsg = data.error || errorMsg
        } catch { /* non-JSON response */ }
        toast({ title: "Could not post thread", description: errorMsg, variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function createReply() {
    if (!selectedThread || !replyBody.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/community/threads/${selectedThread.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody }),
      })
      if (res.ok) {
        const data = await res.json()
        setReplies(prev => [...prev, data.reply])
        setReplyBody("")
      } else {
        let errorMsg = "Something went wrong. Please try again."
        try {
          const data = await res.json()
          if (res.status === 401) errorMsg = "Session expired — please refresh the page and log in again."
          else if (res.status === 422) errorMsg = data.error || "Reply blocked by moderation."
          else errorMsg = data.error || errorMsg
        } catch { /* non-JSON response */ }
        toast({ title: "Could not post reply", description: errorMsg, variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function askAiTutor() {
    if (!selectedThread) return
    setAiTutorLoading(true)
    try {
      const res = await fetch("/api/community/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: selectedThread.id }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.alreadyExists) {
          // AI reply already in list or needs to be appended
          const alreadyInList = replies.some(r => r.id === data.reply.id)
          if (!alreadyInList) setReplies(prev => [...prev, data.reply])
          toast({ title: "AI Tutor already answered this thread!" })
        } else {
          setReplies(prev => [...prev, data.reply])
          toast({ title: "AI Tutor replied!" })
        }
      } else {
        const debugInfo = data.debug ? ` [${JSON.stringify(data.debug)}]` : ""
        toast({
          title: "AI Tutor unavailable",
          description: (data.error || "Try again in a moment.") + debugInfo,
          variant: "destructive",
        })
      }
    } finally {
      setAiTutorLoading(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const hasAiReply = replies.some(r => r.isAiTutor)

  if (selectedThread) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedThread(null)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to threads
        </Button>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">{selectedThread.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedThread.user.firstName} {selectedThread.user.lastName} · {formatDate(selectedThread.createdAt)}
                </p>
              </div>
              {selectedThread.isPinned && (
                <Pin className="h-4 w-4 text-blue-500 flex-shrink-0 mt-1" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedThread.body}</p>
          </CardContent>
        </Card>

        {/* AI Peer Tutor button */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-blue-500/40 text-blue-500 hover:bg-blue-500/10"
            onClick={askAiTutor}
            disabled={aiTutorLoading || hasAiReply}
          >
            {aiTutorLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />}
            {hasAiReply ? "AI Tutor answered" : "Ask AI Tutor"}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </p>
          {replies.map(reply => (
            reply.isAiTutor ? (
              <Card key={reply.id} className="border-blue-500/40 bg-blue-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-500">AI Tutor</span>
                    <span className="text-xs text-muted-foreground ml-1">· {formatDate(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{reply.body}</p>
                </CardContent>
              </Card>
            ) : (
              <Card key={reply.id} className="border-border/40">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {reply.user.firstName} {reply.user.lastName} · {formatDate(reply.createdAt)}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{reply.body}</p>
                </CardContent>
              </Card>
            )
          ))}
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Add a reply</p>
            <Textarea
              placeholder="Share your thoughts..."
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              rows={3}
            />
            <Button onClick={createReply} disabled={!replyBody.trim() || submitting} size="sm">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Post Reply
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            Community
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Discuss AP, SAT, and ACT topics with fellow students</p>
        </div>
        <Button onClick={() => setShowNewThread(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Thread
        </Button>
      </div>

      {showNewThread && (
        <Card className="border-blue-500/30">
          <CardContent className="p-4 space-y-3">
            <p className="font-medium">New Discussion Thread</p>
            <Input
              placeholder="Thread title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              maxLength={200}
            />
            <Textarea
              placeholder="What would you like to discuss?"
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={createThread} disabled={!newTitle.trim() || !newBody.trim() || submitting} size="sm">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Post Thread
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNewThread(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : threads.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No threads yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to start a discussion!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => loadReplies(thread)}
              className="w-full text-left p-4 rounded-xl border border-border/40 bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.isPinned && <Pin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                    <p className="font-medium text-sm truncate">{thread.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{thread.body}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {thread.user.firstName} · {formatDate(thread.createdAt)}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {thread._count.replies}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
