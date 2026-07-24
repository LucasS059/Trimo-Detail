// lib/db/client.ts
import { Pool } from "pg";

declare global {
  // evita criar múltiplos Pools em hot-reload durante o desenvolvimento
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}
