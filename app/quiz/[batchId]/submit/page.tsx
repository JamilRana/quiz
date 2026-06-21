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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl overflow-hidden text-center rounded-2xl">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-6 md:px-8 md:py-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg shrink-0">
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Submitted Successfully!</h1>
          </div>
          
          <CardContent className="p-6 md:p-8">
            <p className="text-sm md:text-base text-slate-600 mb-5 md:mb-6 leading-relaxed">
              Your responses have been recorded. Thank you for completing the {responseId ? 'quiz' : 'exam'}.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 md:p-4 mb-5 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-600">
                <Mail className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0" />
                <span className="truncate">Confirmation ID: <strong className="text-slate-800 select-all">{responseId || 'N/A'}</strong></span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 mb-5 md:mb-6 text-left">
              <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                <strong>Important:</strong> Your responses have been saved. Results will be shared via email or announced by the administrator.
              </p>
            </div>

            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11 md:h-12 text-sm md:text-base font-bold rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center">
                <Home className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
