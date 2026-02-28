'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Send, Eye, EyeOff, CheckSquare } from 'lucide-react'
import { Question, ExamBatch } from '@/types/quiz'

export default function ExamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const responseId = searchParams.get('responseId')

  const [batch, setBatch] = useState<ExamBatch | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { textAnswer?: string; selectedOption?: string }>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tabWarning, setTabWarning] = useState(false)
  const [showTimer, setShowTimer] = useState(true)

  const fetchExam = useCallback(async () => {
    try {
      const res = await fetch(`/api/responses/${responseId}`)
      if (res.ok) {
        const data = await res.json()
        setBatch(data.batch)
        setQuestions(data.questions)
        setAnswers(data.existingAnswers || {})
        
        if (data.startedAt) {
          const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000)
          const remaining = data.batch.durationMinutes * 60 - elapsed
          setTimeLeft(Math.max(0, remaining))
        } else {
          setTimeLeft(data.batch.durationMinutes * 60)
        }

        if (data.isComplete) {
          router.push(`/quiz/${data.batch.id}/submit?responseId=${responseId}`)
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load exam' })
        router.push('/')
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load exam' })
    } finally {
      setLoading(false)
    }
  }, [responseId, router, toast])

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    try {
      // Save current answer one last time before submitting
      if (questions[currentIndex]) {
        await fetch('/api/responses/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseId,
            questionId: questions[currentIndex].id,
            ...answers[questions[currentIndex].id],
          }),
        })
      }

      const res = await fetch(`/api/responses/${responseId}/submit`, {
        method: 'POST',
      })

      if (res.ok) {
        router.push(`/quiz/${batch?.id}/submit?responseId=${responseId}`)
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit' })
    } finally {
      setSubmitting(false)
    }
  }, [responseId, submitting, router, batch, currentIndex, answers, questions, toast])

  useEffect(() => {
    if (!responseId) {
      router.push('/')
      return
    }
    fetchExam()
  }, [responseId, fetchExam, router])

  useEffect(() => {
    if (!batch || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [batch, timeLeft, handleSubmit])

  useEffect(() => {
    if (!batch?.examMode) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarning(true)
        fetch('/api/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseId,
            action: 'TAB_SWITCH',
            details: { timestamp: Date.now() },
          }),
        })
      } else {
        setTimeout(() => setTabWarning(false), 3000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [batch?.examMode, responseId])

  const handleAnswer = (questionId: string, value: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    setAnswers((prev) => {
      const current = prev[questionId]
      
      if (question.type === 'MULTIPLE') {
        const selected = current?.selectedOption ? current.selectedOption.split(', ') : []
        const newSelected = selected.includes(value)
          ? selected.filter(v => v !== value)
          : [...selected, value].sort()
        
        return {
          ...prev,
          [questionId]: { selectedOption: newSelected.join(', ') }
        }
      }

      return {
        ...prev,
        [questionId]: question.type === 'TEXT' ? { textAnswer: value } : { selectedOption: value }
      }
    })
  }

  const saveAnswer = async () => {
    try {
      await fetch('/api/responses/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          questionId: questions[currentIndex].id,
          ...answers[questions[currentIndex].id],
        }),
      })
    } catch {
      console.error('Failed to save answer')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!batch || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans">
        <Card className="max-w-md border-none shadow-2xl">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold">No questions available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLowTime = timeLeft < 300

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      {tabWarning && (
        <div className="fixed inset-0 bg-red-600/95 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md bg-white border-none shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600 font-bold">Warning Detected!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-center text-lg">
                Tab switching is strictly prohibited. This incident has been logged.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="sticky top-0 bg-slate-800 border-b border-slate-700 z-10 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="font-bold text-white text-xl">{batch.quizTitle} - {batch.title}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="bg-slate-700 px-2 py-0.5 rounded text-blue-400 font-bold">Q{currentIndex + 1} / {questions.length}</span>
                <span className="bg-slate-700 px-2 py-0.5 rounded text-emerald-400 font-bold">{Object.keys(answers).length} Answered</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {showTimer && (
                <div className={`text-3xl font-mono font-black ${isLowTime ? 'text-red-500 animate-pulse' : 'text-blue-400'} flex items-center gap-2`}>
                  <Clock className="w-6 h-6" />
                  {formatTime(timeLeft)}
                </div>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowTimer(!showTimer)}
                className="text-slate-400 hover:text-white"
              >
                {showTimer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                Submit Exam
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-4 h-2 bg-slate-700 overflow-hidden rounded-full" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <Card className="bg-slate-800 border-none shadow-2xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          <CardHeader className="pb-8 pt-10 px-10 border-b border-slate-700/50">
            <div className="flex justify-between items-start gap-4">
              <CardTitle className="text-3xl text-white leading-tight font-extrabold">
                {currentQuestion.text}
              </CardTitle>
              <div className="shrink-0 bg-blue-600/10 text-blue-400 border border-blue-600/20 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest">
                {currentQuestion.marks} PTS
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            {currentQuestion.type === 'SINGLE' && (
              <RadioGroup
                value={answers[currentQuestion.id]?.selectedOption || ''}
                onValueChange={(v) => handleAnswer(currentQuestion.id, v)}
                className="grid grid-cols-1 gap-4"
              >
                {currentQuestion.options?.map((option, i) => (
                  <Label 
                    key={i} 
                    htmlFor={`opt-${i}`}
                    className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer group ${
                      answers[currentQuestion.id]?.selectedOption === option 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-700 bg-slate-700/30 hover:border-slate-600 hover:bg-slate-700/50'
                    }`}
                  >
                    <RadioGroupItem value={option} id={`opt-${i}`} className="h-6 w-6 border-slate-500 text-blue-500" />
                    <div className="flex-1 text-xl text-slate-200">
                      <span className="font-black mr-4 text-blue-400/50">{String.fromCharCode(65 + i)}.</span>
                      {option}
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'MULTIPLE' && (
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options?.map((option, i) => {
                  const isSelected = (answers[currentQuestion.id]?.selectedOption || '').split(', ').includes(option)
                  return (
                    <Label 
                      key={i} 
                      htmlFor={`opt-${i}`}
                      className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer group ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-slate-700 bg-slate-700/30 hover:border-slate-600 hover:bg-slate-700/50'
                      }`}
                    >
                      <Checkbox 
                        id={`opt-${i}`} 
                        checked={isSelected}
                        onCheckedChange={() => handleAnswer(currentQuestion.id, option)}
                        className="h-6 w-6 border-slate-500 data-[state=checked]:bg-emerald-500"
                      />
                      <div className="flex-1 text-xl text-slate-200">
                        <span className="font-black mr-4 text-emerald-400/50">{String.fromCharCode(65 + i)}.</span>
                        {option}
                      </div>
                    </Label>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'TEXT' && (
              <div className="space-y-4">
                <Label className="text-slate-400 text-lg">Your Response</Label>
                <textarea
                  placeholder="Type your detailed answer here..."
                  value={answers[currentQuestion.id]?.textAnswer || ''}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full bg-slate-700/50 border-2 border-slate-700 focus:border-blue-500 p-6 rounded-2xl text-white text-xl min-h-[200px] outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-10">
          <Button
            variant="ghost"
            onClick={() => { saveAnswer(); setCurrentIndex(currentIndex - 1); }}
            disabled={currentIndex === 0 || batch.examMode}
            className="text-slate-400 hover:text-white hover:bg-slate-800 h-14 px-8 rounded-2xl border border-slate-700"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </Button>
          
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => { saveAnswer(); setCurrentIndex(i); }}
                className={`w-10 h-10 rounded-xl text-sm font-black transition-all transform hover:scale-110 active:scale-90 ${
                  i === currentIndex 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
                    : answers[questions[i].id]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            onClick={() => { saveAnswer(); setCurrentIndex(currentIndex + 1); }}
            disabled={currentIndex === questions.length - 1}
            className="bg-blue-600 hover:bg-blue-700 h-14 px-10 rounded-2xl text-white font-bold shadow-lg shadow-blue-500/20"
          >
            Next Question
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
