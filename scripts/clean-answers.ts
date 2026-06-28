import { prisma } from '@/lib/prisma'

async function cleanDuplicateAnswers() {
  console.log('Cleaning duplicate answers...')
  
  const duplicates = await prisma.$queryRaw<Array<{ responseId: string, questionId: string, cnt: bigint }>>`
    SELECT "responseId", "questionId", COUNT(*) as cnt FROM "Answer" 
    GROUP BY "responseId", "questionId" 
    HAVING COUNT(*) > 1
  `
  
  console.log(`Found ${duplicates.length} question groups with duplicates`)

  for (const dup of duplicates) {
    const { responseId, questionId } = dup
    const answers = await prisma.answer.findMany({
      where: { responseId, questionId },
      orderBy: { id: 'asc' },
    })

    const [, ...toDelete] = answers
    const deleteIds = toDelete.map(a => a.id)
    
    if (deleteIds.length > 0) {
      await prisma.answer.deleteMany({
        where: { id: { in: deleteIds } },
      })
      console.log(`  Cleaned ${deleteIds.length} duplicate(s) for response=${responseId.slice(0,8)}..., question=${questionId.slice(0,8)}...`)
    }
  }

  console.log('Done cleaning duplicates')
}

cleanDuplicateAnswers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
