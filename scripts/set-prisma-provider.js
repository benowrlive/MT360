// One-off build-time script: switches the Prisma datasource provider
// to match the DATABASE_URL scheme (sqlite for local, postgresql for Vercel).
// Runs before `prisma generate` so the generated client matches the deploy target.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const dbUrl = process.env.DATABASE_URL || "";

// Detect provider from the URL scheme.
let provider = "sqlite";
if (dbUrl.startsWith("postgres")) {
  provider = "postgresql";
}

let schema = fs.readFileSync(schemaPath, "utf8");

// Replace the provider line in the datasource block.
const before = schema;
schema = schema.replace(
  /(datasource db\s*{[\s\S]*?provider\s*=\s*")[^"]*(")/m,
  `$1${provider}$2`,
);

if (schema === before) {
  console.log(`prisma provider: already ${provider}`);
} else {
  fs.writeFileSync(schemaPath, schema);
  console.log(`prisma provider: set to ${provider} (from DATABASE_URL)`);
}
