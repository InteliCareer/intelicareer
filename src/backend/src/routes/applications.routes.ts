import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const appSchema = z.object({
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  jobUrl: z.string().url().optional().or(z.literal('')),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  stage: z.enum(['BOOKMARKED','APPLIED','SCREENING','INTERVIEWING','OFFER','ACCEPTED','REJECTED','WITHDRAWN']).optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','DREAM']).optional(),
  appliedAt: z.string().datetime().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  const { stage, priority } = req.query
  const applications = await prisma.application.findMany({
    where: {
      userId: req.userId,
      ...(stage && { stage: stage as any }),
      ...(priority && { priority: priority as any }),
    },
    include: {
      notes: { orderBy: { createdAt: 'desc' }, take: 1 },
      contacts: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
  return res.json(applications)
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const result = appSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.flatten() })

  const app = await prisma.application.create({
    data: { ...result.data, userId: req.userId! },
    include: { notes: true, contacts: true },
  })
  return res.status(201).json(app)
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const app = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { notes: { orderBy: { createdAt: 'desc' } }, contacts: true },
  })
  if (!app) return res.status(404).json({ error: 'Not found' })
  return res.json(app)
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const result = appSchema.partial().safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.flatten() })

  const existing = await prisma.application.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: result.data,
    include: { notes: true, contacts: true },
  })
  return res.json(updated)
})

router.patch('/:id/stage', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    stage: z.enum(['BOOKMARKED','APPLIED','SCREENING','INTERVIEWING','OFFER','ACCEPTED','REJECTED','WITHDRAWN']),
  })
  const result = schema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.flatten() })

  const existing = await prisma.application.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const updated = await prisma.application.update({
    where: { id: req.params.id },
    data: { stage: result.data.stage },
  })
  return res.json(updated)
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.application.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  await prisma.application.delete({ where: { id: req.params.id } })
  return res.status(204).send()
})

// Notes
router.post('/:id/notes', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.application.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const schema = z.object({ content: z.string().min(1) })
  const result = schema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.flatten() })

  const note = await prisma.applicationNote.create({
    data: { applicationId: req.params.id, content: result.data.content },
  })
  return res.status(201).json(note)
})

// Contacts
router.post('/:id/contacts', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.application.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const schema = z.object({
    name: z.string().min(1),
    role: z.string().optional(),
    email: z.string().email().optional(),
    linkedinUrl: z.string().url().optional(),
  })
  const result = schema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.flatten() })

  const contact = await prisma.applicationContact.create({
    data: { applicationId: req.params.id, ...result.data },
  })
  return res.status(201).json(contact)
})

// Stats
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  const [total, byStage] = await Promise.all([
    prisma.application.count({ where: { userId: req.userId } }),
    prisma.application.groupBy({
      by: ['stage'],
      where: { userId: req.userId },
      _count: { stage: true },
    }),
  ])

  const stageMap = byStage.reduce((acc, s) => {
    acc[s.stage] = s._count.stage
    return acc
  }, {} as Record<string, number>)

  return res.json({ total, byStage: stageMap })
})

export default router
