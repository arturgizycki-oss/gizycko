import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Configuration for the Prisma CLI: migrations, introspection, studio.
 *
 * The running application does not read this. It builds its own client from
 * DATABASE_URL in src/lib/prisma.ts.
 *
 * Those two want different connections in production. The application wants the
 * pooler, because a serverless function opens a connection per request and
 * Postgres runs out of them quickly. Migrations want a direct connection: they
 * take advisory locks and run DDL, neither of which survives a transaction
 * pooler. Hence DIRECT_URL, falling back to DATABASE_URL when there is only one
 * database to talk to - which is every local setup.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
