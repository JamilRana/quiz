import { z } from 'zod'

export const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export const quizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  subjectIds: z.array(z.string()).min(1, 'At least one subject is required'),
  durationMinutes: z.number().int().min(1),
  isActive: z.boolean().default(false),
  showLeaderboard: z.boolean().default(true),
  examMode: z.boolean().default(false),
})

export const batchSchema = z.object({
  quizId: z.string().min(1, 'Quiz is required'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(false),
  ipLockEnabled: z.boolean().default(false),
  deviceLockEnabled: z.boolean().default(false),
  leaderboardVisible: z.boolean().default(true),
  strictIpMode: z.boolean().default(false),
  strictDeviceMode: z.boolean().default(false),
  examMode: z.boolean().default(false),
})

export const quizBatchSchema = batchSchema

export const questionSchema = z.object({
  subjectId: z.string().min(1),
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['SINGLE', 'MULTIPLE', 'TEXT']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  options: z.any().optional(), // Json
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().optional().nullable(),
})

export const quizQuestionSchema = z.object({
  quizId: z.string().min(1),
  questionId: z.string().min(1),
  marks: z.number().int().min(1),
  order: z.number().int().default(0),
})

export const startExamSchema = z.object({
  batchId: z.string().min(1),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
})

export const submitAnswerSchema = z.object({
  responseId: z.string().min(1),
  questionId: z.string().min(1),
  textAnswer: z.string().optional(),
  selectedOption: z.string().optional(), // For MCQs
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
