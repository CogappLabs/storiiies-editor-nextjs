import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local for local development (Vercel CLI pulls env vars here)
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("POSTGRES_URL_NON_POOLING"),
  },
});
