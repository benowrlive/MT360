// Import data from a db-export-*.json file. Run: bun run db:import -- <file.json>
// Clears existing data first (so it's a full restore), then inserts.
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: bun run db:import -- <db-export-YYYY-MM-DD.json>");
    process.exit(1);
  }

  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`Importing from ${file} (exported ${dump._meta?.exportedAt ?? "?"})...`);

  // Clear existing data (order matters for foreign keys)
  await db.report.deleteMany();
  await db.progressRecord.deleteMany();
  await db.behaviourPlan.deleteMany();
  await db.therapySession.deleteMany();
  await db.goal.deleteMany();
  await db.assessment.deleteMany();
  await db.student.deleteMany();
  console.log("Cleared existing data.");

  // Insert (students first, then dependent entities)
  if (dump.students?.length) {
    for (const s of dump.students) {
      await db.student.create({ data: s });
    }
    console.log(`  ${dump.students.length} students`);
  }
  if (dump.assessments?.length) {
    for (const a of dump.assessments) await db.assessment.create({ data: a });
    console.log(`  ${dump.assessments.length} assessments`);
  }
  if (dump.goals?.length) {
    for (const g of dump.goals) await db.goal.create({ data: g });
    console.log(`  ${dump.goals.length} goals`);
  }
  if (dump.therapySessions?.length) {
    for (const t of dump.therapySessions) await db.therapySession.create({ data: t });
    console.log(`  ${dump.therapySessions.length} therapy sessions`);
  }
  if (dump.behaviourPlans?.length) {
    for (const b of dump.behaviourPlans) await db.behaviourPlan.create({ data: b });
    console.log(`  ${dump.behaviourPlans.length} behaviour plans`);
  }
  if (dump.progressRecords?.length) {
    for (const p of dump.progressRecords) await db.progressRecord.create({ data: p });
    console.log(`  ${dump.progressRecords.length} progress records`);
  }
  if (dump.reports?.length) {
    for (const r of dump.reports) await db.report.create({ data: r });
    console.log(`  ${dump.reports.length} reports`);
  }

  console.log("Import complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
