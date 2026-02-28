'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import useSWR from 'swr'
import { Shield, AlertTriangle, Monitor, Globe, Clock, RefreshCw, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AuditLog, SecurityData } from '@/types/admin'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SecurityLogsPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<string>('all')

  const { data, isLoading, mutate } = useSWR<SecurityData>(
    `/api/admin/security?page=${page}&filter=${filter === 'all' ? '' : filter}`,
    fetcher,
    { refreshInterval: 10000 }
  )

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      FAILED_START: 'bg-red-100 text-red-800',
      DUPLICATE_DEVICE: 'bg-orange-100 text-orange-800',
      DUPLICATE_IP: 'bg-yellow-100 text-yellow-800',
      TAB_SWITCH: 'bg-purple-100 text-purple-800',
      SUSPICIOUS_ANSWER: 'bg-red-100 text-red-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'FAILED_START':
        return <AlertTriangle className="h-4 w-4" />
      case 'DUPLICATE_DEVICE':
        return <Monitor className="h-4 w-4" />
      case 'DUPLICATE_IP':
        return <Globe className="h-4 w-4" />
      case 'TAB_SWITCH':
        return <Clock className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  const totalPages = Math.ceil((data?.total || 0) / 20)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Logs</h1>
            <p className="text-gray-500">Monitor suspicious activities and security events</p>
          </div>
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Failed Starts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data?.stats.failedStarts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Duplicate Devices</CardTitle>
              <Monitor className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{data?.stats.duplicateDevices || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Duplicate IPs</CardTitle>
              <Globe className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data?.stats.duplicateIps || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tab Switches</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{data?.stats.tabSwitches || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Activity Log</CardTitle>
            <Select value={filter} onValueChange={(value) => { setFilter(value); setPage(1) }}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="FAILED_START">Failed Starts</SelectItem>
                <SelectItem value="DUPLICATE_DEVICE">Duplicate Devices</SelectItem>
                <SelectItem value="DUPLICATE_IP">Duplicate IPs</SelectItem>
                <SelectItem value="TAB_SWITCH">Tab Switches</SelectItem>
                <SelectItem value="SUSPICIOUS_ANSWER">Suspicious Answers</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {data?.logs?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No security events found
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {data?.logs?.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`p-2 rounded-lg ${getActionBadge(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionBadge(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {log.email || 'Unknown user'}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-500">{log.ipAddress || 'No IP'}</p>
                        <p className="text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
