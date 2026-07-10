// Seed Mindful Therapy 360 with realistic sample data
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const students = [
  {
    name: "Aarav Sharma",
    dob: "2016-03-14T00:00:00.000Z",
    grade: "Grade 2",
    gender: "Male",
    school: "Greenwood International School",
    parentName: "Priya Sharma",
    parentEmail: "priya.sharma@example.com",
    parentPhone: "+91 98765 43210",
    diagnosis: ["Autism Spectrum Disorder (ASD)", "Speech and Language Delay"],
    languages: "English, Hindi",
    medicalConditions: "None",
    allergies: "Peanuts",
    currentTherapies: "Speech Therapy, Occupational Therapy, ABA",
    medications: "Melatonin (sleep)",
    strengths: "Strong visual memory, excellent with puzzles, enjoys routines",
    interests: "Trains, dinosaurs, drawing, sorting objects by color",
    learningStyle: "Visual",
    curriculum: "IB",
    avatarColor: "#0d9488",
  },
  {
    name: "Sophia Chen",
    dob: "2014-09-22T00:00:00.000Z",
    grade: "Grade 4",
    gender: "Female",
    school: "Riverside Academy",
    parentName: "Mei Chen",
    parentEmail: "mei.chen@example.com",
    parentPhone: "+91 99876 11223",
    diagnosis: ["Dyslexia", "ADHD"],
    languages: "English, Mandarin",
    medicalConditions: "None",
    allergies: "None",
    currentTherapies: "Special Education, Counselling",
    medications: "Methylphenidate",
    strengths: "Creative storytelling, strong verbal reasoning, artistic",
    interests: "Art, animals, swimming, audiobooks",
    learningStyle: "Auditory",
    curriculum: "Cambridge",
    avatarColor: "#db2777",
  },
  {
    name: "Liam OConnor",
    dob: "2018-01-05T00:00:00.000Z",
    grade: "Kindergarten",
    gender: "Male",
    school: "Sunrise Inclusive School",
    parentName: "Sarah OConnor",
    parentEmail: "sarah.o@example.com",
    parentPhone: "+91 90011 22334",
    diagnosis: ["Down Syndrome", "Global Developmental Delay"],
    languages: "English",
    medicalConditions: "Hypothyroidism",
    allergies: "None",
    currentTherapies: "Speech Therapy, Occupational Therapy, Physiotherapy",
    medications: "Levothyroxine",
    strengths: "Social, affectionate, loves music and dancing",
    interests: "Music, bubbles, peer play, picture books",
    learningStyle: "Multisensory",
    curriculum: "American Curriculum",
    avatarColor: "#ca8a04",
  },
  {
    name: "Ananya Reddy",
    dob: "2013-07-19T00:00:00.000Z",
    grade: "Grade 6",
    gender: "Female",
    school: "Delhi Public School",
    parentName: "Kavya Reddy",
    parentEmail: "kavya.r@example.com",
    parentPhone: "+91 90123 45678",
    diagnosis: ["Dyscalculia", "Dysgraphia"],
    languages: "English, Telugu",
    medicalConditions: "None",
    allergies: "Lactose intolerant",
    currentTherapies: "Special Education",
    medications: "None",
    strengths: "Excellent reading comprehension, verbal fluency, curious",
    interests: "Reading, chess, debate, astronomy",
    learningStyle: "Reading/Writing",
    curriculum: "CBSE",
    avatarColor: "#7c3aed",
  },
  {
    name: "Ethan Williams",
    dob: "2015-11-30T00:00:00.000Z",
    grade: "Grade 3",
    gender: "Male",
    school: "Greenwood International School",
    parentName: "Mark Williams",
    parentEmail: "mark.w@example.com",
    parentPhone: "+91 98330 55667",
    diagnosis: ["ADHD", "Emotional Behaviour Disorder"],
    languages: "English",
    medicalConditions: "None",
    allergies: "None",
    currentTherapies: "Behaviour Therapy, Counselling",
    medications: "Atomoxetine",
    strengths: "High energy, creative, strong leadership in group play",
    interests: "Football, building blocks, science experiments",
    learningStyle: "Kinesthetic",
    curriculum: "IB",
    avatarColor: "#0891b2",
  },
];

async function main() {
  console.log("Seeding Mindful Therapy 360...");
  // clean
  await db.report.deleteMany();
  await db.progressRecord.deleteMany();
  await db.behaviourPlan.deleteMany();
  await db.therapySession.deleteMany();
  await db.goal.deleteMany();
  await db.assessment.deleteMany();
  await db.student.deleteMany();

  for (const s of students) {
    const student = await db.student.create({
      data: { ...s, diagnosis: JSON.stringify(s.diagnosis) },
    });

    // sample assessment
    await db.assessment.create({
      data: {
        studentId: student.id,
        type: "psychological",
        title: "Initial Psychological Assessment",
        uploadedBy: "Dr. Anjali Mehta, Clinical Psychologist",
        rawContent: `${student.name} was assessed for cognitive, adaptive and behavioural functioning. ${student.name} demonstrates relative strengths in ${student.strengths}. Areas of need include attention regulation, social communication and academic readiness. Recommended supports include structured environment, visual schedules, and small-group instruction.`,
      },
    });

    // sample goals (3 per student)
    const goalDomains = [
      "Communication - Language",
      "Social Skills",
      "Academic - Reading",
    ];
    for (const domain of goalDomains) {
      const created = await db.goal.create({
        data: {
          studentId: student.id,
          domain,
          annualGoal: `By the end of the IEP cycle, ${student.name} will improve ${domain.toLowerCase()} skills aligned with the ${student.curriculum} curriculum.`,
          baseline: `${student.name} currently demonstrates emerging skills in ${domain.toLowerCase()} with adult support.`,
          objective: `Given structured practice, ${student.name} will achieve target skill with 80% accuracy across 3 consecutive sessions.`,
          teachingStrategy: "Direct instruction, modelling, guided practice, visual supports.",
          accommodation: "Extended time, frequent breaks, simplified instructions.",
          modification: "Reduced task complexity, chunked activities.",
          resources: "Visual schedule, task cards, manipulatives.",
          measurementMethod: "Weekly data collection, work samples, observation.",
          progressIndicators: "80% accuracy across 3 sessions, generalisation across settings.",
          responsibleProfessional: "Special Educator + Therapist",
          reviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
          status: "active",
          progress: Math.floor(Math.random() * 60) + 20,
        },
      });

      // progress records for the goal
      for (let w = 5; w >= 0; w--) {
        await db.progressRecord.create({
          data: {
            studentId: student.id,
            goalId: created.id,
            date: new Date(Date.now() - w * 7 * 86400000),
            rating: Math.min(5, 1 + Math.floor((5 - w) / 1.5) + (Math.random() > 0.6 ? 1 : 0)),
            note: w === 0 ? "Strong session, met objective." : "On track with prompts.",
            recordedBy: "Special Educator",
            domain,
          },
        });
      }
    }
  }

  const count = await db.student.count();
  console.log(`Seeded ${count} students with assessments, goals and progress records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
