// Prisma client factory using the Neon HTTP transport instead of native TCP.
//
// Our production runtime (CF Workers) uses this same path. Local Node
// scripts historically used the default TCP driver, which intermittently
// fails from machines behind corporate firewalls / WSL networking while
// HTTP works fine. Using the HTTP adapter from the scripts means they
// always share behavior with prod — no more "works in prod, dead locally"
// surprises.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon, neonConfig, types } from "@neondatabase/serverless";

neonConfig.poolQueryViaFetch = true;

// Return timestamp/date columns as raw strings so Prisma can parse them.
// Without these, the HTTP transport returns {} for DateTime fields which
// Prisma then fails to convert ("expected a string in column ..., found {}").
types.setTypeParser(types.builtins.DATE, (val) => val);
types.setTypeParser(types.builtins.TIME, (val) => val);
types.setTypeParser(types.builtins.TIMETZ, (val) => val);
types.setTypeParser(types.builtins.TIMESTAMP, (val) => val);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val) => val);

export function makePrisma() {
  const sql = neon(process.env.DATABASE_URL);
  const adapter = new PrismaNeonHTTP(sql);
  return new PrismaClient({ adapter });
}
