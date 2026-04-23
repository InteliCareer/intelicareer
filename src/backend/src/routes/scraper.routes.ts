import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { runAllScrapers } from '../services/scraper'
import { sendNewJobsDigest } from '../services/email'
import { PORTALS, scanPortals } from '../services/portals'
import { evaluateJob } from '../services/evaluation'
import { importJobFromUrl } from '../services/importUrl'

const router = Router()

// GET /api/scraper/portals — list the predefined company portals
router.get('/portals', requireAuth, async (_req: AuthRequest, res: Response) => {
  return res.json({
    portals: PORTALS.map(p => ({
      key: `${p.ats}:${p.token}`,
      company: p.company,
      ats: p.ats,
      category: p.category,
    })),
  })
})

// POST /api/scraper/portals/scan — scrape selected (or all) company portals
// Body: { portals?: string[] }  (keys are "ats:token"; empty = all)
router.post('/portals/scan', requireAuth, async (req: AuthRequest, res: Response) => {
  const tokens = Array.isArray(req.body?.portals) ? req.body.portals : undefined
  const results = await scanPortals(tokens)
  const totalNew = results.reduce((s, r) => s + r.inserted, 0)
  return res.json({ results, totalNew })
})

// POST /api/scraper/import — paste a Greenhouse/Lever/Ashby URL
// Body: { url: string }
router.post('/import', requireAuth, async (req: AuthRequest, res: Response) => {
  const url = (req.body?.url || '').trim()
  if (!url) return res.status(400).json({ error: 'url is required' })
  const result = await importJobFromUrl(url)
  if (!result.ok) return res.status(400).json({ error: result.error })
  return res.json({ job: result.job })
})

// POST /api/scraper/jobs/:id/evaluate — A–F score vs. user profile
router.post('/jobs/:id/evaluate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const evalData = await evaluateJob(req.userId!, req.params.id)
    return res.json({ evaluation: evalData })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// POST /api/scraper/run — Trigger a manual scrape
// Body: { mode: "europe" | "global" } — defaults to "europe"
router.post('/run', requireAuth, async (req: AuthRequest, res: Response) => {
  const mode = req.body?.mode === 'global' ? 'global' : 'europe'
  const results = await runAllScrapers(mode)
  const totalNew = results.reduce((sum, r) => sum + r.inserted, 0)

  // Send email digest if there are new jobs
  if (totalNew > 0) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId } })
      if (user) {
        const newJobs = await prisma.job.findMany({
          where: { autoApplyStatus: 'ELIGIBLE' },
          orderBy: { scrapedAt: 'desc' },
          take: 20,
        })
        await sendNewJobsDigest(user.id, user.email, newJobs)
      }
    } catch (err) {
      console.error('[Scraper] Email digest failed:', err)
    }
  }

  return res.json({ results, totalNew })
})

// GET /api/scraper/jobs — List scraped jobs with filters
router.get('/jobs', requireAuth, async (req: AuthRequest, res: Response) => {
  const {
    search, source, remote, visa, status, workMode, location, currency,
    limit: limitStr, offset: offsetStr, sort,
  } = req.query

  const limit = Math.min(parseInt((limitStr as string) || '50', 10), 100)
  const offset = parseInt((offsetStr as string) || '0', 10)

  const where: any = {}

  // Keyword search across title, company, description, tags
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { company: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { tags: { contains: search as string, mode: 'insensitive' } },
    ]
  }

  // Location search
  if (location) {
    where.location = { contains: location as string, mode: 'insensitive' }
  }

  // Work mode filter
  if (workMode === 'remote') {
    where.isRemote = true
  } else if (workMode === 'hybrid') {
    where.workMode = 'hybrid'
  } else if (workMode === 'onsite') {
    where.isRemote = false
    where.workMode = { not: 'hybrid' }
  }

  if (source) where.source = source
  if (remote === 'true') where.isRemote = true
  if (visa === 'true') where.visaSponsorship = true
  if (status) where.autoApplyStatus = status
  if (currency) where.currency = currency

  const orderBy: any = sort === 'salary' ? { salaryMax: 'desc' } :
                        sort === 'company' ? { company: 'asc' } :
                        { scrapedAt: 'desc' }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({ where, orderBy, skip: offset, take: limit }),
    prisma.job.count({ where }),
  ])

  return res.json({ jobs, total, limit, offset })
})

// GET /api/scraper/stats — Scraping statistics
router.get('/stats', requireAuth, async (_req: AuthRequest, res: Response) => {
  const total = await prisma.job.count()
  const bySource = await prisma.job.groupBy({ by: ['source'], _count: true })
  const byStatus = await prisma.job.groupBy({ by: ['autoApplyStatus'], _count: true })
  const withVisa = await prisma.job.count({ where: { visaSponsorship: true } })
  const remote = await prisma.job.count({ where: { isRemote: true } })
  const lastScrape = await prisma.job.findFirst({ orderBy: { scrapedAt: 'desc' }, select: { scrapedAt: true } })

  return res.json({
    total,
    remote,
    withVisa,
    lastScrape: lastScrape?.scrapedAt,
    bySource: bySource.map(s => ({ source: s.source, count: s._count })),
    byStatus: byStatus.map(s => ({ status: s.autoApplyStatus, count: s._count })),
  })
})

export default router
