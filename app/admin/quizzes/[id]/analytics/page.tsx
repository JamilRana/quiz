'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { 
  LayoutDashboard, ArrowLeft, Download, 
  Target, Award, Users, HelpCircle, 
  ChevronRight, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { QuizAnalytics } from '@/types/admin'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function QuizAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: analytics, error, isLoading } = useSWR<QuizAnalytics>(`/api/admin/quizzes/${id}/analytics`, fetcher)

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse bg-slate-900 min-h-screen">
        <div className="h-10 bg-slate-800 w-1/4 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>)}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="p-8 text-center text-white bg-slate-900 min-h-screen">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Failed to load analytics</h2>
        <Button onClick={() => router.back()} variant="ghost" className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-slate-200 font-sans space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <Link href={`/admin/quizzes`} className="flex items-center text-slate-400 hover:text-white transition-colors text-sm mb-2 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Quizzes
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight">
            {analytics.quizTitle}
          </h1>
          <p className="text-slate-500 font-medium">Detailed performance analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-11 px-6 rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
            Real-time Feed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Responses" value={analytics.totalResponses} icon={Users} color="blue" />
        <MetricCard title="Average Score" value={analytics.avgScore} subtitle={`out of ${analytics.maxPossible}`} icon={Award} color="emerald" />
        <MetricCard title="Top Accuracy" value={`${Math.max(...analytics.questionPerformance.map((p:any) => p.correctRate)).toFixed(0)}%`} icon={Target} color="amber" />
        <MetricCard title="Total Marked" value={analytics.questionPerformance.length} icon={HelpCircle} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-slate-800 border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="text-xl text-white">Score Distribution</CardTitle>
            <CardDescription className="text-slate-400">Frequency of scores across all participants</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#334155'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '15px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {analytics?.scoreDistribution.map((entry, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-none shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="text-xl text-white">Question Difficulty</CardTitle>
            <CardDescription className="text-slate-400">Success rate by question type</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
             <div className="space-y-6">
               {analytics.questionPerformance.slice(0, 5).map((q, i: number) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between text-sm font-bold">
                     <span className="text-slate-300 truncate max-w-[200px]">{q.text}</span>
                     <span className={q.correctRate < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                       {q.correctRate.toFixed(0)}%
                     </span>
                   </div>
                   <Progress value={q.correctRate} className="h-2 bg-slate-700" indicatorClassName={q.correctRate < 50 ? 'bg-rose-500' : 'bg-emerald-500'} />
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-none shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <CardTitle className="text-xl text-white">Batch Performance Comparison</CardTitle>
          <CardDescription className="text-slate-400">Compare completion rates and scores across sessions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs font-black uppercase tracking-widest">
                  <th className="px-8 py-4">Batch Title</th>
                  <th className="px-8 py-4">Participants</th>
                  <th className="px-8 py-4">Average Score</th>
                  <th className="px-8 py-4 text-right">View Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {analytics.batchStats.map((batch, i: number) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5 font-bold text-white">{batch.title}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        {batch.responseCount}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="px-3 py-1 bg-slate-900 rounded-lg inline-block border border-white/5">
                        <span className="text-emerald-400 font-black">{batch.avgScore}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-blue-400 group-hover:text-blue-300">
                      <Link href={`/admin/batches/${batch.id}/results`} className="inline-flex items-center">
                        Details <ChevronRight className="ml-1 w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type ColorKey = 'blue' | 'emerald' | 'amber' | 'purple'

function MetricCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string | number; subtitle?: string; icon: React.ElementType; color: ColorKey }) {
  const colors: Record<ColorKey, string> = {
    blue: 'text-blue-400 bg-blue-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    purple: 'text-purple-400 bg-purple-400/10'
  }

  return (
    <Card className="bg-slate-800 border-none shadow-xl rounded-[2rem] hover:scale-[1.03] transition-all duration-300">
      <CardContent className="p-8 flex items-center gap-6">
        <div className={`p-4 rounded-2xl ${colors[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-white mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
