'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { formatError } from '@/lib/errors'
import { Plus, Trash2, Edit, Play, Eye, Users, Clock, Copy, Check, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Batch, AdminQuiz, Pagination } from '@/types/admin'

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, pages: 0 })
  const [filters, setFilters] = useState({ quizId: 'all', status: 'all', search: '' })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    duration: 30,
    quizId: '',
    isActive: false,
    examMode: false,
    leaderboardVisible: false,
  })

  useEffect(() => {
    fetchQuizzes()
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [pagination.page, filters])

  const fetchBatches = async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (filters.quizId !== 'all') params.set('quizId', filters.quizId)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)

      const res = await fetch(`/api/batches?${params}`)
      const data = await res.json()
      setBatches(data.batches || [])
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load batches' })
    } finally {
      setLoading(false)
    }
  }

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quizzes')
      const data = await res.json()
      setQuizzes(data)
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load quizzes' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingBatch ? `/api/batches/${editingBatch.id}` : '/api/batches'
      const method = editingBatch ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Error', description: formatError(data.error) || 'Failed to save batch' })
        return
      }

      toast({ title: 'Success', description: `Batch ${editingBatch ? 'updated' : 'created'} successfully` })
      setShowCreate(false)
      setEditingBatch(null)
      resetForm()
      fetchBatches()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save batch' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return

    try {
      const res = await fetch(`/api/batches/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      toast({ title: 'Success', description: 'Batch deleted successfully' })
      fetchBatches()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete batch' })
    }
  }

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch)
    setFormData({
      title: batch.title,
      slug: batch.slug,
      duration: batch.duration,
      quizId: batch.quiz.id,
      isActive: batch.isActive,
      examMode: batch.examMode,
      leaderboardVisible: batch.leaderboardVisible,
    })
    setShowCreate(true)
  }

  const toggleBatch = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      fetchBatches()
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update batch status' })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      duration: 30,
      quizId: '',
      isActive: false,
      examMode: false,
      leaderboardVisible: false,
    })
  }

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const copyQuizUrl = async (batch: Batch) => {
    const url = `${window.location.origin}/quiz/${batch.id}`
    await navigator.clipboard.writeText(url)
    setCopiedId(batch.id)
    toast({ title: 'Copied!', description: 'Quiz URL copied to clipboard' })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchBatches()
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Batches</h1>
            <p className="text-gray-500">Manage quiz batches/sessions</p>
          </div>
          <Dialog open={showCreate} onOpenChange={(open) => {
            setShowCreate(open)
            if (!open) {
              setEditingBatch(null)
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setShowCreate(true); setEditingBatch(null); resetForm() }}>
                <Plus className="h-4 w-4 mr-2" /> Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBatch ? 'Edit Batch' : 'Create Batch'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Batch Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      title: e.target.value,
                      slug: editingBatch ? formData.slug : generateSlug(e.target.value)
                    })}
                    placeholder="Enter batch title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="batch-url-slug"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiz">Quiz</Label>
                    <Select
                      value={formData.quizId}
                      onValueChange={(value) => setFormData({ ...formData, quizId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select quiz" />
                      </SelectTrigger>
                      <SelectContent>
                        {quizzes.map((quiz) => (
                          <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="examMode">Exam Mode</Label>
                  <Switch
                    id="examMode"
                    checked={formData.examMode}
                    onCheckedChange={(checked) => setFormData({ ...formData, examMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="leaderboardVisible">Show Leaderboard</Label>
                  <Switch
                    id="leaderboardVisible"
                    checked={formData.leaderboardVisible}
                    onCheckedChange={(checked) => setFormData({ ...formData, leaderboardVisible: checked })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBatch ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search batches..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <Select
                value={filters.quizId}
                onValueChange={(value) => { setFilters({ ...filters, quizId: value }); setPagination(p => ({ ...p, page: 1 })) }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by quiz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quizzes</SelectItem>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(value) => { setFilters({ ...filters, status: value }); setPagination(p => ({ ...p, page: 1 })) }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="secondary">
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
            </form>
          </CardContent>
        </Card>

        {batches.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              No batches found. Create your first batch!
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {batches.map((batch) => (
                <Card key={batch.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{batch.title}</CardTitle>
                        <p className="text-sm text-gray-500">{batch.quiz.title}</p>
                      </div>
                      <Badge variant={batch.isActive ? 'success' : 'secondary'}>
                        {batch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{batch.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{batch._count.responses} responses</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-xs">ID: {batch.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => toggleBatch(batch.id, batch.isActive)}
                      >
                        {batch.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyQuizUrl(batch)}>
                        {copiedId === batch.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Link href={`/admin/batches/${batch.id}/results`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/batches/${batch.id}/live`}>
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(batch)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(batch.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
