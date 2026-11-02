import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { parse } from "dotenv";

// The suite runs its own `next start` against a throwaway Postgres, never the
// shared Neon database. Locally scripts/e2e-db.mjs provides one; CI passes
// E2E_DATABASE_URL for its service container.
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgres://postgres:postgres@localhost:54329/template1?sslmode=disable";
if (!["localhost", "127.0.0.1"].includes(new URL(DATABASE_URL).hostname)) {
  throw new Error("E2E_DATABASE_URL must point at a local database");
}

// Only the Blob token is taken from .env.local, for the upload test.
const local = (() => {
  try {
    return parse(readFileSync(".env.local"));
  } catch {
    return {};
  }
})();
export const blobToken =
  process.env.BLOB_READ_WRITE_TOKEN ?? local.BLOB_READ_WRITE_TOKEN ?? "";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    ...(process.env.E2E_DATABASE_URL
      ? []
      : [
          {
            command: "node scripts/e2e-db.mjs",
            url: "http://localhost:54328",
            timeout: 120_000,
            stdout: "pipe" as const,
          },
        ]),
    {
      // Separate distDir so the build does not clobber a running `npm run dev`.
      command: `npx next build && npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      timeout: 300_000,
      env: {
        NEXT_DIST_DIR: ".next-e2e",
        POSTGRES_PRISMA_URL: DATABASE_URL,
        POSTGRES_URL_NON_POOLING: DATABASE_URL,
        DATABASE_URL,
        PG_POOL_MAX: "1",
        BLOB_READ_WRITE_TOKEN: blobToken,
        // Empty values beat .env.local and switch basic auth off.
        BASIC_AUTH_USER: "",
        BASIC_AUTH_PASSWORD: "",
      },
    },
  ],
});
