'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import useSWR from 'swr'
import { Download, Users, Clock, AlertTriangle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function BatchResultsPage() {
  const params = useParams()
  const { toast } = useToast()
  const [page, setPage] = useState(1)

  const { data: batchData, isLoading: batchLoading } = useSWR(
    params.id ? `/api/batches/${params.id}` : null,
    fetcher
  )

  const { data: responsesData, isLoading: responsesLoading, mutate } = useSWR(
    params.id ? `/api/responses?batchId=${params.id}&page=${page}` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  const { data: leaderboardData } = useSWR(
    params.id ? `/api/leaderboard/${params.id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  const exportCSV = () => {
    if (!responsesData?.responses) return

    const headers = ['Email', 'Name', 'Score', 'Submitted At', 'Flagged']
    const rows = responsesData.responses.map((r: any) => [
      r.email,
      r.name || '',
      r.totalScore,
      r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'Not submitted',
      r.isFlagged ? 'Yes' : 'No',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `responses-${batchData?.title || 'batch'}.csv`
    a.click()
  }

  if (batchLoading || responsesLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!batchData) {
    return <div className="p-8">Batch not found</div>
  }

  const flaggedResponses = responsesData?.responses?.filter((r: any) => r.isFlagged) || []

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {batchData.title} - Results
            </h1>
            <p className="text-gray-500">{batchData.quiz?.title}</p>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responsesData?.pagination?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {responsesData?.responses?.filter((r: any) => r.isComplete).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{flaggedResponses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {responsesData?.responses?.length
                  ? (
                      responsesData.responses
                        .filter((r: any) => r.isComplete)
                        .reduce((acc: number, r: any) => acc + r.totalScore, 0) /
                      responsesData.responses.filter((r: any) => r.isComplete).length
                    ).toFixed(1)
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {batchData.leaderboardVisible && leaderboardData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Leaderboard (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.slice(0, 10).map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.rank}</TableCell>
                      <TableCell>{entry.name || '-'}</TableCell>
                      <TableCell>{entry.email}</TableCell>
                      <TableCell>{entry.score}</TableCell>
                      <TableCell>{entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Flagged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responsesData?.responses?.map((response: any) => (
                  <TableRow key={response.id}>
                    <TableCell>{response.email}</TableCell>
                    <TableCell>{response.name || '-'}</TableCell>
                    <TableCell>{response.totalScore}</TableCell>
                    <TableCell>
                      <Badge variant={response.isComplete ? 'success' : 'secondary'}>
                        {response.isComplete ? 'Complete' : 'In Progress'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {response.isFlagged && (
                        <Badge variant="destructive">Flagged</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {responsesData?.pagination?.pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center">
                  Page {page} of {responsesData.pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= responsesData.pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
