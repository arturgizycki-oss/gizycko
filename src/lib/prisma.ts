import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * How many connections the pool may open. The local `prisma dev` server is
 * happiest with one; real Postgres has no such limit, so the default is 10.
 */
function poolMax() {
  const configured = Number(process.env.DATABASE_POOL_MAX);
  return Number.isFinite(configured) && configured > 0 ? configured : 10;
}

/**
 * A connection the server closed while it sat idle in the pool.
 *
 * The local development server drops idle connections, and node-postgres hands
 * the dead one back out on the next query. Prisma reports P1017, or the driver
 * says the connection was terminated. Because it only bites after a pause, it
 * reads as the database randomly dying mid-session.
 */
function isDeadConnection(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string })?.code;

  return (
    code === "P1017" ||
    /Server has closed the connection/i.test(message) ||
    /Connection terminated/i.test(message) ||
    /ConnectionClosed/i.test(message)
  );
}

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: poolMax(),
    connectionTimeoutMillis: 10_000,
  });

  /*
   * An error on an *idle* client is emitted on the pool. With no listener it is
   * an unhandled 'error' event, which takes the whole process down rather than
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

  return new PrismaClient({ adapter: new PrismaPg(pool) }).$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (!isDeadConnection(error)) throw error;

          /*
           * The connection died before the statement reached the server, so
           * nothing ran and one retry on a fresh connection is safe. Once only:
           * a second failure is a real problem and should surface.
           */
          return await query(args);
        }
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
  pool: Pool | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
