"use client";

/**
 * Pass Ready Cert — shareable artifact when passProbability ≥ 0.75 or
 * user-reported real exam pass.
 *
 * Renders a card with the user's predicted pass band + course + study days.
 * Download as PNG + share via OS share sheet. Marketing wins fall out of
 * users sharing these voluntarily — the proudest moment becomes our ad.
 *
 * Behind NEXT_PUBLIC_PASS_PROB_ENGINE; rendered on dashboard ONLY when:
 *   - data.passProbability >= 0.75
 *   - data.sampleSize >= 30 (enough confidence)
 */

import { useState } from "react";
import { Trophy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  studentName: string;
  course: string;
  courseDisplayName: string;
  predictedPassPercent: number;
  studyDays: number;
  sessionsCount: number;
}

export function PassReadyCert({
  studentName,
  course,
  courseDisplayName,
  predictedPassPercent,
  studyDays,
  sessionsCount,
}: Props) {
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  async function handleShare() {
    const text = `I'm at ${predictedPassPercent}% readiness on ${courseDisplayName} after ${studyDays} days on StudentNest!`;
    const url = "https://studentnest.ai";
    if (navigator.share) {
      try {
        await navigator.share({ title: "StudentNest — Exam Ready", text, url });
        setShareNotice("Shared!");
      } catch { setShareNotice("Share canceled."); }
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareNotice("Copied to clipboard");
    }
    setTimeout(() => setShareNotice(null), 3000);
  }

  function handleDownload() {
    // v1: open a window with the cert printable. Future: html2canvas → PNG.
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
      <head><title>StudentNest Exam Ready — ${studentName}</title></head>
      <body style="font-family: -apple-system, system-ui, sans-serif; padding: 40px; background: #fafaf9;">
        <div style="max-width: 600px; margin: 0 auto; padding: 48px; border: 2px solid #10b981; border-radius: 24px; background: linear-gradient(135deg, rgba(16,185,129,0.05), rgba(245,158,11,0.05));">
          <div style="text-align: center;">
            <div style="font-size: 64px; line-height: 1;">🪺</div>
            <h1 style="font-size: 24px; font-weight: 700; margin: 16px 0 8px;">StudentNest — Exam Ready</h1>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">${courseDisplayName}</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid rgba(0,0,0,0.1);" />
            <p style="font-size: 18px; margin: 0 0 8px;">${studentName}</p>
            <p style="font-size: 72px; font-weight: 700; color: #047857; margin: 8px 0; line-height: 1;">${predictedPassPercent}%</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">readiness on</p>
            <p style="font-size: 14px;">Studied ${studyDays} days · ${sessionsCount} practice sets</p>
            <hr style="margin: 32px 0 16px; border: none; border-top: 1px solid rgba(0,0,0,0.1);" />
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">studentnest.ai · Predicted pass probability is calibrated to ${course.startsWith("CLEP_") ? "College Board CLEP" : course.startsWith("DSST_") ? "Prometric DSST" : "exam"} scoring</p>
          </div>
        </div>
        <p style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">Right-click and "Save as image" or print to PDF.</p>
      </body></html>
    `);
    w.document.close();
  }

  return (
    <div
      className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-blue-500/5 p-5"
      data-testid="pass-ready-cert"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Trophy className="h-6 w-6 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold leading-tight">You&apos;re pass-ready.</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {predictedPassPercent}% predicted on {courseDisplayName} · {studyDays}d studying
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleShare} size="sm" variant="default" data-testid="pass-cert-share">
          <Share2 className="h-4 w-4 mr-1.5" />Share
        </Button>
        <Button onClick={handleDownload} size="sm" variant="outline" data-testid="pass-cert-download">
          <Download className="h-4 w-4 mr-1.5" />Download
        </Button>
        {shareNotice && (
          <span className="text-xs text-muted-foreground self-center ml-1">{shareNotice}</span>
        )}
      </div>
    </div>
  );
}
