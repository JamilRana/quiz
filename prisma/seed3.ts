import { PrismaClient, QuestionType, Difficulty } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting HMIS Seeding...');

  // 1. Create Admin if not exists
  const hashedPassword = await bcrypt.hash('Dghs@123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'ame@mis.dghs.gov.bd' },
    update: { password: hashedPassword },
    create: {
      email: 'ame@mis.dghs.gov.bd',
      password: hashedPassword,
      name: 'Admin User',
    },
  });
  console.log('Admin seeded:', admin.email);

  // 2. Create the Subject
  const subject = await prisma.subject.upsert({
    where: { name: 'HMIS & Health Data Management' },
    update: {},
    create: {
      name: 'HMIS & Health Data Management',
      description: 'Capacity Development Training on HMIS and Health Data Management',
    },
  });

  // 3. Create the Quiz Template
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Pre Test Evaluation on 3 Days Basic Capacity Development Training on HMIS and Health Data Management',
      description: 'Pre Test Evaluation for HMIS and Health Data Management Training Participants.',
      durationMinutes: 20,
      isActive: true,
      examMode: true,
      subjects: {
        create: { subjectId: subject.id },
      },
    },
  });

  // 4. Define Questions
  const questionsData = [
    {
      text: 'MIS, DGHS কর্তৃক ব্যবহৃত প্রধান Software/System এর ক্ষেত্রে কোনটি সঠিক?',
      options: [
        'ক) DHIS2, HRIS, ICT Equipment Tracking, eNothi, OpenSHR',
        'খ) OpenMRS, Telemedicine, ICT Equipment Tracking, eAMS, OpenSRP',
        'গ) eGP, eLMIS, Shasthay Batayon(16263), Biometric Attendance, GRS',
        'ঘ) উপরের সবগুলো।'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'ক) DHIS2, HRIS, ICT Equipment Tracking, eNothi, OpenSHR',
    },
    {
      text: 'HRIS-এ সংযুক্তি/অতিরিক্ত দায়িত্ব এর তথ্য কোথায় দিবে?',
      options: [
        'ক) Additional role',
        'খ) deputation service',
        'গ) service particular',
        'ঘ) liens'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'ক) Additional role',
    },
    {
      text: 'Original Designation বলতে কি বুঝায়?',
      options: [
        'ক) মূল পদবী',
        'খ) যে পদে নিয়মিত',
        'গ) ডেপুটেশন',
        'ঘ) চলতি দায়িত্ব'
      ],
      type: QuestionType.MULTIPLE,
      correctAnswer: ['খ) যে পদে নিয়মিত', 'গ) ডেপুটেশন'],
    },
    {
      text: 'Provider PRL এ গেলে করণীয় কি?',
      options: [
        'ক) Move out option সিলেক্ট করতে হবে',
        'খ) Retirement option সিলেক্ট করতে হবে',
        'গ) Deceases option সিলেক্ট করতে হবে',
        'ঘ) কোনটিই নয়'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'ক) Move out option সিলেক্ট করতে হবে',
    },
    {
      text: 'Provider মারা গেলে সেক্ষেত্রে করণীয় কি?',
      options: [
        'ক) Move out option সিলেক্ট করতে হবে',
        'খ) Retirement option সিলেক্ট করতে হবে',
        'গ) Deceases option সিলেক্ট করতে হবে',
        'ঘ) কোনটিই নয়'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'ক) Move out option সিলেক্ট করতে হবে',
    },
    {
      text: 'HRIS পাসওয়ার্ড recovery করতে করণীয় কি?',
      options: [
        'ক) MIS এ যোগাযোগ করতে হবে',
        'খ) Facility Admin কে জানানো',
        'গ) I Forgot my password option ব্যবহার করা',
        'ঘ) উপরের সবগুলো'
      ],
      type: QuestionType.MULTIPLE,
      correctAnswer: ['খ) Facility Admin কে জানানো', 'গ) I Forgot my password option ব্যবহার করা'],
    },
    {
      text: 'What is DHIS?',
      options: [
        'a) District Health Information System',
        'b) Digital Health Information System',
        'c) District Health Informatics System',
        'd) Digital Health Informatics System'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'a) District Health Information System',
    },
    {
      text: 'নিচের কোনটি DHIS2 এর core dimension?',
      options: [
        'ক) Organization Unit(where)',
        'খ) Data (what)',
        'গ) period (when)',
        'ঘ) উপরের সবগুলো'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'ক) Organization Unit(where)',
    },
    {
      text: 'DHIS2 এর pivot table প্রধানত কি কাজে ব্যবহার করা হয়?',
      options: [
        'ক) data visualize এর জন্য',
        'খ) dynamic table এর মাধ্যমে ডাটা বিশ্লেষণ',
        'গ) ডাটা মনিটরিং এর জন্য',
        'ঘ) উপরের সবগুলো'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'ক) data visualize এর জন্য',
    },
    {
      text: 'Dashboard এর প্রাথমিক উদ্দেশ্য কি?',
      options: [
        'ক) ডাটা সহজে দেখা যায়',
        'খ) সিদ্ধান্ত গ্রহণে সাহায্য করে',
        'গ) ডাটা মনিটরিং',
        'ঘ) উপরের সবগুলো'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'ক) ডাটা সহজে দেখা যায়',
    },
    {
      text: 'What is the Formula of “BOR”?',
      options: [
        'a. Bed Occupancy Rate (BOR) = (Patient’s Day / (No. of bed * duration of period)) * 100',
        "b. Bed Occupancy Rate (BOR) = (Patient's Day / (No. of bed * Discharge)) * 100",
        'c. Bed Occupancy Rate (BOR) = (Discharge / (No. of bed * duration of period)) * 100'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'a. Bed Occupancy Rate (BOR) = (Patient’s Day / (No. of bed * duration of period)) * 100',
    },
    {
      text: 'What is OpenSRP ?',
      options: [
        'a) Open Standard Registration Program',
        'b) Open Smart Registration Platform',
        'c) Open Standard Registration Process',
        'd) all above'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'a) Open Standard Registration Program',
    },
    {
      text: 'What is OpenMRS ?',
      options: [
        'a) Open Medician Registration Softare',
        'b) Open Medical Record System',
        'c) Open Medical Record Softare',
        'd) all above'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'a) Open Medician Registration Softare',
    },
    {
      text: 'Hospital Automation System এ নিচের কোন সফটওয়্যারটি ব্যাবহার করা হয়?',
      options: [
        'a) OpenMRS',
        'b) DHIS2',
        'c) OpenSHP',
        'd) OpenSRP'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'a) OpenMRS',
    },
    {
      text: 'Formula of Infant Mortality Rate (IMR ):',
      options: [
        'A. (IMR) = (Total No. of Death 1st year of life (<1 year) / Total No. of Population that year) * 1000',
        'B. (IMR) = (Total No. of Death 1st year of life (<1 year) / Total No. of live birth in that year) * 100000',
        'C. (IMR) = (Total No. of Death 1st year of life (<1 year) / Total No. of live birth in that year) * 1000'
      ],
      type: QuestionType.SINGLE,
      correctAnswer: 'A. (IMR) = (Total No. of Death 1st year of life (<1 year) / Total No. of Population that year) * 1000',
    },
  ];

  // 5. Insert Questions and Link to Quiz
  for (let i = 0; i < questionsData.length; i++) {
    const q = questionsData[i];
    await prisma.question.create({
      data: {
        subjectId: subject.id,
        text: q.text,
        type: q.type,
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

  // 6. Create a Production Batch
  await prisma.batch.create({
    data: {
      quizId: quiz.id,
      title: 'HMIS Training June 2026 Batch',
      slug: 'hmis-training-2026',
      isActive: true,
      ipLockEnabled: false,
      deviceLockEnabled: false,
    },
  });

  console.log('✅ HMIS Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
