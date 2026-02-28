'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Plus, ArrowLeft, Settings, Users, Calendar, Clock, Shield, Globe, Link as LinkIcon, Check } from 'lucide-react'
import { formatError } from '@/lib/errors'
import { QuizBatch } from '@/types/admin'

export default function QuizBatchesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [quiz, setQuiz] = useState<any>(null)
  const [batches, setBatches] = useState<QuizBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [batchForm, setBatchForm] = useState({
    title: '',
    slug: '',
    duration: 60,
    isActive: false,
    examMode: false,
    ipLockEnabled: false,
    deviceLockEnabled: false,
    leaderboardVisible: true,
  })

  useEffect(() => {
    if (params.id) fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/quizzes/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setQuiz(data)
        setBatches(data.batches || [])
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' })
    } finally {
      setLoading(false)
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
        toast({ title: 'Success', description: 'Batch created' })
        setShowForm(false)
        fetchData()
      } else {
        const data = await res.json()
        toast({ variant: 'destructive', title: 'Error', description: formatError(data.error) })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create batch' })
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
    <div className="p-8 bg-slate-50 min-h-screen dark:bg-slate-900 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Link href={`/admin/quizzes`} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors text-sm mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Quizzes
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Manage Batches
            </h1>
            <p className="text-slate-500">{quiz.title}</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
            <Plus className="w-5 h-5 mr-2" />
            New Batch
          </Button>
        </div>

        {showForm && (
          <Card className="border-none shadow-xl rounded-2xl overflow-hidden animate-in slide-in-from-top duration-300">
            <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
              <CardTitle>Create New Session Batch</CardTitle>
              <CardDescription>Configure the schedule and security settings for this session</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-800">
              <form onSubmit={handleCreateBatch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Batch Title</Label>
                    <Input 
                      value={batchForm.title} 
                      onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })} 
                      placeholder="e.g. Morning Session - Jan 2026"
                      required 
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Unique Slug (URL)</Label>
                    <Input 
                      value={batchForm.slug} 
                      onChange={(e) => setBatchForm({ ...batchForm, slug: e.target.value })} 
                      placeholder="e.g. morning-jan-2026"
                      required 
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-50 dark:border-slate-700">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" /> Timing
                    </h3>
                    <div className="space-y-2">
                      <Label>Duration (Minutes)</Label>
                      <Input 
                        type="number" 
                        value={batchForm.duration} 
                        onChange={(e) => setBatchForm({ ...batchForm, duration: parseInt(e.target.value) })} 
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={batchForm.isActive} 
                        onCheckedChange={(v) => setBatchForm({ ...batchForm, isActive: v })} 
                      />
                      <Label>Publish Immediately</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-rose-500" /> Security
                    </h3>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={batchForm.examMode} 
                        onCheckedChange={(v) => setBatchForm({ ...batchForm, examMode: v })} 
                      />
                      <Label>Strict Exam Mode</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={batchForm.ipLockEnabled} 
                        onCheckedChange={(v) => setBatchForm({ ...batchForm, ipLockEnabled: v })} 
                      />
                      <Label>IP Access Lock</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={batchForm.deviceLockEnabled} 
                        onCheckedChange={(v) => setBatchForm({ ...batchForm, deviceLockEnabled: v })} 
                      />
                      <Label>Device ID Lock</Label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-500" /> Visibility
                    </h3>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={batchForm.leaderboardVisible} 
                        onCheckedChange={(v) => setBatchForm({ ...batchForm, leaderboardVisible: v })} 
                      />
                      <Label>Public Leaderboard</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl px-8">Create Batch Session</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
          {batches.map((batch) => (
            <Card key={batch.id} className="border-none shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden group">
              <div className={`h-1 w-full ${batch.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {batch.title}
                    </h3>
                    {batch.isActive ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded">Draft</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {batch.duration} min
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> {batch._count.responses} Attempts
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500 font-bold">
                      <Calendar className="w-4 h-4" /> /{batch.slug}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <Link href={`/admin/batches/${batch.id}/results`} className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full rounded-xl border-slate-200">
                      Reports
                    </Button>
                  </Link>
                  <Link href={`/admin/batches/${batch.id}/live`} className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full rounded-xl border-slate-200">
                      Monitor
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-slate-200"
                    onClick={() => handleCopyLink(batch.id)}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                    <Settings className="w-5 h-5 text-slate-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {batches.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">No session batches yet</h3>
              <p className="text-slate-400 mb-6">Create your first batch to start accepting submissions</p>
              <Button onClick={() => setShowForm(true)} variant="outline">Create Now</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
