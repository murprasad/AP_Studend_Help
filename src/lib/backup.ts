/**
 * Shared backup logic — imported by:
 *   src/app/api/admin/backup/route.ts  (manual triggers)
 *
 * Neon branch snapshots: fully supported via Neon API.
 * JSON data export: not available (was Netlify Blobs — removed when migrated to CF Pages).
 */

const NEON_API = "https://console.neon.tech/api/v2";
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

// ── Option 2: JSON Data Export (not available — was Netlify Blobs) ────────────

export async function runDataExport(): Promise<never> {
  throw new Error("JSON data export is not available on Cloudflare Pages. Use Neon branch snapshots instead.");
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
  return {
    config: {
      neonBranchEnabled: !!(
        process.env.NEON_API_KEY && process.env.NEON_PROJECT_ID
      ),
      exportEnabled: false,
      standbyDbEnabled: !!process.env.DATABASE_BACKUP_URL,
    },
    schedule: {
      neonBranch: "Manual trigger only (CF Pages)",
      dataExport: "Not available (CF Pages)",
    },
    recentExports: [],
  };
}

export async function downloadExport(_date: string): Promise<string | null> {
  return null;
}
