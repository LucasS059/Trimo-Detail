import { Pool } from "pg";

// Adicione esta linha para depurar o que está a ser lido:
console.log("🔗 DATABASE_URL ativa:", process.env.DATABASE_URL);

declare global {
  var _pgPool: Pool | undefined;
}

export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}