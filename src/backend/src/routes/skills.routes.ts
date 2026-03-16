import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// Public — list all canonical skills
router.get('/', async (_req: Request, res: Response) => {
  const skills = await prisma.skill.findMany({
    orderBy: { name: 'asc' },
  })
  return res.json(skills)
})

router.get('/categories', async (_req: Request, res: Response) => {
  const categories = await prisma.skill.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { category: 'asc' },
  })
  return res.json(categories)
})

router.get('/search', async (req: Request, res: Response) => {
  const q = (req.query.q as string) || ''
  const skills = await prisma.skill.findMany({
    where: {
      name: { contains: q, mode: 'insensitive' },
    },
    take: 20,
    orderBy: { name: 'asc' },
  })
  return res.json(skills)
})

export default router
