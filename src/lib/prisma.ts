import { PrismaClient, Prisma } from "@prisma/client";

// ── Connection-failure detection ──────────────────────────────────────────────
// Prisma error codes that indicate the primary DB is unreachable.
const CONNECTION_ERROR_CODES = new Set([
  "P1000", // Authentication failed
  "P1001", // Can't reach database server
  "P1002", // Database server timeout
  "P1003", // Database does not exist
  "P1008", // Operations timed out
  "P1017", // Server closed the connection
  "P2024", // Connection pool timeout
]);

function isConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    CONNECTION_ERROR_CODES.has(err.code)
  )
    return true;
  return false;
}

// ── Client factory ────────────────────────────────────────────────────────────

function createClient(url?: string): PrismaClient {
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// ── Option 3: Automatic failover via Prisma extension ────────────────────────
// If a query on the primary DB fails with a connection error AND
// DATABASE_BACKUP_URL is configured, the same query is retried on the backup.
// Zero changes required in API routes — `prisma` is a drop-in replacement.

function buildResilientClient(): PrismaClient {
  const primary = createClient(process.env.DATABASE_URL);
  const backupUrl = process.env.DATABASE_BACKUP_URL;

  if (!backupUrl) {
    return primary; // No backup configured — plain client
  }

  const backup = createClient(backupUrl);

  return primary.$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        return (query(args) as Promise<unknown>).catch(async (err: unknown) => {
          if (!isConnectionError(err)) throw err;

          console.warn(
            `[DB] Primary unavailable: ${
              err instanceof Error ? err.message : String(err)
            } — retrying ${model}.${operation} on backup`
          );

          // Prisma model names are PascalCase ("User") but client delegates
          // are camelCase ("user") — convert here.
          if (!model) throw err;
          const delegateKey =
            model.charAt(0).toLowerCase() + model.slice(1);

          const delegate = (
            backup as unknown as Record<
              string,
              Record<string, (...a: unknown[]) => Promise<unknown>>
            >
          )[delegateKey];

          if (!delegate || typeof delegate[operation] !== "function") {
            throw err; // Can't map — re-throw original
          }

          return delegate[operation](args);
        });
      },
    },
  }) as unknown as PrismaClient;
}

// ── Singleton (reused across hot reloads in dev) ──────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? buildResilientClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** True when a standby database URL is configured. */
export const hasBackupDb = !!process.env.DATABASE_BACKUP_URL;
