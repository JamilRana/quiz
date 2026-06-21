import { PrismaClient, QuestionType, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. Create the Subject
  const subject = await prisma.subject.upsert({
    where: { name: 'eVLMIS Logistics' },
    update: {},
    create: {
      name: 'eVLMIS Logistics',
      description: 'Vaccine Logistics Management Information System Training Quiz',
    },
  });

  // 2. Create the Quiz Template
  const quiz = await prisma.quiz.create({
    data: {
      title: 'eVLMIS Certification Quiz',
      description: 'Test your knowledge on vaccine logistics and system operations.',
      durationMinutes: 20,
      isActive: true,
      examMode: true,
      subjects: {
        create: { subjectId: subject.id },
      },
    },
  });

  // 3. Define Questions from PDF
  const questionsData = [
    {
      text: 'Expired সেকশনের Re-Indent বাটনের কাজ কী?',
      options: ['মেয়াদোত্তীর্ণ ভ্যাকসিন মুছা', 'নতুন ইনডেন্ট তৈরি করা'],
      correctAnswer: 'নতুন ইনডেন্ট তৈরি করা', // [cite: 7, 10]
    },
    {
      text: 'নতুন ইনডেন্ট তৈরি করতে প্রথমে কোনটি নির্বাচন করতে হয়?',
      options: ['Manufacturer', 'Product Category'],
      correctAnswer: 'Product Category', // [cite: 11, 14]
    },
    {
      text: 'Recall Request কে তৈরি করতে পারে?',
      options: ['Central Authority User', 'জেলা ব্যবহারকারী'],
      correctAnswer: 'Central Authority User', // [cite: 15, 18]
    },
    {
      text: 'Partial Accept Supply করার সময় কী দিতে হয়?',
      options: ['প্রাপ্ত পরিমাণ ও Reject Reason', 'প্রাপ্ত পরিমাণ ও missing items', 'উভয়ই'],
      correctAnswer: 'প্রাপ্ত পরিমাণ ও Reject Reason', // [cite: 25, 26]
    },
    {
      text: 'VVM Status Update করার সময় কোন তথ্যটি দিতে হয়?',
      options: ['Temperature, Indicator Serial No. & Time', 'Temperature, Indicator Serial No., Date & Time'],
      correctAnswer: 'Temperature, Indicator Serial No., Date & Time', // [cite: 34, 39]
    },
    {
      text: 'ট্র্যাকিং করতে কোন নম্বরটি দিতে হয়?',
      options: ['Indent Number', 'Transit Number'],
      correctAnswer: 'Transit Number', // [cite: 42, 47]
    },
    {
      text: 'ChatBot কোন ধরনের নির্দেশনা দিতে পারে?',
      options: ['Stock details', 'কিভাবে কাঙিক্ষত পেইজে যেতে হবে', 'Both'],
      correctAnswer: 'কিভাবে কাঙিক্ষত পেইজে যেতে হবে', // [cite: 48, 54]
    },
    {
      text: 'কখন partial receive করতে হয়?',
      options: ['Indent এর চেয়ে কম সংখ্যক Supply আসলে।', 'Supply এর চেয়ে কম সংখ্যক Items পেলে', 'উভয়'],
      correctAnswer: 'Supply এর চেয়ে কম সংখ্যক Items পেলে', // [cite: 55, 59]
    },
    {
      text: 'Transfer Indent-এর মাধ্যমে কোন কাজটি হয়?',
      options: ['জেলা- উপজেলা ট্রান্সফার', 'একই Parent-এর অধীন Child লোকেশনগুলোর মধ্যে ট্রান্সফার'],
      correctAnswer: 'একই Parent-এর অধীন Child লোকেশনগুলোর মধ্যে ট্রান্সফার', // [cite: 67, 69]
    },
    {
      text: 'Supply তৈরি করার সময় কোন তথ্যটি স্বয়ংক্রিয়ভাবে পূরণ হয়?',
      options: ['Supplier Location', 'Temperature log'],
      correctAnswer: 'Supplier Location', // [cite: 71, 75]
    },
  ];

  // 4. Insert Questions and Link to Quiz
  for (let i = 0; i < questionsData.length; i++) {
    const q = questionsData[i];
    const createdQuestion = await prisma.question.create({
      data: {
        subjectId: subject.id,
        text: q.text,
        type: QuestionType.SINGLE,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: Difficulty.MEDIUM,
        quizQuestions: {
          create: {
            quizId: quiz.id,
            order: i + 1,
            marks: 1, // [cite: 21, 24, 36, 50]
          },
        },
      },
    });
  }

  // 5. Create a Production Batch
  await prisma.batch.create({
    data: {
      quizId: quiz.id,
      title: 'March 2026 Training Batch',
      slug: 'evlmis-march-2026',
      isActive: true,
      ipLockEnabled: false,
      deviceLockEnabled: true,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });