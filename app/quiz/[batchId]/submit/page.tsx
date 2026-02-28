//src/app/quiz/[batchId]/submit/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Home, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SubmitPage() {
  const searchParams = useSearchParams()
  const responseId = searchParams.get('responseId')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl overflow-hidden text-center">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-white">Submitted Successfully!</h1>
          </div>
          
          <CardContent className="p-8">
            <p className="text-slate-600 mb-6">
              Your responses have been recorded. Thank you for completing the {responseId ? 'quiz' : 'exam'}.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-5 h-5 text-slate-400" />
                <span>Confirmation ID: <strong className="text-slate-800">{responseId || 'N/A'}</strong></span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Your responses have been saved. Results will be shared via email or announced by the administrator.
              </p>
            </div>

            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
