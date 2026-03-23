"use client"
import { useState } from "react"
import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const REASONS = [
  { value: "wrong_answer", label: "Wrong answer key" },
  { value: "unclear", label: "Unclear or ambiguous question" },
  { value: "wrong_difficulty", label: "Incorrect difficulty rating" },
  { value: "not_ap_aligned", label: "Not aligned to AP curriculum" },
  { value: "other", label: "Other" }
]

export function ReportQuestionModal({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit() {
    if (!reason) return
    setLoading(true)
    try {
      const res = await fetch(`/api/questions/${questionId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details })
      })
      if (res.ok) {
        toast({ title: "Report submitted", description: "Thank you for helping improve our question bank." })
        setOpen(false)
        setReason("")
        setDetails("")
      } else {
        toast({ title: "Error", description: "Failed to submit report", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-7 px-2">
          <Flag className="h-3.5 w-3.5 mr-1" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Question</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {REASONS.map(r => (
              <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={e => setReason(e.target.value)} className="accent-blue-500" />
                <span className="text-sm">{r.label}</span>
              </label>
            ))}
          </div>
          <Textarea placeholder="Additional details (optional)" value={details} onChange={e => setDetails(e.target.value)} rows={3} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!reason || loading}>
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
