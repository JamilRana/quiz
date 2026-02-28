'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { formatError } from '@/lib/errors'
import { Trash2, Plus, BarChart3, Link as LinkIcon, Search } from 'lucide-react'
import { AdminBatch, AdminQuestion } from '@/types/admin'

type SubjectWithId = { subjectId: string }

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [quiz, setQuiz] = useState<any>(null)
  const [batches, setBatches] = useState<AdminBatch[]>([])
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<{ id: string, name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [bankQuestions, setBankQuestions] = useState<AdminQuestion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([])
  const [batchForm, setBatchForm] = useState({
    title: '',
    slug: '',
    duration: 60,
    isActive: false,
    examMode: false,
    ipLockEnabled: false,
    deviceLockEnabled: false,
    leaderboardVisible: true,
    strictIpMode: false,
    strictDeviceMode: false,
  })
  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'SINGLE' as 'SINGLE' | 'MULTIPLE' | 'TEXT',
    marks: 1,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  })
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [isEditingQuiz, setIsEditingQuiz] = useState(false)
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    durationMinutes: 60,
    isActive: false,
    examMode: false,
    showLeaderboard: true,
    subjectIds: [] as string[],
  })

  useEffect(() => {
    fetch('/api/subjects').then(res => res.json()).then(setAvailableSubjects)
  }, [])

  useEffect(() => {
    if (params.id) fetchQuiz()
  }, [params.id])

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setQuiz(data)
        setBatches(data.batches || [])
        setQuestions(data.questions || [])
        setQuizForm({
          title: data.title,
          description: data.description || '',
          durationMinutes: data.durationMinutes,
          isActive: data.isActive,
          examMode: data.examMode,
          showLeaderboard: data.showLeaderboard,
          subjectIds: data.subjects.map((s: SubjectWithId) => s.subjectId),
        })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load quiz' })
    } finally {
      setLoading(false)
    }
  }

  const fetchBankQuestions = async () => {
    if (!quiz?.subjects) return
    const ids = quiz.subjects.map((s: SubjectWithId) => s.subjectId).join(',')
    try {
      const res = await fetch(`/api/questions?subjectIds=${ids}&isActive=true`)
      if (res.ok) {
        setBankQuestions(await res.json())
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load question bank' })
    }
  }

  useEffect(() => {
    if (showBankSelector) fetchBankQuestions()
  }, [showBankSelector])

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/quizzes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizForm),
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Quiz updated successfully' })
        setIsEditingQuiz(false)
        fetchQuiz()
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update quiz' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update quiz' })
    }
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...batchForm, quizId: params.id }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Batch created successfully' })
        setShowBatchForm(false)
        fetchQuiz()
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: 'Error', description: formatError(data.error) })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create batch' })
    }
  }

  const handleToggleBatch = async (batchId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...batches.find((b) => b.id === batchId), isActive }),
      })

      if (res.ok) {
        fetchQuiz()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update batch' })
    }
  }

  const handleAddBankQuestions = async () => {
    if (selectedBankQuestions.length === 0) return
    try {
      const res = await fetch(`/api/quizzes/${params.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: selectedBankQuestions, marks: 1 }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Questions added' })
        setShowBankSelector(false)
        setSelectedBankQuestions([])
        fetchQuiz()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add questions' })
    }
  }

  const handleRemoveQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to remove this question from the quiz?')) return
    try {
      const res = await fetch(`/api/quizzes/${params.id}/questions/${questionId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Question removed' })
        fetchQuiz()
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove question' })
    }
  }

  const handleDeleteQuiz = async () => {
    if (!confirm('Are you sure? This will delete all associated batches and data.')) return
    try {
      const res = await fetch(`/api/quizzes/${params.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Quiz deleted' })
      router.push('/admin/quizzes')
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete quiz' })
    }
  }

  const handleCopyLink = (batchId: string) => {
    const url = `${window.location.origin}/quiz/${batchId}`
    navigator.clipboard.writeText(url)
    toast({ title: 'Link Copied', description: 'The quiz link has been copied to your clipboard.' })
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!quiz) return <div className="p-8">Quiz not found</div>

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            {isEditingQuiz ? (
              <form onSubmit={handleUpdateQuiz} className="space-y-4 max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="space-y-2">
                  <Label>Quiz Title</Label>
                  <Input value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (Minutes)</Label>
                    <Input type="number" value={quizForm.durationMinutes} onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: parseInt(e.target.value) })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Subjects</Label>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-700 max-h-[150px] overflow-y-auto space-y-2">
                      {availableSubjects.map(s => (
                        <div key={s.id} className="flex items-center gap-2">
                          <Checkbox 
                            id={`edit-subject-${s.id}`} 
                            checked={quizForm.subjectIds.includes(s.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setQuizForm({ ...quizForm, subjectIds: [...quizForm.subjectIds, s.id] })
                              else setQuizForm({ ...quizForm, subjectIds: quizForm.subjectIds.filter(id => id !== s.id) })
                            }}
                          />
                          <Label htmlFor={`edit-subject-${s.id}`} className="cursor-pointer">{s.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={quizForm.isActive} onCheckedChange={(v) => setQuizForm({ ...quizForm, isActive: v })} />
                      <Label>Active</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={quizForm.examMode} onCheckedChange={(v) => setQuizForm({ ...quizForm, examMode: v })} />
                      <Label>Exam Mode</Label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setIsEditingQuiz(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{quiz.title}</h1>
                <p className="text-lg text-slate-500 font-medium">{quiz.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {quiz.subjects.map((s: any) => (
                    <Badge key={s.subject.id} variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {s.subject.name}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="px-3 py-1 rounded-lg border-slate-200">
                    {quiz.durationMinutes} Minutes
                  </Badge>
                  <Badge variant={quiz.isActive ? 'default' : 'secondary'} className="px-3 py-1 rounded-lg">
                    {quiz.isActive ? 'Active' : 'Draft'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingQuiz(true)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold">
                    Edit Quiz Details
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Link href={`/admin/quizzes/${params.id}/analytics`}>
              <Button variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 font-bold">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDeleteQuiz}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Quiz
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/quizzes')}>Back</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Batches</CardTitle>
                  <Button size="sm" onClick={() => setShowBatchForm(!showBatchForm)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Batch
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showBatchForm && (
                  <form onSubmit={handleCreateBatch} className="space-y-4 mb-6 p-4 border rounded">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input value={batchForm.title} onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input value={batchForm.slug} onChange={(e) => setBatchForm({ ...batchForm, slug: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 mt-6">
                        <Switch checked={batchForm.isActive} onCheckedChange={(v) => setBatchForm({ ...batchForm, isActive: v })} />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={batchForm.examMode} onCheckedChange={(v) => setBatchForm({ ...batchForm, examMode: v })} />
                        <Label>Exam Mode</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={batchForm.ipLockEnabled} onCheckedChange={(v) => setBatchForm({ ...batchForm, ipLockEnabled: v })} />
                        <Label>IP Lock</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={batchForm.deviceLockEnabled} onCheckedChange={(v) => setBatchForm({ ...batchForm, deviceLockEnabled: v })} />
                        <Label>Device Lock</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={batchForm.leaderboardVisible} onCheckedChange={(v) => setBatchForm({ ...batchForm, leaderboardVisible: v })} />
                        <Label>Show Leaderboard</Label>
                      </div>
                    </div>
                    <Button type="submit">Create Batch</Button>
                  </form>
                )}

                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div key={batch.id} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <h3 className="font-medium">{batch.title}</h3>
                        <p className="text-sm text-gray-500">
                          {batch._count.questions} questions • {batch._count.responses} responses
                        </p>
                        <p className="text-xs text-gray-400">/{batch.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={batch.isActive} onCheckedChange={(v) => handleToggleBatch(batch.id, v)} />
                        <Link href={`/admin/batches/${batch.id}/results`}>
                          <Button variant="outline" size="sm">Results</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleCopyLink(batch.id)}>
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <CardTitle>Questions</CardTitle>
                  <Button size="sm" onClick={() => setShowBankSelector(!showBankSelector)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {showBankSelector ? 'Hide Selector' : 'Add from Bank'}
                  </Button>
                </div>

                {showBankSelector && (
                  <div className="space-y-4 mb-6 p-4 border rounded bg-slate-50 dark:bg-slate-900">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <Input
                        placeholder="Search question bank..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                      {bankQuestions.filter(q => q.text.toLowerCase().includes(searchTerm.toLowerCase())).map(q => (
                        <div key={q.id} className="flex items-center gap-2 p-2 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors">
                          <Checkbox 
                            id={`bank-q-${q.id}`} 
                            checked={selectedBankQuestions.includes(q.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) setSelectedBankQuestions([...selectedBankQuestions, q.id])
                              else setSelectedBankQuestions(selectedBankQuestions.filter(id => id !== q.id))
                            }}
                          />
                          <Label htmlFor={`bank-q-${q.id}`} className="flex-1 cursor-pointer truncate text-sm">
                            {q.text}
                          </Label>
                          <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setShowBankSelector(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleAddBankQuestions} disabled={selectedBankQuestions.length === 0}>
                        Add {selectedBankQuestions.length} Selected
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((qq: any, i: number) => {
                    const q = qq.question
                    return (
                      <div key={qq.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">
                              {i + 1}. {q.text}
                            </h3>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px] uppercase">{q.type}</Badge>
                              <Badge variant="outline" className="text-[10px] uppercase text-blue-600">{qq.marks} Marks</Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveQuestion(q.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {q.options && Array.isArray(q.options) && (
                          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(q.options as string[]).map((o, idx) => (
                              <li key={idx} className={`text-sm p-3 rounded-xl border ${o === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                <span className="opacity-50 mr-2">{String.fromCharCode(65 + idx)}.</span> {o} {o === q.correctAnswer && '✓'}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
