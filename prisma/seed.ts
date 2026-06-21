import { PrismaClient, QuestionType, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Expanded eVLMIS Seeding...');

  const subject = await prisma.subject.upsert({
    where: { name: 'eVLMIS Technical' },
    update: {},
    create: {
      name: 'eVLMIS Technical',
      description: 'Advanced Vaccine Intelligence and Logistics Training',
    },
  });

  const quiz = await prisma.quiz.upsert({
    where: { id: 'cl_evlmis_pro_001' },
    update: {},
    create: {
      id: 'cl_evlmis_pro_001',
      title: 'eVLMIS Advanced Certification',
      description: 'Comprehensive test on Cold Chain and Inventory Management',
      durationMinutes: 30,
      isActive: true,
      examMode: true,
      subjects: { create: { subjectId: subject.id } },
    },
  });

  const newQuestions = [
    {
      text: 'eVLMIS-এ তাপমাত্রার অ্যালার্ট (Temperature Alert) কখন তৈরি হয়?',
      options: ['বাতাসের আর্দ্রতা বাড়লে', 'তাপমাত্রা নির্ধারিত সীমার (+২°C থেকে +৮°C) বাইরে গেলে', 'ফ্রিজের দরজা খোলা থাকলে'],
      correctAnswer: 'তাপমাত্রা নির্ধারিত সীমার (+২°C থেকে +৮°C) বাইরে গেলে',
    },
    {
      text: 'স্টকে থাকা ভ্যাকসিনের ক্ষেত্রে "EEFO" নীতি বলতে কী বোঝায়?',
      options: ['Early Expiry First Out', 'Early Entry First Out', 'Easy Entry Fast Output'],
      correctAnswer: 'Early Expiry First Out',
    },
    {
      text: 'Remote Temperature Monitoring System (RTMS) এর প্রধান কাজ কী?',
      options: ['ভ্যাকসিনের গুণগত মান পরীক্ষা', 'রিয়েল-টাইম তাপমাত্রা পর্যবেক্ষণ ও অ্যালার্ট', 'ভ্যাকসিনের মেয়াদ বৃদ্ধি'],
      correctAnswer: 'রিয়েল-টাইম তাপমাত্রা পর্যবেক্ষণ ও অ্যালার্ট',
    },
    {
      text: 'eVLMIS মোবাইল অ্যাপ্লিকেশনের একটি বিশেষ সুবিধা কী?',
      options: ['অফলাইন ডাটা এন্ট্রি এবং সিঙ্ক্রোনাইজেশন', 'শুধুমাত্র ল্যাপটপে ব্যবহার', 'ইন্টারনেট ছাড়া ডাটা সেভ হয় না'],
      correctAnswer: 'অফলাইন ডাটা এন্ট্রি এবং সিঙ্ক্রোনাইজেশন',
    },
    {
      text: 'eVLMIS সিস্টেমে "UCC" (Upazila Cold Chain) স্টোর থেকে ভ্যাকসিন কোথায় সরবরাহ করা হয়?',
      options: ['সরাসরি সদর দপ্তরে', 'আউটরিচ সেশন সেন্টার বা সাব-সেন্টারে', 'বেসরকারি ফার্মেসিতে'],
      correctAnswer: 'আউটরিচ সেশন সেন্টার বা সাব-সেন্টারে',
    },
    {
      text: '"Stock Out" অবস্থা প্রতিরোধের জন্য eVLMIS কোন ফিচারটি ব্যবহার করে?',
      options: ['অটোমেটিক রিমাইন্ডার ও ড্যাশবোর্ড এনালাইসিস', 'ম্যানুয়াল রেজিস্টার খাতা', 'বার্ষিক রিপোর্ট'],
      correctAnswer: 'অটোমেটিক রিমাইন্ডার ও ড্যাশবোর্ড এনালাইসিস',
    }
  ];

  for (let i = 0; i < newQuestions.length; i++) {
    const q = newQuestions[i];
    await prisma.question.create({
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
            marks: 1,
          },
        },
      },
    });
  }

  console.log('✅ Seeded 6 advanced eVLMIS questions successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });