import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const UPLOAD_DIR = path.join(__dirname, '../../uploads/resumes')

// Ensure upload dir exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname)
    const safeName = `${req.userId}-${Date.now()}${ext}`
    cb(null, safeName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and Word documents are allowed'))
    }
  },
})

// POST /api/resume/upload — Upload resume
router.post('/upload', upload.single('resume'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  // Delete old resume if exists
  const profile = await prisma.userProfile.findUnique({ where: { userId: req.userId! } })
  if (profile?.resumePath) {
    const oldPath = path.join(UPLOAD_DIR, profile.resumePath)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }

  await prisma.userProfile.upsert({
    where: { userId: req.userId! },
    update: {
      resumePath: req.file.filename,
      resumeName: req.file.originalname,
      resumeUploadedAt: new Date(),
    },
    create: {
      userId: req.userId!,
      resumePath: req.file.filename,
      resumeName: req.file.originalname,
      resumeUploadedAt: new Date(),
    },
  })

  return res.json({
    message: 'Resume uploaded successfully',
    fileName: req.file.originalname,
    uploadedAt: new Date().toISOString(),
  })
})

// GET /api/resume — Get resume info
router.get('/', async (req: AuthRequest, res: Response) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId! },
    select: { resumePath: true, resumeName: true, resumeUploadedAt: true },
  })

  if (!profile?.resumePath) {
    return res.json({ hasResume: false })
  }

  return res.json({
    hasResume: true,
    fileName: profile.resumeName,
    uploadedAt: profile.resumeUploadedAt,
  })
})

// GET /api/resume/download — Download resume file
router.get('/download', async (req: AuthRequest, res: Response) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId! },
    select: { resumePath: true, resumeName: true },
  })

  if (!profile?.resumePath) {
    return res.status(404).json({ error: 'No resume uploaded' })
  }

  const filePath = path.join(UPLOAD_DIR, profile.resumePath)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Resume file not found' })
  }

  res.download(filePath, profile.resumeName || 'resume.pdf')
})

// DELETE /api/resume — Remove resume
router.delete('/', async (req: AuthRequest, res: Response) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.userId! },
    select: { resumePath: true },
  })

  if (profile?.resumePath) {
    const filePath = path.join(UPLOAD_DIR, profile.resumePath)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  await prisma.userProfile.update({
    where: { userId: req.userId! },
    data: { resumePath: null, resumeName: null, resumeUploadedAt: null },
  })

  return res.json({ message: 'Resume removed' })
})

export default router
