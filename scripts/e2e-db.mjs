// Throwaway Postgres for the e2e suite: PGlite via @prisma/dev, schema pushed,
// then a /ready endpoint so Playwright knows when to start the app server.
// Stateless, so every run starts from an empty database.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { startPrismaDevServer } from "@prisma/dev";

const DB_PORT = 54329;
const READY_PORT = 54328;

console.log("Starting local Postgres (PGlite)…");
const server = await startPrismaDevServer({
  name: "storiiies-e2e",
  persistenceMode: "stateless",
  databasePort: DB_PORT,
  port: 54330,
  shadowDatabasePort: 54331,
  streamsPort: 54332,
});
const url = server.database.connectionString;

console.log("Pushing Prisma schema…");
// Async: PGlite serves connections from this process's event loop.
const status = await new Promise((resolve) =>
  spawn("npx", ["prisma", "db", "push"], {
    stdio: "inherit",
    env: { ...process.env, POSTGRES_URL_NON_POOLING: url },
  }).on("exit", resolve),
);
if (status !== 0) {
  await server.close();
  process.exit(status ?? 1);
}

createServer((_req, res) => res.end("ok")).listen(READY_PORT, () =>
  console.log(`Test database ready on port ${DB_PORT}`),
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await server.close();
    process.exit(0);
  });
}
