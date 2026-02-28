'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Pencil, Trash2, BookOpen, Search, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminSubject } from '@/types/admin'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SubjectsPage() {
  const { data: subjects, mutate, isLoading } = useSWR<AdminSubject[]>('/api/subjects', fetcher)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentSubject, setCurrentSubject] = useState<AdminSubject | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const filteredSubjects = subjects?.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Subject created successfully' })
      setIsAddDialogOpen(false)
      setName('')
      setDescription('')
      mutate()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create subject' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentSubject) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/subjects/${currentSubject.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Subject updated successfully' })
      setIsEditDialogOpen(false)
      setCurrentSubject(null)
      setName('')
      setDescription('')
      mutate()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update subject' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure? This will delete all questions and quizzes associated with this subject.')) return
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Subject deleted successfully' })
      mutate()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete subject' })
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Subjects</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage your academic subjects and categories</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6">
              <Plus className="w-5 h-5 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>Add a new subject to organize your question bank.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubject} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Core concepts of algebra and calculus" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Creating...' : 'Create Subject'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search subjects..."
          className="pl-10 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects?.map((subject) => (
            <Card key={subject.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 rounded-2xl">
              <CardHeader className="pb-4 relative">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setCurrentSubject(subject)
                          setName(subject.name)
                          setDescription(subject.description || '')
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteSubject(subject.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold">{subject.name}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">{subject.description || 'No description provided'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex items-center text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                    <span className="text-blue-600 mr-2">{subject._count.questions}</span>
                    Questions
                  </div>
                  <div className="flex items-center text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                    <span className="text-purple-600 mr-2">{subject._count.quizzes}</span>
                    Quizzes
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update the details for this subject.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubject} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Subject Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Core concepts" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Updating...' : 'Update Subject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
