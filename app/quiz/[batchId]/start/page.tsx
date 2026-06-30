//src/app/quiz/[batchId]/start/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { getDeviceFingerprint, generateDeviceHash } from '@/lib/fingerprint'
import { formatError } from '@/lib/errors'
import { Shield, Clock, AlertTriangle, User, Loader2 } from 'lucide-react'
import { Batch } from '@/types/quiz'

export default function StartPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    fetchBatch()
  }, [])

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/public/batches/${params.batchId}`)
      if (res.ok) {
        const data = await res.json()
        setBatch(data)
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Batch not found' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load quiz' })
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batch) return

    setSubmitting(true)
    try {
      const fingerprint = getDeviceFingerprint()
      const deviceHash = generateDeviceHash(fingerprint)

      const res = await fetch('/api/responses/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: params.batchId,
          email,
          name,
          deviceHash,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/quiz/${params.batchId}/exam?responseId=${data.responseId}`)
      } else {
        const data = await res.json()
        if (data.isComplete && data.redirectUrl) {
          toast({ title: 'Already Completed', description: `You scored ${data.score || 0}. Redirecting...` })
          router.push(data.redirectUrl)
        } else {
          toast({ variant: 'destructive', title: 'Error', description: formatError(data.error) || 'Failed to start' })
        }
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to start quiz' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">Quiz not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl overflow-hidden rounded-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 md:px-8 md:py-6">
            <div className="flex items-center gap-2 text-white/80 text-xs md:text-sm mb-1">
              <Shield className="w-4 h-4" />
              <span>{batch.quiz.title}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{batch.title}</h1>
          </div>
          
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-slate-600 mb-5 md:mb-6 text-sm md:text-base">
              <Clock className="w-5 h-5 text-slate-400" />
              <span>Duration: <strong>{batch.quiz.durationMinutes} minutes</strong></span>
            </div>

            <form onSubmit={handleStart} className="space-y-4 md:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 text-sm md:text-base font-medium flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 md:h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm md:text-base rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 text-sm md:text-base font-medium flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 md:h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm md:text-base rounded-xl"
                />
              </div>

              {(batch.ipLockEnabled || batch.deviceLockEnabled) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs md:text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                    <p>Your IP address and device information will be recorded for security purposes.</p>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base md:text-lg font-bold rounded-xl shadow-lg shadow-blue-500/10"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </span>
                ) : (
                  `Start ${batch.quiz.examMode ? 'Exam' : 'Quiz'}`
                )}
              </Button>
            </form>

            <div className="mt-5 pt-5 md:mt-6 md:pt-6 border-t border-slate-100 text-center">
              <Link href={`/quiz/${params.batchId}`} className="text-xs md:text-sm text-slate-500 hover:text-slate-700 font-medium">
                ← Back to Quiz Info
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
