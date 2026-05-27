/**
 * Web Push helper — server-side notification dispatch.
 *
 * Wraps the `web-push` npm lib. Reads VAPID keys from env:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT     (defaults to mailto:contact@studentnest.ai)
 *
 * Public-key endpoint at /api/push/vapid-public-key exposes the public key
 * to the browser for `pushManager.subscribe()`.
 *
 * Subscribe endpoint at /api/push/subscribe stores the browser-provided
 * subscription (endpoint + p256dh + auth) per-user.
 *
 * `sendPushToUser(userId, payload)` fans out to every subscription for that
 * user. Auto-cleans subscriptions that 404 (browser uninstalled / endpoint
 * expired) and 410 (subscription revoked).
 */

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:contact@studentnest.ai";

let configured = false;
function configure() {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

export function getPublicKey(): string | null {
  return PUBLIC_KEY ?? null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;       // path to open on click
  icon?: string;      // override icon
  tag?: string;       // collapse-key for replacing prior notifications
}

export interface PushResult {
  total: number;
  sent: number;
  cleanedDead: number;
  errors: number;
}

/**
 * Send a push to every subscription for the user. Returns counts.
 * Cleans up 404/410 subscriptions automatically.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  if (!configure()) return { total: 0, sent: 0, cleanedDead: 0, errors: 0 };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0, cleanedDead = 0, errors = 0;
  const body = JSON.stringify(payload);
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
        { TTL: 24 * 3600 },
      );
      sent++;
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});
    } catch (err) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Subscription is dead — delete it.
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        cleanedDead++;
      } else {
        errors++;
      }
    }
  }
  return { total: subs.length, sent, cleanedDead, errors };
}

/**
 * Persist a new subscription. Upserts by endpoint (one row per browser).
 */
export async function saveSubscription(
  userId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string,
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh, auth, userAgent: userAgent ?? null },
    update: { userId, p256dh, auth, userAgent: userAgent ?? null, updatedAt: new Date() },
  });
}
