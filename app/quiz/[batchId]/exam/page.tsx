'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Send, Eye, EyeOff, CheckSquare, Lock, Loader2 } from 'lucide-react'
import { Question, ExamBatch } from '@/types/quiz'

export default function ExamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const responseId = searchParams.get('responseId')

  const [batch, setBatch] = useState<ExamBatch | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [lockedQuestions, setLockedQuestions] = useState<Record<string, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tabWarning, setTabWarning] = useState(false)
  const [showTimer, setShowTimer] = useState(true)
  const [navigating, setNavigating] = useState(false)
  const autoSubmittedRef = useRef(false)

  const hasAnswer = useCallback((qId: string) => {
    const ans = answers[qId]
    if (ans === undefined || ans === null) return false
    if (Array.isArray(ans)) return ans.length > 0
    return String(ans).trim() !== ''
  }, [answers])

  const fetchExam = useCallback(async () => {
    try {
      const res = await fetch(`/api/responses/${responseId}`)
      if (res.ok) {
        const data = await res.json()
        setBatch(data.batch)
        setQuestions(data.questions)
        setAnswers(data.existingAnswers || {})
        
        // Pre-populate lockedQuestions based on existing answers
        const initialLocked: Record<string, boolean> = {}
        if (data.existingAnswers) {
          Object.keys(data.existingAnswers).forEach((qId) => {
            const ans = data.existingAnswers[qId]
            const hasVal = Array.isArray(ans)
              ? ans.length > 0
              : ans !== undefined && ans !== null && String(ans).trim() !== ''
            if (hasVal) {
              initialLocked[qId] = true
            }
          })
        }
        setLockedQuestions(initialLocked)
        
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

  const saveAnswer = useCallback(async () => {
    const currentQId = questions[currentIndex]?.id
    if (!currentQId) return
    try {
      await fetch('/api/responses/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          questionId: currentQId,
          answer: answers[currentQId],
        }),
      })
    } catch {
      console.error('Failed to save answer')
    }
  }, [responseId, currentIndex, answers, questions])

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    try {
      // Save current answer one last time before submitting
      const currentQId = questions[currentIndex]?.id
      if (currentQId) {
        await fetch('/api/responses/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            responseId,
            questionId: currentQId,
            answer: answers[currentQId],
          }),
        })
      }

      const res = await fetch(`/api/responses/${responseId}/submit`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.redirectUrl) {
          router.push(data.redirectUrl)
        } else {
          router.push(`/quiz/${batch?.id}/submit?responseId=${responseId}`)
        }
      } else {
        const errorData = await res.json()
        if (errorData.redirectUrl) {
          router.push(errorData.redirectUrl)
        } else {
          toast({ variant: 'destructive', title: 'Error', description: errorData.error || 'Failed to submit' })
        }
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
    if (!batch) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [batch])

  // Auto-submit when time expires, including when already expired on page load
  useEffect(() => {
    if (!batch || timeLeft > 0 || submitting || autoSubmittedRef.current) return
    autoSubmittedRef.current = true
    handleSubmit()
  }, [batch, timeLeft, submitting, handleSubmit])

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
    if (lockedQuestions[questionId]) return

    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    setAnswers((prev) => {
      const current = prev[questionId]
      
      if (question.type === 'MULTIPLE') {
        const selected = Array.isArray(current) ? current : []
        const newSelected = selected.includes(value)
          ? selected.filter(v => v !== value)
          : [...selected, value].sort()
        
        return {
          ...prev,
          [questionId]: newSelected
        }
      }

      return {
        ...prev,
        [questionId]: value
      }
    })
  }

  const navigateTo = async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= questions.length || navigating) return
    if (batch?.examMode && newIndex !== currentIndex + 1) return
    
    setNavigating(true)
    
    const currentQId = questions[currentIndex]?.id
    if (currentQId) {
      const hasVal = hasAnswer(currentQId)
      if (hasVal) {
        setLockedQuestions(prev => ({
          ...prev,
          [currentQId]: true
        }))
      }
      await saveAnswer()
    }
    
    setCurrentIndex(newIndex)
    setNavigating(false)
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
  const answeredCount = Object.keys(answers).filter(hasAnswer).length

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

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
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1">
              <h1 className="font-bold text-white text-base md:text-xl truncate max-w-[150px] sm:max-w-[250px] md:max-w-none">
                {batch.quizTitle} - {batch.title}
              </h1>
              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-400">
                <span className="bg-slate-700 px-1.5 py-0.5 rounded text-blue-400 font-bold shrink-0">Q{currentIndex + 1} / {questions.length}</span>
                <span className="bg-slate-700 px-1.5 py-0.5 rounded text-emerald-400 font-bold shrink-0">{answeredCount} Answered</span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-6 shrink-0">
              {showTimer && (
                <div className={`text-lg sm:text-2xl md:text-3xl font-mono font-black ${isLowTime ? 'text-red-500 animate-pulse' : 'text-blue-400'} flex items-center gap-1 md:gap-2`}>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  {formatTime(timeLeft)}
                </div>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowTimer(!showTimer)}
                className="text-slate-400 hover:text-white w-8 h-8 md:w-10 md:h-10 shrink-0"
              >
                {showTimer ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 md:px-8 h-10 md:h-12 text-xs md:text-base rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  batch?.examMode ? 'Submit Exam' : 'Submit Quiz'
                )}
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-3 md:mt-4 h-1.5 md:h-2 bg-slate-700 overflow-hidden rounded-full" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Card className="bg-slate-800 border-none shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
          {navigating && (
            <div className="absolute inset-0 bg-slate-900/60 z-20 flex items-center justify-center rounded-2xl md:rounded-3xl animate-in fade-in duration-200">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-300 text-sm font-medium">Saving answer...</p>
              </div>
            </div>
          )}
          <CardHeader className="p-5 md:pb-8 md:pt-10 md:px-10 border-b border-slate-700/50">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <CardTitle className="text-xl md:text-3xl text-white leading-tight font-extrabold">
                  {currentQuestion.text}
                </CardTitle>
                {lockedQuestions[currentQuestion.id] && (
                  <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold w-fit animate-in fade-in zoom-in duration-300">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    Answer Locked
                  </div>
                )}
              </div>
              <div className="shrink-0 bg-blue-600/10 text-blue-400 border border-blue-600/20 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-black uppercase tracking-widest">
                {currentQuestion.marks} PTS
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-10">
            {currentQuestion.type === 'SINGLE' && (
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(v) => handleAnswer(currentQuestion.id, v)}
                disabled={lockedQuestions[currentQuestion.id]}
                className="grid grid-cols-1 gap-3 md:gap-4"
              >
                {currentQuestion.options?.map((option, i) => (
                  <Label 
                    key={i} 
                    htmlFor={`opt-${i}`}
                    className={`flex items-center gap-3 md:gap-4 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer group ${
                      answers[currentQuestion.id] === option 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-700 bg-slate-700/30 hover:border-slate-600 hover:bg-slate-700/50'
                    } ${lockedQuestions[currentQuestion.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <RadioGroupItem value={option} id={`opt-${i}`} disabled={lockedQuestions[currentQuestion.id]} className="h-5 w-5 md:h-6 md:w-6 border-slate-500 text-blue-500 shrink-0" />
                    <div className="flex-1 text-base md:text-xl text-slate-200 leading-snug">
                      <span className="font-black mr-2 md:mr-4 text-blue-400/50">{String.fromCharCode(65 + i)}.</span>
                      {option}
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'MULTIPLE' && (
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {currentQuestion.options?.map((option, i) => {
                  const isSelected = Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(option)
                  return (
                    <Label 
                      key={i} 
                      htmlFor={`opt-${i}`}
                      className={`flex items-center gap-3 md:gap-4 p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer group ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500/10' 
                          : 'border-slate-700 bg-slate-700/30 hover:border-slate-600 hover:bg-slate-700/50'
                      } ${lockedQuestions[currentQuestion.id] ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <Checkbox 
                        id={`opt-${i}`} 
                        checked={isSelected}
                        disabled={lockedQuestions[currentQuestion.id]}
                        onCheckedChange={() => handleAnswer(currentQuestion.id, option)}
                        className="h-5 w-5 md:h-6 md:w-6 border-slate-500 data-[state=checked]:bg-emerald-500 shrink-0"
                      />
                      <div className="flex-1 text-base md:text-xl text-slate-200 leading-snug">
                        <span className="font-black mr-2 md:mr-4 text-emerald-400/50">{String.fromCharCode(65 + i)}.</span>
                        {option}
                      </div>
                    </Label>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'TEXT' && (
              <div className="space-y-3 md:space-y-4">
                <Label className="text-slate-400 text-base md:text-lg">Your Response</Label>
                <textarea
                  placeholder="Type your detailed answer here..."
                  value={answers[currentQuestion.id] || ''}
                  disabled={lockedQuestions[currentQuestion.id]}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="w-full bg-slate-700/50 border-2 border-slate-700 focus:border-blue-500 p-4 md:p-6 rounded-xl md:rounded-2xl text-base md:text-xl text-white min-h-[150px] md:min-h-[200px] outline-none transition-all placeholder:text-slate-600 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 md:gap-6 mt-6 md:mt-10">
          <div className="flex overflow-x-auto py-2 px-1 gap-2 no-scrollbar justify-start md:justify-center max-w-full">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => navigateTo(i)}
                disabled={navigating || batch?.examMode}
                className={`w-10 h-10 rounded-xl text-sm font-black transition-all shrink-0 flex items-center justify-center ${
                  i === currentIndex 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
                    : hasAnswer(questions[i].id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                } ${batch?.examMode ? 'cursor-default' : 'transform hover:scale-110 active:scale-90'} ${navigating ? 'opacity-50 cursor-wait' : ''}`}
              >
                {lockedQuestions[questions[i].id] ? (
                  <Lock className="w-3.5 h-3.5 text-white" />
                ) : (
                  i + 1
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center gap-4">
            {!batch?.examMode && (
              <Button
                variant="ghost"
                onClick={() => navigateTo(currentIndex - 1)}
                disabled={currentIndex === 0 || navigating || submitting}
                className="text-slate-400 hover:text-white hover:bg-slate-800 h-12 md:h-14 px-4 md:px-8 rounded-xl md:rounded-2xl border border-slate-700 text-sm md:text-base flex-1 md:flex-none"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                Previous
              </Button>
            )}
            
            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 h-12 md:h-14 px-5 md:px-10 rounded-xl md:rounded-2xl text-white font-bold shadow-lg shadow-emerald-500/20 text-sm md:text-base w-full md:w-auto ml-auto flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {batch?.examMode ? 'Submit Exam' : 'Submit Quiz'}
                    <Send className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => navigateTo(currentIndex + 1)}
                disabled={currentIndex === questions.length - 1 || navigating || submitting}
                className={`bg-blue-600 hover:bg-blue-700 h-12 md:h-14 px-5 md:px-10 rounded-xl md:rounded-2xl text-white font-bold shadow-lg shadow-blue-500/20 text-sm md:text-base flex-1 md:flex-none flex items-center justify-center gap-2 ${batch?.examMode ? 'w-full' : ''}`}
              >
                {navigating ? (
                  <>
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next Question
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-1 md:mr-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
