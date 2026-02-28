export interface Batch {
  id: string
  title: string
  quiz: {
    title: string
    durationMinutes: number
    examMode: boolean
  }
  ipLockEnabled: boolean
  deviceLockEnabled: boolean
}

export interface Question {
  id: string
  text: string
  type: 'SINGLE' | 'MULTIPLE' | 'TEXT'
  marks: number
  options: string[] | null
}

export interface QuizViewProps {
  batchId: string;
}

export interface LeaderboardEntry {
  id: string
  email: string
  name: string | null
  totalScore: number
  submittedAt: string | null
}

export interface ExamBatch {
  id: string
  title: string
  quizTitle: string
  durationMinutes: number
  examMode: boolean
}
