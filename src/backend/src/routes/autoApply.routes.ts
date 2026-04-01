import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { queueAutoApply, bulkAutoApply, getAutoApplyStats } from '../services/autoApply'

const router = Router()

// POST /api/auto-apply/:jobId — Apply to a single job
router.post('/:jobId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params
  const { coverLetter } = req.body
  const result = await queueAutoApply(req.userId!, jobId, { coverLetter })
  return res.json(result)
})

// POST /api/auto-apply/bulk — Apply to multiple jobs
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { jobIds } = req.body
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return res.status(400).json({ error: 'jobIds array is required' })
  }
  if (jobIds.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 jobs per bulk apply' })
  }
  const results = await bulkAutoApply(req.userId!, jobIds)
  return res.json({ results })
})

// GET /api/auto-apply/stats — Get auto-apply statistics
router.get('/stats', requireAuth, async (req: AuthRequest, res: Response) => {
  const stats = await getAutoApplyStats(req.userId!)
  return res.json(stats)
})

// GET /api/auto-apply/history — Get application history
router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100)
  const offset = parseInt((req.query.offset as string) || '0', 10)

  const [applications, total] = await Promise.all([
    prisma.autoApply.findMany({
      where: { userId: req.userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.autoApply.count({ where: { userId: req.userId } }),
  ])

  return res.json({ applications, total })
})

// PATCH /api/auto-apply/:jobId/skip — Skip a job
router.patch('/:jobId/skip', requireAuth, async (req: AuthRequest, res: Response) => {
  await prisma.job.update({
    where: { id: req.params.jobId },
    data: { autoApplyStatus: 'SKIPPED' },
  })
  return res.json({ success: true })
})

// GET /api/auto-apply/eligible — Get all eligible jobs for auto-apply
router.get('/eligible', requireAuth, async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100)

  // Get jobs user hasn't applied to yet
  const applied = await prisma.autoApply.findMany({
    where: { userId: req.userId },
    select: { jobId: true },
  })
  const appliedIds = applied.map(a => a.jobId)

  const jobs = await prisma.job.findMany({
    where: {
      autoApplyStatus: 'ELIGIBLE',
      id: { notIn: appliedIds.length > 0 ? appliedIds : ['none'] },
    },
    orderBy: [
      { visaSponsorship: 'desc' },
      { scrapedAt: 'desc' },
    ],
    take: limit,
  })

  return res.json({ jobs, total: jobs.length })
})

export default router
