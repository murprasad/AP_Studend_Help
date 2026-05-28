# C7 Phase 0 — Stripe webhook idempotency via StripeEvent log

**Status:** schema draft + design. Apply with `npx prisma db push` after pasting into `prisma/schema.prisma`.

The design audit (P1 #8) flagged that the Stripe webhook does N sequential awaits with no rollback — a `fastTrackPurchase.upsert` succeeds, then `user.update` fails, webhook returns 200 (catch swallows), Stripe doesn't retry, user has half-applied entitlement. Same for `moduleSubscription` upserts in a loop.

This Phase 0 ships the **idempotency-and-replay** primitive: every webhook hit writes a `StripeEvent` row FIRST with `status=received`, then runs the existing handler logic. If the handler partially fails, the row stays at `status=partial`. A separate reconciler cron re-processes any non-`status=complete` rows. The handler logic itself doesn't change yet — Phase 1+ is the migration to event-sourced projection. But Phase 0 unblocks observability.

## Add to `prisma/schema.prisma`

```prisma
enum StripeEventStatus {
  RECEIVED       // row just written, handler not started
  PROCESSING     // handler running
  COMPLETE       // handler finished successfully
  PARTIAL        // handler ran but failed mid-way; reconciler needs to inspect
  FAILED         // handler threw before any side effects
  DUPLICATE      // Stripe re-delivered an event we already have COMPLETE for
}

model StripeEvent {
  id          String              @id @default(cuid())
  /// Stripe's event id (evt_...). Unique → enables idempotent retry.
  stripeId    String              @unique
  type        String              // e.g. "checkout.session.completed"
  status      StripeEventStatus   @default(RECEIVED)
  payload     Json                // full event body for replay
  /// Comma-separated list of side effects already committed: "user_tier_set,fasttrack_upserted".
  appliedOps  String              @default("")
  errorDetail String?
  receivedAt  DateTime            @default(now())
  completedAt DateTime?
  updatedAt   DateTime            @updatedAt

  @@index([status, receivedAt])
  @@index([type, status])
  @@map("stripe_events")
}
```

## Webhook handler change (after schema applied)

In `src/app/api/webhooks/stripe/route.ts`, at the top of the POST handler:

```typescript
// 1. Check if we already have a COMPLETE row for this event id (Stripe retry).
const existing = await prisma.stripeEvent.findUnique({
  where: { stripeId: event.id },
  select: { status: true },
});
if (existing?.status === "COMPLETE") {
  // Already fully processed; Stripe is retrying. Idempotent ack.
  return NextResponse.json({ received: true, idempotent: true });
}

// 2. Write the audit row before any side effects.
await prisma.stripeEvent.upsert({
  where: { stripeId: event.id },
  create: {
    stripeId: event.id,
    type: event.type,
    payload: event as any,
    status: "PROCESSING",
  },
  update: { status: "PROCESSING" }, // retry attempt — flip back to PROCESSING
});

// 3. Existing handler logic — wrap each side effect in a try/track-applied-op block.
try {
  // ... existing per-event-type handler code ...
  await prisma.stripeEvent.update({
    where: { stripeId: event.id },
    data: { status: "COMPLETE", completedAt: new Date(), appliedOps: appliedOpsStr },
  });
  return NextResponse.json({ received: true });
} catch (err) {
  await prisma.stripeEvent.update({
    where: { stripeId: event.id },
    data: {
      status: appliedOpsStr ? "PARTIAL" : "FAILED",
      errorDetail: err instanceof Error ? err.message : String(err),
    },
  }).catch(() => {});
  // Re-throw to the outer catch which Sentry-captures + returns 200.
  throw err;
}
```

## Reconciler cron (Phase 1)

Add `/api/cron/stripe-event-reconcile` (~1 day to write + test):

```typescript
// Find rows stuck in PROCESSING > 5 min or PARTIAL > 0 min, retry their handlers.
const stuck = await prisma.stripeEvent.findMany({
  where: {
    OR: [
      { status: "PROCESSING", receivedAt: { lt: fiveMinAgo } },
      { status: "PARTIAL" },
      { status: "FAILED", receivedAt: { gt: oneHourAgo } }, // recent failures only — older = give up
    ],
  },
  take: 50,
  orderBy: { receivedAt: "asc" },
});
for (const row of stuck) {
  // Re-dispatch the webhook handler logic with the saved payload.
  // The handler is now idempotent (appliedOps tracks what's done).
  await retryWebhookHandler(row);
}
```

## After Phase 0 lands

| Question | Answer |
|---|---|
| Does this fix the ayu-missing-FastTrackPurchase case? | Partly — future grants will leave a stripe_events row. Past silent grants are not retroactively visible. |
| Does this slow down the webhook? | Adds 2 DB writes per event (upsert + update). On Neon HTTP that's ~50ms total. Stripe's tolerance is 30s. |
| Does this require redeploy? | Yes — after `prisma db push` for the schema + the handler code change. |

## Rollback

The migration is additive — drop the StripeEvent table to revert. Existing webhook handling continues to work unchanged.
