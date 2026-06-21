import { PrismaClient, Difficulty, QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with New Architecture...");

  // 1. Create Admin
  const hashedPassword = await bcrypt.hash("Dghs@123", 10);
  const admin = await prisma.admin.upsert({
    where: { email: "ame@mis.dghs.gov.bd" },
    update: { password: hashedPassword },
    create: {
      email: "ame@mis.dghs.gov.bd",
      password: hashedPassword,
      name: "Admin User",
    },
  });
  console.log("Admin seeded:", admin.email);

  // 2. Create Subjects
  const biology = await prisma.subject.upsert({
    where: { name: "General Biology" },
    update: {},
    create: { name: "General Biology", description: "Basic biological concepts and anatomy" }
  });

  const chemistry = await prisma.subject.upsert({
    where: { name: "Clinical Chemistry" },
    update: {},
    create: { name: "Clinical Chemistry", description: "Analytical chemistry in medical diagnostics" }
  });
  console.log("Subjects seeded.");

  // 3. Create Questions (Question Bank)
  const q1 = await prisma.question.create({
    data: {
      subjectId: biology.id,
      text: "What is the powerhouse of the cell?",
      type: QuestionType.SINGLE,
      options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
      correctAnswer: "Mitochondria",
      difficulty: Difficulty.EASY,
    }
  });

  const q2 = await prisma.question.create({
    data: {
      subjectId: biology.id,
      text: "Which of these are human organs?",
      type: QuestionType.MULTIPLE,
      options: ["Heart", "Leaf", "Lungs", "Branch"],
      correctAnswer: "Heart, Lungs", // Simple string matching logic used in API currently
      difficulty: Difficulty.EASY,
    }
  });

  const q3 = await prisma.question.create({
    data: {
      subjectId: chemistry.id,
      text: "What is the pH of pure water?",
      type: QuestionType.SINGLE,
      options: ["5", "7", "9", "12"],
      correctAnswer: "7",
      difficulty: Difficulty.MEDIUM,
    }
  });
  console.log("Question Bank seeded.");

  // 4. Create Quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: "Diagnostic Entrance Exam 2026",
      description: "Standard entrance assessment for medical technicians",
      durationMinutes: 30,
      isActive: true,
      examMode: true,
      subjects: {
        create: {
          subjectId: biology.id,
        }
      }
    }
  });

  // 5. Link Questions to Quiz
  await prisma.quizQuestion.createMany({
    data: [
      { quizId: quiz.id, questionId: q1.id, marks: 1, order: 1 },
      { quizId: quiz.id, questionId: q2.id, marks: 2, order: 2 },
    ]
  });
  console.log("Quiz structure seeded.");

  // 6. Create Batch
  const batch = await prisma.batch.create({
    data: {
      quizId: quiz.id,
      title: "Batch A - Morning Session",
      slug: "admission-batch-a-2026",
      isActive: true,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    }
  });
  console.log("Live Batch created:", batch.slug);

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
