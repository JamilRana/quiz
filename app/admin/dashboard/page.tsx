'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, FileText, BarChart3, AlertTriangle, 
  BookOpen, HelpCircle, ArrowRight, Zap 
} from 'lucide-react'
import useSWR from 'swr'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts'
import { useEffect, useState } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  
  const { data: stats, isLoading: loadingStats } = useSWR('/api/dashboard/stats', fetcher, { refreshInterval: 10000 })
  const { data: subjectAnalytics } = useSWR('/api/analytics/subjects', fetcher)
  const { data: questionAnalytics } = useSWR('/api/analytics/questions', fetcher)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loadingStats) {
    return (
      <div className="p-8 space-y-8 animate-pulse bg-slate-50 dark:bg-slate-900 min-h-screen">
        <div className="h-10 bg-slate-200 w-1/4 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            System Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Welcome back, <span className="text-blue-600 font-bold">{session?.user?.name || session?.user?.email}</span>
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/quizzes/create">
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 px-6 h-12 rounded-xl">
              <Zap className="w-4 h-4 mr-2" />
              Quick Create Quiz
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Subjects" value={stats?.totalSubjects} icon={BookOpen} color="blue" />
        <StatCard title="Question Bank" value={stats?.totalQuestions} icon={HelpCircle} color="indigo" />
        <StatCard title="Total Responses" value={stats?.totalResponses} icon={Users} color="emerald" />
        <StatCard title="Flagged Issues" value={stats?.flaggedCount} icon={AlertTriangle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-800">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            <CardTitle>Subject Distribution</CardTitle>
            <CardDescription>Questions and Quizzes per subject</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={subjectAnalytics || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="questionCount" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Questions" />
                <Bar dataKey="quizCount" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Quizzes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <CardTitle>Question Types</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats?.questionDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.questionDistribution?.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {stats?.questionDistribution?.map((q: any, i: number) => (
                  <div key={i} className="text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400">{q.name}</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{q.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-blue-600 text-white">
            <CardContent className="p-8 space-y-4">
              <h3 className="text-2xl font-black">Ready for a new batch?</h3>
              <p className="text-blue-100 opacity-80">Link your quizzes to subjects and track detailed analytics.</p>
              <Link href="/admin/batches" className="inline-block">
                <Button variant="secondary" className="bg-white text-blue-600 border-none rounded-xl">
                  Manage Batches
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Most Failed Questions</CardTitle>
            <CardDescription>Questions with the lowest correct rate</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {questionAnalytics?.slice(0, 5).map((q: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{q.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{q.subject} • {q.difficulty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-rose-600 font-black text-lg">{q.correctRate}%</p>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Success Rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average scores per subject</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {subjectAnalytics?.map((s: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                    <span className="text-blue-600 font-black">{s.avgScore} Avg</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (Number(s.avgScore) / 100) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    rose: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30',
    indigo: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30'
  }

  return (
    <Card className="border-none shadow-lg rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300 bg-white dark:bg-slate-800">
      <CardContent className="p-6 flex items-center gap-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {value === undefined ? '...' : value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
