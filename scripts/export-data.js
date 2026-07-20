// Export all data (students, assessments, goals, therapy, behaviour, progress,
// reports) as a single JSON file. Run: bun run db:export
// Produces db-export-YYYY-MM-DD.json in the project root.
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();

async function main() {
  const [
    students,
    assessments,
    goals,
    therapySessions,
    behaviourPlans,
    progressRecords,
    reports,
  ] = await Promise.all([
    db.student.findMany(),
    db.assessment.findMany(),
    db.goal.findMany(),
    db.therapySession.findMany(),
    db.behaviourPlan.findMany(),
    db.progressRecord.findMany(),
    db.report.findMany(),
  ]);

  const dump = {
    _meta: {
      app: "Mindful Therapy 360",
      exportedAt: new Date().toISOString(),
      version: 1,
      counts: {
        students: students.length,
        assessments: assessments.length,
        goals: goals.length,
        therapySessions: therapySessions.length,
        behaviourPlans: behaviourPlans.length,
        progressRecords: progressRecords.length,
        reports: reports.length,
      },
    },
    students,
    assessments,
    goals,
    therapySessions,
    behaviourPlans,
    progressRecords,
    reports,
  };

  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(process.cwd(), `db-export-${date}.json`);
  fs.writeFileSync(file, JSON.stringify(dump, null, 2));
  console.log(`Exported ${JSON.stringify(dump._meta.counts)} → ${file}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
