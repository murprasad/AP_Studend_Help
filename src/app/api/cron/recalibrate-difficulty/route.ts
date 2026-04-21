/**
 * GET /api/cron/recalibrate-difficulty
 *
 * Dynamic difficulty recalibration (Batch 5 task #61). For each Question
 * with enough responses to be statistically meaningful (timesAnswered >= N),
 * recompute `difficulty` from the actual student accuracy band. The AI-
 * labeled difficulty is a guess at generation time; real student performance
 * is the authoritative signal.
 *
 *   accuracy >= 75%  → EASY
 *   accuracy 40-75%  → MEDIUM
 *   accuracy <  40%  → HARD
 *
 * Bearer-auth via CRON_SECRET. Safe to re-run — updates only when the
 * computed bucket differs from the stored `difficulty`.
 *
 * ?dry=1 — return counts without applying changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MIN_RESPONSES = 50;
const EASY_THRESHOLD = 75;
const HARD_THRESHOLD = 40;

function bandForAccuracy(accPct: number): "EASY" | "MEDIUM" | "HARD" {
  if (accPct >= EASY_THRESHOLD) return "EASY";
  if (accPct < HARD_THRESHOLD) return "HARD";
  return "MEDIUM";
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = new URL(req.url).searchParams.get("dry") === "1";

  // Only questions with enough data to matter. Take in batches to keep
  // memory bounded — Cloudflare Workers has strict limits on heap size.
  const PAGE = 1000;
  let cursor: string | undefined = undefined;
  let scanned = 0;
  let changed = 0;
  const deltas: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };

  type Row = { id: string; timesAnswered: number; timesCorrect: number; difficulty: string };
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows: Row[] = await prisma.question.findMany({
      where: { timesAnswered: { gte: MIN_RESPONSES } },
      select: { id: true, timesAnswered: true, timesCorrect: true, difficulty: true },
      orderBy: { id: "asc" },
      take: PAGE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (rows.length === 0) break;
    scanned += rows.length;
    cursor = rows[rows.length - 1].id;

    for (const q of rows) {
      const acc = q.timesAnswered > 0 ? (100 * q.timesCorrect) / q.timesAnswered : 0;
      const newBand = bandForAccuracy(acc);
      if (newBand !== q.difficulty) {
        changed++;
        deltas[newBand]++;
        if (!dry) {
          await prisma.question.update({
            where: { id: q.id },
            data: { difficulty: newBand },
          });
        }
      }
    }
    if (rows.length < PAGE) break;
  }

  return NextResponse.json({
    scanned,
    changed,
    deltas,
    thresholds: { MIN_RESPONSES, EASY: `>= ${EASY_THRESHOLD}%`, HARD: `< ${HARD_THRESHOLD}%` },
    dryRun: dry,
  });
}
