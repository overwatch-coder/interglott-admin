import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function migrationDatabaseUrl() {
  const url = new URL(process.env.DIRECT_URL ?? env("DATABASE_URL"));

  // Prisma Postgres needs the direct host for CLI operations that use
  // session-level advisory locks. Runtime queries still use DATABASE_URL.
  if (!process.env.DIRECT_URL && url.hostname === "pooled.db.prisma.io") {
    url.hostname = "db.prisma.io";
  }

  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: migrationDatabaseUrl() },
});
