'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { 
  Plus, Search, Filter, Pencil, Trash2, 
  ChevronDown, BookOpen, AlertCircle, CheckCircle2 
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { QuestionItem, QuestionSubject } from '@/types/admin'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function QuestionBankPage() {
  const { data: questions, mutate, isLoading } = useSWR<QuestionItem[]>('/api/questions', fetcher)
  const { data: subjects } = useSWR<QuestionSubject[]>('/api/subjects', fetcher)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form State
  const [subjectId, setSubjectId] = useState('')
  const [text, setText] = useState('')
  const [type, setType] = useState<'SINGLE' | 'MULTIPLE' | 'TEXT'>('SINGLE')
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredQuestions = questions?.filter((q) => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === 'all' || q.subjectId === subjectFilter
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter
    return matchesSearch && matchesSubject && matchesDifficulty
  })

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formattedOptions = type !== 'TEXT' ? options.filter(o => o.trim() !== '') : null
      const res = await fetch('/api/questions', {
        method: 'POST',
        body: JSON.stringify({
          subjectId,
          text,
          type,
          difficulty,
          options: formattedOptions,
          correctAnswer,
          explanation: explanation || null
        }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Question added to bank' })
      setIsAddDialogOpen(false)
      resetForm()
      mutate()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add question' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSubjectId('')
    setText('')
    setType('SINGLE')
    setDifficulty('MEDIUM')
    setOptions(['', '', '', ''])
    setCorrectAnswer('')
    setExplanation('')
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error()
      mutate()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status' })
    }
  }

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Question Bank</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage your reusable questions across subjects</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
              <Plus className="w-5 h-5 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Question</DialogTitle>
              <DialogDescription>Create a new reusable question for the question bank.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddQuestion} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subjectId} onValueChange={setSubjectId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Question Text</Label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter the question..." required className="min-h-[100px]" />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label>Options (for MCQ/Multiple)</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single Choice</SelectItem>
                      <SelectItem value="MULTIPLE">Multiple Choice</SelectItem>
                      <SelectItem value="TEXT">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type !== 'TEXT' && (
                  <div className="grid grid-cols-1 gap-3">
                    {options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input 
                          placeholder={`Option ${String.fromCharCode(65 + i)}`} 
                          value={opt} 
                          onChange={(e) => {
                            const newOptions = [...options]
                            newOptions[i] = e.target.value
                            setOptions(newOptions)
                          }}
                        />
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, ''])} className="w-fit">Add Option</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Exact text of correct answer" required />
              </div>

              <div className="space-y-2">
                <Label>Explanation (Optional)</Label>
                <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explain why the answer is correct..." />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg">
                  {isSubmitting ? 'Adding...' : 'Add to Question Bank'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-slate-800 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search questions..."
                className="pl-10 h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[180px] h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[150px] h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />)
        ) : filteredQuestions?.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No questions found matching your filters</p>
          </div>
        ) : (
          filteredQuestions?.map((q) => (
            <Card key={q.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-800 rounded-xl">
              <div className="p-5 flex gap-4 items-start">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-md">
                      {q.subject.name}
                    </Badge>
                    <Badge variant="outline" className={
                      q.difficulty === 'EASY' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                      q.difficulty === 'MEDIUM' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                      'text-rose-600 border-rose-200 bg-rose-50'
                    }>
                      {q.difficulty}
                    </Badge>
                    <span className="text-slate-400 text-xs">• Created recently</span>
                    {!q.isActive && (
                      <Badge variant="destructive" className="ml-auto">Inactive</Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{q.text}</h3>
                  {q.options && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(q.options as string[]).map((opt, i) => (
                        <div key={i} className={`text-sm px-3 py-1.5 rounded-lg border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleActive(q.id, q.isActive)}
                    className={q.isActive ? "text-slate-500" : "text-emerald-500"}
                  >
                    {q.isActive ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
