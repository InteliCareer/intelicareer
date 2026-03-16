import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  targetRole: z.string().optional(),
  targetLocation: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  isRemotePreferred: z.boolean().optional(),
  bio: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
})

router.get('/me', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, name: true, createdAt: true,
      profile: true,
      _count: { select: { applications: true, userSkills: true } },
    },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  return res.json(user)
})

router.put('/me', async (req: AuthRequest, res: Response) => {
  const result = profileSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.flatten() })

  const { name, ...profileData } = result.data

  await prisma.$transaction([
    ...(name ? [prisma.user.update({ where: { id: req.userId }, data: { name } })] : []),
    prisma.userProfile.upsert({
      where: { userId: req.userId! },
      update: profileData,
      create: { userId: req.userId!, ...profileData },
    }),
  ])

  const updated = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, profile: true },
  })
  return res.json(updated)
})

router.get('/me/skills', async (req: AuthRequest, res: Response) => {
  const skills = await prisma.userSkill.findMany({
    where: { userId: req.userId },
    include: { skill: true },
    orderBy: { addedAt: 'desc' },
  })
  return res.json(skills)
})

router.post('/me/skills', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    skillId: z.string().uuid(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
    yearsUsed: z.number().min(0).optional(),
  })
  const result = schema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.flatten() })

  const { skillId, level, yearsUsed } = result.data
  const userSkill = await prisma.userSkill.upsert({
    where: { userId_skillId: { userId: req.userId!, skillId } },
    update: { ...(level && { level }), ...(yearsUsed !== undefined && { yearsUsed }) },
    create: { userId: req.userId!, skillId, level: level || 'INTERMEDIATE', yearsUsed },
    include: { skill: true },
  })
  return res.status(201).json(userSkill)
})

router.delete('/me/skills/:skillId', async (req: AuthRequest, res: Response) => {
  const { skillId } = req.params
  await prisma.userSkill.deleteMany({
    where: { userId: req.userId, skillId },
  })
  return res.status(204).send()
})

export default router
