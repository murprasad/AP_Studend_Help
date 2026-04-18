/**
 * Daily Quiz Email — attribution endpoint.
 *
 * GET /api/daily-quiz-track?t=<emailToken>&event=open|answer
 *
 *   event=open    — fired by the 1x1 tracking pixel in the email body.
 *                   Records openedAt once; returns a transparent GIF.
 *
 *   event=answer  — fired by the practice page when the user actually
 *                   submits an answer to one of the three deep-linked
 *                   questions. Records answeredAt once; returns JSON.
 *
 * Idempotent — repeat hits do not overwrite timestamps once set. No auth:
 * tokens are random UUIDs so they aren't trivially guessable, and there
 * is no sensitive data returned or mutated beyond the two timestamps.
 *
 * MVP note: the practice page is NOT yet wired to call this endpoint on
 * submit. That's intentional per the spec — ship the data collection and
 * pixel now, hook the practice page in a follow-up.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Smallest legal transparent GIF (base64). We return this regardless of
// whether the token resolved, because email clients retry 4xx pixels and
// we don't want to leak token existence via status code.
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

function gifResponse(): Response {
  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");
  const event = req.nextUrl.searchParams.get("event");

  if (!token || (event !== "open" && event !== "answer")) {
    // Still return a GIF for malformed opens so broken email clients
    // don't throw loud console errors at the user.
    return event === "answer"
      ? NextResponse.json({ error: "bad request" }, { status: 400 })
      : gifResponse();
  }

  // Resolve the send row. emailToken is @unique in the schema so one
  // lookup is enough.
  const send = await prisma.dailyQuizSend.findUnique({
    where: { emailToken: token },
    select: { id: true, openedAt: true, answeredAt: true },
  });

  if (!send) {
    return event === "answer"
      ? NextResponse.json({ error: "unknown token" }, { status: 404 })
      : gifResponse();
  }

  try {
    if (event === "open" && !send.openedAt) {
      await prisma.dailyQuizSend.update({
        where: { id: send.id },
        data: { openedAt: new Date() },
      });
    } else if (event === "answer" && !send.answeredAt) {
      await prisma.dailyQuizSend.update({
        where: { id: send.id },
        data: { answeredAt: new Date() },
      });
    }
  } catch {
    // Swallow — analytics should never break the email client or the
    // practice page. We'll notice missing data via Resend dashboards.
  }

  if (event === "open") return gifResponse();
  return NextResponse.json({ ok: true });
}
