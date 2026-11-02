import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

// pg warns that sslmode=require will change meaning; verify-full is what it
// means today. Other modes (e.g. disable for local Postgres) are left alone.
const url = connectionString ? new URL(connectionString) : undefined;
if (url?.searchParams.get("sslmode") === "require") {
  url.searchParams.set("sslmode", "verify-full");
}

const adapter = new PrismaPg({
  connectionString: url?.toString() ?? connectionString,
  // The e2e database (PGlite) shares one backend across connections, so
  // concurrent queries interleave; the suite sets this to 1.
  max: process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : undefined,
});

// Cached on globalThis in every environment: route handlers and pages are
// separate bundles, and each would otherwise open its own pool.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
globalForPrisma.prisma = prisma;
