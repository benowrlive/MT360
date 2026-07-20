// Runs `prisma db push` only when DATABASE_URL looks like a real connection.
// Skips silently during Vercel build when the DB isn't configured yet (so the
// first deploy doesn't fail — the user sets up Postgres after first deploy).
import { execSync } from "node:child_process";

const dbUrl = process.env.DATABASE_URL || "";

if (!dbUrl || dbUrl.startsWith("file:")) {
  console.log("safe-db-push: skipping (DATABASE_URL is local SQLite or not set)");
  process.exit(0);
}

try {
  console.log("safe-db-push: running prisma db push...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  console.log("safe-db-push: done");
} catch (e) {
  console.warn("safe-db-push: failed (continuing build anyway):", e.message);
  // Don't fail the build — the app can still start and show a DB error page
  // which the user can debug. Failing the build hides the real error.
}
