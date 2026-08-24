import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    /*
     * The local `prisma dev` server closes connections it considers idle. If
     * node-postgres hands one of those back out, the next query fails with
     * "Connection terminated unexpectedly" on whichever page happened to run
     * — it looks like a random 500. Retiring idle connections quickly means we
     * open a fresh one instead of reusing a dead one.
     */
    idleTimeoutMillis: 1_000,
    connectionTimeoutMillis: 10_000,
  });

  /*
   * An error on an *idle* client is emitted on the pool. With no listener it is
   * an unhandled 'error' event, which takes the whole server down rather than
   * failing one request.
   */
  pool.on("error", (error) => {
    console.error("[db] idle client error:", error.message);
  });

  return pool;
}

function createPrismaClient() {
  const pool = globalForPrisma.pool ?? createPool();
  if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
