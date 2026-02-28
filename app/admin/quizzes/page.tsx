'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Plus, Search, ClipboardList, Users, Settings, BarChart2, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { Quiz } from '@/types/admin'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function QuizzesPage() {
  const { data: quizzes, mutate, isLoading } = useSWR<Quiz[]>('/api/quizzes', fetcher)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const filteredQuizzes = quizzes?.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.subjects.some(s => s.subject.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure? This will delete all associated batches and data.')) return
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Quiz deleted' })
      mutate()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete quiz' })
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Quizzes</h1>
          <p className="text-slate-500 mt-2 text-lg">Create and manage your assessments</p>
        </div>
        <Link href="/admin/quizzes/create">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6">
            <Plus className="w-5 h-5 mr-2" />
            Create Quiz
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search quizzes or subjects..."
          className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes?.map(quiz => (
            <Card key={quiz.id} className="group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 rounded-2xl">
              <div className="absolute top-0 right-0 p-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/quizzes/${quiz.id}`}>
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Quiz
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/quizzes/${quiz.id}/analytics`}>
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteQuiz(quiz.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardHeader className="pb-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {quiz.subjects.map(s => (
                    <Badge key={s.subject.name} variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {s.subject.name}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-2xl font-bold group-hover:text-blue-600 transition-colors">
                  {quiz.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 h-10 mt-2">
                  {quiz.description || 'No description provided'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Duration</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{quiz.durationMinutes}m</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Questions</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{quiz._count.questions}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/quizzes/${quiz.id}/batches`} className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl">
                      <Users className="w-4 h-4 mr-2" />
                      {quiz._count.batches} Batches
                    </Button>
                  </Link>
                  {quiz.examMode && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-4 flex items-center justify-center">
                      Exam Mode
                    </Badge>
                  )}
                </div>
              </CardContent>

              <div className={`h-1.5 w-full ${quiz.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`} title={quiz.isActive ? 'Active' : 'Inactive'} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
