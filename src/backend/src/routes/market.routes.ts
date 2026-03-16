import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// Top skills for a given role (public)
router.get('/top-skills', async (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'Backend Engineer'
  const days = parseInt((req.query.days as string) || '90', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const results = await prisma.$queryRaw<{ skill_name: string; category: string; count: bigint }[]>`
    SELECT s.name AS skill_name, s.category, COUNT(DISTINCT js."jobId") AS count
    FROM job_skills js
    JOIN skills s ON s.id = js."skillId"
    JOIN jobs j ON j.id = js."jobId"
    WHERE j."postedAt" >= ${since}
      AND j.title ILIKE ${'%' + role + '%'}
    GROUP BY s.name, s.category
    ORDER BY count DESC
    LIMIT 15
  `

  return res.json(
    results.map((r) => ({
      skill: r.skill_name,
      category: r.category,
      count: Number(r.count),
    }))
  )
})

// Recent jobs (public)
router.get('/recent-jobs', async (req: Request, res: Response) => {
  const role = (req.query.role as string) || ''
  const isRemote = req.query.remote === 'true'
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50)

  const jobs = await prisma.job.findMany({
    where: {
      ...(role && { title: { contains: role, mode: 'insensitive' } }),
      ...(isRemote && { isRemote: true }),
    },
    include: {
      jobSkills: { include: { skill: true }, take: 8 },
    },
    orderBy: { postedAt: 'desc' },
    take: limit,
  })
  return res.json(jobs)
})

// Hiring volume over time
router.get('/hiring-volume', async (req: Request, res: Response) => {
  const role = (req.query.role as string) || ''
  const days = parseInt((req.query.days as string) || '60', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const results = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT DATE_TRUNC('day', "postedAt") AS day, COUNT(*) AS count
    FROM jobs
    WHERE "postedAt" >= ${since}
      AND title ILIKE ${'%' + (role || '') + '%'}
    GROUP BY DATE_TRUNC('day', "postedAt")
    ORDER BY day ASC
  `
  return res.json(results.map((r) => ({ day: r.day, count: Number(r.count) })))
})

// Salary ranges
router.get('/salary-ranges', async (req: Request, res: Response) => {
  const role = (req.query.role as string) || ''
  const days = parseInt((req.query.days as string) || '90', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const results = await prisma.$queryRaw<{
    title: string
    avg_min: number
    avg_max: number
    sample_count: bigint
  }[]>`
    SELECT
      title,
      ROUND(AVG("salaryMin")) AS avg_min,
      ROUND(AVG("salaryMax")) AS avg_max,
      COUNT(*) AS sample_count
    FROM jobs
    WHERE "postedAt" >= ${since}
      AND "salaryMin" IS NOT NULL
      AND "salaryMax" IS NOT NULL
      AND title ILIKE ${'%' + (role || '') + '%'}
    GROUP BY title
    ORDER BY avg_max DESC
    LIMIT 10
  `
  return res.json(
    results.map((r) => ({
      title: r.title,
      avgMin: Number(r.avg_min),
      avgMax: Number(r.avg_max),
      sampleCount: Number(r.sample_count),
    }))
  )
})

// Skill gap analysis (authenticated)
router.get('/skill-gap', requireAuth, async (req: AuthRequest, res: Response) => {
  const role = (req.query.role as string) || 'Backend Engineer'
  const days = parseInt((req.query.days as string) || '90', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Get total jobs for this role
  const totalJobs = await prisma.job.count({
    where: {
      postedAt: { gte: since },
      title: { contains: role, mode: 'insensitive' },
    },
  })

  // Get market skill demand
  const marketSkills = await prisma.$queryRaw<{ skill_id: string; skill_name: string; category: string; count: bigint }[]>`
    SELECT s.id AS skill_id, s.name AS skill_name, s.category, COUNT(DISTINCT js."jobId") AS count
    FROM job_skills js
    JOIN skills s ON s.id = js."skillId"
    JOIN jobs j ON j.id = js."jobId"
    WHERE j."postedAt" >= ${since}
      AND j.title ILIKE ${'%' + role + '%'}
    GROUP BY s.id, s.name, s.category
    ORDER BY count DESC
    LIMIT 20
  `

  // Get user's skills
  const userSkills = await prisma.userSkill.findMany({
    where: { userId: req.userId },
    select: { skillId: true, level: true },
  })
  const userSkillIds = new Set(userSkills.map((us) => us.skillId))

  const result = marketSkills.map((ms) => ({
    skillId: ms.skill_id,
    skill: ms.skill_name,
    category: ms.category,
    count: Number(ms.count),
    demandPct: totalJobs > 0 ? Math.round((Number(ms.count) / totalJobs) * 100) : 0,
    hasSkill: userSkillIds.has(ms.skill_id),
  }))

  const gaps = result.filter((r) => !r.hasSkill)
  const strengths = result.filter((r) => r.hasSkill)
  const coverageScore = totalJobs > 0 ? Math.round((strengths.length / result.length) * 100) : 0

  return res.json({ role, totalJobs, coverageScore, gaps, strengths, all: result })
})

export default router
