import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function seedRandom(seedStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return function() {
    let z = (h += 0x6D2B79F5 | 0);
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }
}

function shuffle<T>(array: T[], seedStr: string): T[] {
  const rand = seedRandom(seedStr);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await prisma.response.findUnique({
      where: { id: params.id },
      include: {
        batch: {
          include: {
            quiz: {
              include: {
                questions: {
                  include: { question: true },
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        answers: true,
      },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Flatten questions from QuizQuestion and shuffle options
    const flattenedQuestions = response.batch.quiz.questions.map(qq => {
      const options = qq.question.options;
      const shuffledOptions = options && Array.isArray(options)
        ? shuffle(options as string[], `${response.id}-${qq.question.id}`)
        : options;
      return {
        id: qq.question.id,
        text: qq.question.text,
        type: qq.question.type,
        marks: qq.marks,
        options: shuffledOptions,
      }
    })

    // Shuffle questions using response ID as the seed
    const shuffledQuestions = shuffle(flattenedQuestions, response.id);

    const existingAnswers: Record<string, any> = {}
    response.answers.forEach((answer) => {
      existingAnswers[answer.questionId] = answer.answer
    })

    return NextResponse.json({
      ...response,
      questions: shuffledQuestions,
      batch: {
        id: response.batch.id,
        title: response.batch.title,
        quizTitle: response.batch.quiz.title,
        durationMinutes: response.batch.quiz.durationMinutes,
        examMode: response.batch.quiz.examMode,
      },
      existingAnswers,
    })
  } catch (error) {
    console.error('Response GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
