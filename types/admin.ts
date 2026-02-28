export interface AdminBatch {
  id: string
  title: string
  slug: string
  duration: number
  isActive: boolean
  examMode: boolean
  ipLockEnabled: boolean
  deviceLockEnabled: boolean
  leaderboardVisible: boolean
  _count: { questions: number; responses: number }
}

export interface AdminQuestion {
  id: string
  text: string
  type: string
  marks: number
  options: { id: string; text: string; isCorrect: boolean }[]
}

export interface Subject {
  id: string
  name: string
}

export interface Quiz {
  id: string
  title: string
  description: string | null
  subjects: { subject: { name: string } }[]
  durationMinutes: number
  isActive: boolean
  examMode: boolean
  _count: {
    questions: number
    batches: number
  }
}

export interface Batch {
  id: string
  title: string
  slug: string
  duration: number
  isActive: boolean
  startTime: string | null
  endTime: string | null
  examMode: boolean
  leaderboardVisible: boolean
  quiz: { id: string; title: string }
  _count: { responses: number; questions: number }
}

export interface AdminQuiz {
  id: string
  title: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface QuizBatch {
  id: string
  title: string
  slug: string
  isActive: boolean
  duration: number
  startTime: string | null
  endTime: string | null
  ipLockEnabled: boolean
  deviceLockEnabled: boolean
  _count: { responses: number }
}

export interface AdminSubject {
  id: string
  name: string
  description: string | null
  _count: {
    questions: number
    quizzes: number
  }
}

export interface Question {
  id: string
  text: string
  difficulty: string
  type: string
}

export interface QuestionItem {
  id: string
  subjectId: string
  text: string
  type: 'SINGLE' | 'MULTIPLE' | 'TEXT'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  options: any
  correctAnswer: string
  explanation: string | null
  isActive: boolean
  subject: { name: string }
}

export interface QuestionSubject {
  id: string
  name: string
}

export interface AuditLog {
  id: string
  action: string
  email: string | null
  ipAddress: string | null
  deviceInfo: string | null
  batchId: string | null
  createdAt: string
}

export interface SecurityData {
  logs: AuditLog[]
  total: number
  stats: {
    failedStarts: number
    duplicateDevices: number
    duplicateIps: number
    tabSwitches: number
  }
}

export interface LiveData {
  batchTitle: string
  duration: number
  totalQuestions: number
  avgProgress: number
  participants: {
    id: string
    email: string
    name: string | null
    startedAt: string
    isComplete: boolean
    submittedAt: string | null
    ipAddress: string | null
    _count: { answers: number }
  }[]
}

export interface ScoreDistributionEntry {
  range: string
  count: number
}

export interface QuestionPerformanceData {
  id: string
  text: string
  type: string
  marks: number
  totalAttempts: number
  correctRate: number
}

export interface BatchStats {
  id: string
  title: string
  responseCount: number
  avgScore: string
}

export interface QuizAnalytics {
  quizTitle: string
  totalResponses: number
  avgScore: string
  maxPossible: number
  questionPerformance: QuestionPerformanceData[]
  batchStats: BatchStats[]
  scoreDistribution: ScoreDistributionEntry[]
}

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
}
