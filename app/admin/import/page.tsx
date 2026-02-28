'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import * as XLSX from 'xlsx'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const downloadTemplate = () => {
    const template = [
      {
        subject_name: 'Mathematics',
        question: 'What is 5 + 7?',
        type: 'SINGLE',
        option_a: '10',
        option_b: '12',
        option_c: '14',
        option_d: '11',
        correct_answer: '12',
        difficulty: 'EASY'
      }
    ]
    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template')
    XLSX.writeFile(workbook, 'quiz_import_template.xlsx')
  }

  const handleImport = async () => {
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })
      const result = await res.json()
      if (res.ok) {
        toast({ title: 'Success', description: `Imported ${result.count} questions successfully!` })
        setFile(null)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Bulk Import</h1>
        <p className="text-slate-500 mt-2 text-lg">Upload Excel files to populate your subject question banks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 border-none shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Upload Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 text-center">
            <div 
              className={`border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer ${
                file ? 'border-emerald-400 bg-emerald-50/10' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/5'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0])
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls"
                onChange={(e) => {
                  if (e.target.files?.[0]) setFile(e.target.files[0])
                }}
              />
              {file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-700">Drop your Excel file here</p>
                    <p className="text-sm text-slate-500">or click to browse from your computer</p>
                  </div>
                </div>
              )}
            </div>

            <Button 
              className="mt-8 w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
              disabled={!file || isUploading}
              onClick={handleImport}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start Import'
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4 text-slate-600">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <p>Download our official template to ensure formatting is correct.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <p>Ensure `subject_name` matches exactly or a new subject will be created.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <p>Difficulties must be: EASY, MEDIUM, or HARD.</p>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full h-14 rounded-2xl border-2" onClick={downloadTemplate}>
            <Download className="w-5 h-5 mr-2 text-blue-600" />
            Download Template
          </Button>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">Large files may take a few moments to process. Do not refresh during import.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
