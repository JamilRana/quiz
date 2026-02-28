import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[]

    let importedCount = 0

    await prisma.$transaction(async (tx) => {
      for (const row of data) {
        const subjectName = row.subject_name
        const questionText = row.question
        const type = row.type?.toUpperCase() || 'SINGLE'
        const rawDifficulty = row.difficulty?.toUpperCase() || 'MEDIUM'
        const correctAnswer = row.correct_answer?.toString()
        const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(rawDifficulty) ? rawDifficulty : 'MEDIUM'

        if (!subjectName || !questionText || !correctAnswer) continue

        // 1. Get or Create Subject
        let subject = await tx.subject.findUnique({ where: { name: subjectName } })
        if (!subject) {
          subject = await tx.subject.create({ data: { name: subjectName } })
        }

        // 2. Prepare Options
        const options = []
        if (row.option_a) options.push(row.option_a.toString())
        if (row.option_b) options.push(row.option_b.toString())
        if (row.option_c) options.push(row.option_c.toString())
        if (row.option_d) options.push(row.option_d.toString())

        // 3. Create Question
        await tx.question.create({
          data: {
            subjectId: subject.id,
            text: questionText,
            type: type === 'MCQ' ? 'SINGLE' : type, // Handle user variations
            difficulty,
            options: options.length > 0 ? options : undefined,
            correctAnswer,
            createdById: session.user.id
          }
        })
        importedCount++
      }
    })

    return NextResponse.json({ success: true, count: importedCount })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import questions' }, { status: 500 })
  }
}
