import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/users.routes'
import applicationRoutes from './routes/applications.routes'
import skillRoutes from './routes/skills.routes'
import marketRoutes from './routes/market.routes'
import scraperRoutes from './routes/scraper.routes'
import autoApplyRoutes from './routes/autoApply.routes'
import resumeRoutes from './routes/resume.routes'
``
const app = express()
const PORT = process.env.PORT || 3001

// ── Security headers ────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Next.js handles its own CSP
  crossOriginEmbedderPolicy: false,
}))

// ── Trust proxy (for Railway / Vercel) ──────────────────────────
app.set('trust proxy', 1)

// ── CORS ────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://intelicareer-kbu6.vercel.app',
  'http://localhost:3000',
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc in dev)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600, // Cache preflight for 10 min
}))
app.options('*', cors())

// ── Body parser with size limit ─────────────────────────────────
app.use(express.json({ limit: '1mb' }))

// ── Rate limiters ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 auth attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please wait 15 minutes.' },
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for']
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
    return req.ip || req.socket.remoteAddress || 'unknown'
  },
  validate: { keyGeneratorIpFallback: false },
})

const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 scrapes per hour
  message: { error: 'Scrape rate limit reached. Try again in an hour.' },
})

app.use('/api', globalLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)
app.use('/api/auth/reset-password', authLimiter)
app.use('/api/scraper/run', scrapeLimiter)

// ── Health check ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/market', marketRoutes)
app.use('/api/scraper', scraperRoutes)
app.use('/api/auto-apply', autoApplyRoutes)
app.use('/api/resume', resumeRoutes)

// ── 404 ─────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ── Error handler (no stack traces in production) ───────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  res.status(500).json({ error: message })
})

app.listen(PORT, () => {
  console.log(`InteliCareer API running on http://localhost:${PORT}`)
})

export default app
