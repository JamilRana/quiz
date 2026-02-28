'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trophy, Medal, Award, Crown, RefreshCw } from 'lucide-react'
import { LeaderboardEntry } from '@/types/quiz'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function LeaderboardPage() {
  const searchParams = useSearchParams()
  const responseId = searchParams.get('responseId')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data, isLoading, mutate } = useSWR<{ leaderboard: LeaderboardEntry[]; userRank: number }>(
    mounted && responseId ? `/api/leaderboard/response/${responseId}` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200'
      case 2:
        return 'bg-gray-50 border-gray-200'
      case 3:
        return 'bg-amber-50 border-amber-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-500 mt-2">See how you stack up against other participants</p>
        </div>

        {data?.userRank && (
          <Card className="mb-6 border-2 border-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Your Rank</p>
                  <p className="text-3xl font-bold text-blue-600">#{data.userRank}</p>
                </div>
                <Badge variant="default" className="text-lg py-2 px-4">
                  Score: {data.leaderboard?.find(e => e.id === responseId)?.totalScore || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {data?.leaderboard?.map((entry, index) => {
            const rank = index + 1
            const isCurrentUser = entry.id === responseId

            return (
              <Card
                key={entry.id}
                className={`${getRankBg(rank)} ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 flex justify-center">
                      {getRankIcon(rank)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {entry.name || entry.email}
                        {isCurrentUser && <Badge className="ml-2 bg-blue-100 text-blue-800">You</Badge>}
                      </p>
                      <p className="text-sm text-gray-500">{entry.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{entry.totalScore}</p>
                      <p className="text-xs text-gray-400">
                        {entry.submittedAt ? new Date(entry.submittedAt).toLocaleTimeString() : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {data?.leaderboard?.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              No submissions yet. Be the first!
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}
