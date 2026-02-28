'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Save, Plus, BookOpen, Clock, 
  Settings, Layout, CheckCircle2, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { Subject, Question } from '@/types/admin'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CreateQuizPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: subjects } = useSWR<Subject[]>('/api/subjects', fetcher)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [examMode, setExamMode] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Question Selection State
  const [step, setStep] = useState(1)
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data: bankQuestions, isLoading: loadingBank } = useSWR<Question[]>(
    subjectIds.length > 0 ? `/api/questions?subjectIds=${subjectIds.join(',')}&isActive=true` : null,
    fetcher
  )

  const handleCreateBaseQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          subjectIds,
          durationMinutes,
          examMode,
          showLeaderboard,
          isActive: false
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error()
      const quiz = await res.json()
      setCreatedQuizId(quiz.id)
      setStep(2)
      toast({ title: 'Success', description: 'Quiz created. Now select questions.' })
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create quiz' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddQuestions = async () => {
    if (!createdQuizId || selectedQuestions.length === 0) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/quizzes/${createdQuizId}/questions`, {
        method: 'POST',
        body: JSON.stringify({ questionIds: selectedQuestions }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Questions added to quiz' })
      router.push('/admin/quizzes')
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add questions' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredBank = bankQuestions?.filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/admin/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Create New Quiz</h1>
          <p className="text-slate-500">Step {step} of 2: {step === 1 ? 'Basic Details' : 'Select Questions'}</p>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleCreateBaseQuiz} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Layout className="w-5 h-5 text-blue-500" />
                    Quiz Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-term Algebra Exam" required className="h-12 text-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter instructions or details for participants..." className="min-h-[120px]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-500" />
                    Configurations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label>Subjects</Label>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 max-h-[200px] overflow-y-auto space-y-2">
                      {subjects?.map(s => (
                        <div key={s.id} className="flex items-center gap-2">
                          <Checkbox 
                            id={`subject-${s.id}`} 
                            checked={subjectIds.includes(s.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setSubjectIds([...subjectIds, s.id])
                              else setSubjectIds(subjectIds.filter(id => id !== s.id))
                            }}
                          />
                          <Label htmlFor={`subject-${s.id}`} className="cursor-pointer">{s.name}</Label>
                        </div>
                      ))}
                    </div>
                    {subjects?.length === 0 && <p className="text-xs text-slate-400">No subjects found.</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration (Minutes)
                    </Label>
                    <Input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} required className="h-11" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="space-y-0.5">
                      <Label>Exam Mode</Label>
                      <p className="text-xs text-slate-500">Strict timing & lock</p>
                    </div>
                    <Switch checked={examMode} onCheckedChange={setExamMode} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="space-y-0.5">
                      <Label>Leaderboard</Label>
                      <p className="text-xs text-slate-500">Show to participants</p>
                    </div>
                    <Switch checked={showLeaderboard} onCheckedChange={setShowLeaderboard} />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg shadow-lg shadow-blue-500/25">
                    Continue to Questions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <CardTitle className="text-xl">Select from Question Bank</CardTitle>
                <CardDescription>
                  Filtering by {subjectIds.length} subjects
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-200">
                  {selectedQuestions.length} Selected
                </span>
                <Button onClick={handleAddQuestions} disabled={isSubmitting || selectedQuestions.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finalize Quiz
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search questions in bank..."
                  className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {loadingBank ? (
                  <div className="text-center py-8">Loading bank...</div>
                ) : filteredBank?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No questions found in this subject.</div>
                ) : (
                  filteredBank?.map(q => (
                    <div 
                      key={q.id} 
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedQuestions.includes(q.id) 
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                      }`}
                      onClick={() => {
                        if (selectedQuestions.includes(q.id)) {
                          setSelectedQuestions(selectedQuestions.filter(id => id !== q.id))
                        } else {
                          setSelectedQuestions([...selectedQuestions, q.id])
                        }
                      }}
                    >
                      <Checkbox 
                        checked={selectedQuestions.includes(q.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{q.text}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded">
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded">
                            {q.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
