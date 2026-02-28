'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, FileQuestion, AlertCircle, Calendar, Loader2 } from 'lucide-react'
import { QuizViewProps } from '@/types/quiz'

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

export default function QuizView({ batchId }: QuizViewProps) {
  const { data: batch, error, isLoading } = useSWR(`/api/public/batches/${batchId}`, fetcher)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800 border-none shadow-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Not Found</h2>
          <p className="text-slate-400 mb-6">This quiz batch might be inactive or removed.</p>
          <Link href="/">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Back to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const now = new Date()
  const startTime = batch.startTime ? new Date(batch.startTime) : null
  const endTime = batch.endTime ? new Date(batch.endTime) : null
  
  const isWithinTime = (!startTime || now >= startTime) && (!endTime || now <= endTime)
  const isUpcoming = startTime && now < startTime
  const isExpired = endTime && now > endTime

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-20 px-4">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-sm rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-10 py-12 text-center">
              <div className="inline-flex items-center gap-2 text-blue-100/80 text-sm font-bold uppercase tracking-widest mb-4 bg-white/10 px-4 py-1.5 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>{batch.quiz?.title || 'Quiz'}</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-6 leading-tight">{batch.title}</h1>
              <div className="flex justify-center gap-3">
                {batch.quiz?.examMode && (
                  <Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400 font-black px-4 py-1 rounded-lg">
                    STRICT EXAM MODE
                  </Badge>
                )}
                {batch.quiz?.showLeaderboard && (
                  <Badge className="bg-blue-400/20 text-blue-100 border border-blue-400/30 font-bold px-4 py-1 rounded-lg">
                    LEADERBOARD ENABLED
                  </Badge>
                )}
              </div>
            </div>
            
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 flex items-center gap-6 border border-slate-100">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Duration</p>
                    <p className="text-3xl font-black text-slate-800">{batch.quiz?.durationMinutes || 0} Minutes</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 flex items-center gap-6 border border-slate-100">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                    <FileQuestion className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Questions</p>
                    <p className="text-3xl font-black text-slate-800">{batch.quiz?._count?.questions || 0} Items</p>
                  </div>
                </div>
              </div>

              {batch.quiz?.examMode && (
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="bg-rose-100 p-2 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div className="text-rose-900">
                      <p className="font-black text-lg mb-3">Important Exam Rules</p>
                      <ul className="space-y-2 text-rose-800/80 font-medium">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                          Strict timer: Auto-submission when time expires
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                          Security: All tab/window changes are monitored
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                          Single Attempt: Only one submission allowed per email
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!isWithinTime && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                  <div className="text-amber-800">
                    {isUpcoming && <p className="font-bold text-lg">Coming Soon: Starts at {startTime?.toLocaleString()}</p>}
                    {isExpired && <p className="font-bold text-lg">Registration Closed: Ended {endTime?.toLocaleString()}</p>}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {isWithinTime ? (
                  <Link href={`/quiz/${batch.id}/start`}>
                    <Button className="w-full h-16 text-xl font-black bg-blue-700 hover:bg-blue-800 text-white rounded-2xl shadow-xl shadow-blue-700/20 transform transition-all hover:scale-[1.02] active:scale-[0.98]">
                      Register & Start Exam
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full h-16 text-xl font-black bg-slate-200 text-slate-400 rounded-2xl">
                    Not Currently Available
                  </Button>
                )}
                
                <Link href="/" className="text-center">
                  <Button variant="ghost" className="text-slate-500 font-bold hover:bg-slate-100 rounded-xl">
                    Cancel & Return
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
