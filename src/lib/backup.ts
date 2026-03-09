/**
 * Shared backup logic — imported by both:
 *   netlify/functions/backup-*.ts  (scheduled runs)
 *   src/app/api/admin/backup/route.ts  (manual triggers)
 */

import { getStore } from "@netlify/blobs";
import { Client } from "pg";

const NEON_API = "https://console.neon.tech/api/v2";
const BLOB_STORE = "db-backups";
const RETENTION_DAYS = 7;

// ── Helpers ───────────────────────────────────────────────────────────────────

function retentionCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  return d;
}

// ── Option 1: Neon Branch Snapshot ───────────────────────────────────────────

interface NeonBranch {
  id: string;
  name: string;
  created_at: string;
  primary: boolean;
}

async function neonFetch(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) throw new Error("NEON_API_KEY not configured");

  const res = await fetch(`${NEON_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neon API ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json();
}

export async function createNeonBranch(): Promise<{
  branchId: string;
  branchName: string;
  deleted: string[];
}> {
  const projectId = process.env.NEON_PROJECT_ID;
  if (!projectId) throw new Error("NEON_PROJECT_ID not configured");

  const today = new Date().toISOString().split("T")[0];
  const branchName = `backup-${today}`;

  const created = (await neonFetch(
    "POST",
    `/projects/${projectId}/branches`,
    { branch: { name: branchName } }
  )) as { branch: NeonBranch };

  console.log(`[Backup/Neon] Created branch: ${branchName} (${created.branch.id})`);

  // Prune branches older than RETENTION_DAYS
  const list = (await neonFetch(
    "GET",
    `/projects/${projectId}/branches`
  )) as { branches: NeonBranch[] };

  const cutoff = retentionCutoff();
  const deleted: string[] = [];

  for (const branch of list.branches) {
    if (
      !branch.primary &&
      branch.name.startsWith("backup-") &&
      new Date(branch.created_at) < cutoff
    ) {
      await neonFetch("DELETE", `/projects/${projectId}/branches/${branch.id}`);
      deleted.push(branch.name);
      console.log(`[Backup/Neon] Pruned: ${branch.name}`);
    }
  }

  return { branchId: created.branch.id, branchName, deleted };
}

// ── Option 2: JSON Data Export to Netlify Blobs ───────────────────────────────

// Tables exported — excludes ephemeral sessions/tokens
const EXPORT_QUERIES: Record<string, string> = {
  users:
    "SELECT id, name, email, role, level, xp, streak, created_at FROM users",
  questions:
    "SELECT id, unit, topic, subtopic, difficulty, question_type, question_text, stimulus, options, correct_answer, explanation, course, is_approved, is_ai_generated, created_at FROM questions",
  achievements:
    "SELECT id, name, description, icon, xp_reward, condition_type, condition_value FROM achievements",
  user_achievements:
    "SELECT id, user_id, achievement_id, earned_at FROM user_achievements",
  mastery_scores:
    "SELECT id, user_id, unit, course, mastery_score, accuracy, total_attempts, correct_attempts, last_practiced FROM mastery_scores",
  study_plans:
    "SELECT id, user_id, course, plan_data, is_active, generated_at FROM study_plans",
};

export async function runDataExport(): Promise<{
  key: string;
  tables: Record<string, number>;
  deletedKeys: string[];
  sizeKb: number;
}> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not configured");

  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();

  const snapshot: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  try {
    for (const [table, sql] of Object.entries(EXPORT_QUERIES)) {
      const res = await pg.query(sql);
      snapshot[table] = res.rows;
      counts[table] = res.rowCount ?? res.rows.length;
    }
  } finally {
    await pg.end();
  }

  const today = new Date().toISOString().split("T")[0];
  const key = `backup-${today}.json`;
  const payload = JSON.stringify(
    { exportedAt: new Date().toISOString(), tables: snapshot },
    null,
    2
  );

  const store = getStore(BLOB_STORE);
  await store.set(key, payload);
  const sizeKb = Math.round(payload.length / 1024);
  console.log(`[Backup/Export] Saved ${key} (${sizeKb} KB)`);

  // Prune old exports — date is encoded in the key
  const { blobs } = await store.list({ prefix: "backup-" });
  const cutoff = retentionCutoff();
  const deletedKeys: string[] = [];

  for (const blob of blobs) {
    const match = blob.key.match(/backup-(\d{4}-\d{2}-\d{2})\.json/);
    if (match && new Date(match[1]) < cutoff) {
      await store.delete(blob.key);
      deletedKeys.push(blob.key);
      console.log(`[Backup/Export] Pruned: ${blob.key}`);
    }
  }

  return { key, tables: counts, deletedKeys, sizeKb };
}

// ── Status query ──────────────────────────────────────────────────────────────

export interface BackupStatus {
  config: {
    neonBranchEnabled: boolean;
    exportEnabled: boolean;
    standbyDbEnabled: boolean;
  };
  schedule: { neonBranch: string; dataExport: string };
  recentExports: { key: string; date: string }[];
}

export async function getBackupStatus(): Promise<BackupStatus> {
  let recentExports: { key: string; date: string }[] = [];

  try {
    const store = getStore(BLOB_STORE);
    const { blobs } = await store.list({ prefix: "backup-" });
    recentExports = blobs
      .map((b) => ({
        key: b.key,
        date: b.key.replace("backup-", "").replace(".json", ""),
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  } catch {
    // Blobs unavailable in local dev without NETLIFY_SITE_ID
  }

  return {
    config: {
      neonBranchEnabled: !!(
        process.env.NEON_API_KEY && process.env.NEON_PROJECT_ID
      ),
      exportEnabled: !!process.env.DATABASE_URL,
      standbyDbEnabled: !!process.env.DATABASE_BACKUP_URL,
    },
    schedule: {
      neonBranch: "Daily at 02:00 UTC",
      dataExport: "Daily at 03:00 UTC",
    },
    recentExports,
  };
}

export async function downloadExport(date: string): Promise<string | null> {
  const store = getStore(BLOB_STORE);
  const key = `backup-${date}.json`;
  return store.get(key, { type: "text" });
}
