// Use the WASM-based Prisma client — works on Cloudflare Workers (WASM + HTTP adapter)
// and Node.js (via the patched #wasm-engine-loader that uses fs.readFileSync).
import { PrismaClient } from "@prisma/client/wasm";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon, neonConfig, types } from "@neondatabase/serverless";

// Use HTTP fetch transport — no WebSocket or native TCP needed.
neonConfig.poolQueryViaFetch = true;

// Return date/timestamp columns as raw strings so Prisma can parse them correctly.
// Without this, the Neon HTTP transport returns PostgreSQL timestamps as empty objects {}.
types.setTypeParser(types.builtins.DATE, (val: string) => val);
types.setTypeParser(types.builtins.TIME, (val: string) => val);
types.setTypeParser(types.builtins.TIMETZ, (val: string) => val);
types.setTypeParser(types.builtins.TIMESTAMP, (val: string) => val);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val: string) => val);

function createPrismaClient(): PrismaClient {
  const sql = neon(process.env.DATABASE_URL!);
  const adapter = new PrismaNeonHTTP(sql);
  return new PrismaClient({ adapter } as never);
}

// Lazy singleton — defer creation until first property access.
// This prevents the WASM engine from initializing during Next.js build-time
// static page generation, which would fail because the WASM module isn't
// available in the build environment.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return Reflect.get(getClient(), prop);
  },
  has(_, prop) {
    return Reflect.has(getClient(), prop);
  },
});
