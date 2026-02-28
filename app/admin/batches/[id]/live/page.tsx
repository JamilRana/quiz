'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import useSWR from 'swr'
import { Users, Clock, CheckCircle, Play, Pause, RefreshCw } from 'lucide-react'
import { LiveData } from '@/types/admin'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function LiveMonitorPage() {
  const params = useParams()
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { data, isLoading, mutate } = useSWR<LiveData>(
    params.id ? `/api/admin/batches/${params.id}/live` : null,
    fetcher,
    { refreshInterval: autoRefresh ? 3000 : 0 }
  )

  useEffect(() => {
    if (autoRefresh) {
      mutate()
    }
  }, [autoRefresh, mutate])

  const handleToggleRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!data) {
    return <div className="p-8">Batch not found</div>
  }

  const { batchTitle, totalQuestions, avgProgress, participants } = data
  
  const totalParticipants = participants.length
  const completedParticipants = participants.filter(p => p.isComplete).length
  const activeParticipants = participants.filter(p => !p.isComplete).length

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Live Monitor
            </h1>
            <p className="text-gray-500">{batchTitle}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={handleToggleRefresh}
            >
              {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeParticipants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{completedParticipants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgProgress}%</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Participants ({totalQuestions} questions, {data.duration} min)</CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No participants yet
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => {
                  const progress = totalQuestions > 0 
                    ? Math.round((participant._count.answers / totalQuestions) * 100) 
                    : 0

                  return (
                    <div key={participant.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{participant.name || participant.email}</span>
                          {participant.isComplete && (
                            <Badge variant="success">Completed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{participant.email}</p>
                      </div>
                      <div className="w-48">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{participant._count.answers}/{totalQuestions}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="text-right">
                        <Badge variant={participant.isComplete ? 'success' : 'secondary'}>
                          {participant.isComplete ? 'Completed' : 'In Progress'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Started: {new Date(participant.startedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
