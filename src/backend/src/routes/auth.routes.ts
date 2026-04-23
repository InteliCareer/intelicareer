import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { sendEmail } from '../services/email'

const router = Router()

// ── Validation schemas ──────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
})

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().max(128),
})

// ── Token helpers ───────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes

function signTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
  return { accessToken, refreshToken }
}

function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.ip || req.socket.remoteAddress || 'unknown'
}

// ── Register ────────────────────────────────────────────────────
const VERIFY_TOKEN_TTL_MS = 5 * 60 * 1000 // 5 minutes

router.post('/register', async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body)
  if (!result.success) {
    const errors = result.error.flatten()
    const message = Object.values(errors.fieldErrors).flat().join('. ')
    return res.status(400).json({ error: message || 'Invalid input' })
  }

  const { email, password, name } = result.data
  const normalizedEmail = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing && existing.emailVerified) {
    return res.status(409).json({ error: 'Unable to create account with this email' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const verifyToken = generateVerifyToken()
  const verifyExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)

  // If the account exists but is unverified, refresh it (new password + new
  // verification token) instead of blocking. This unblocks the common case
  // where the previous token expired before the user could click the link.
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          name: name.trim(),
          emailVerifyToken: verifyToken,
          emailVerifyExpires: verifyExpires,
        },
        select: { id: true, email: true, name: true, createdAt: true },
      })
    : await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: name.trim(),
          emailVerifyToken: verifyToken,
          emailVerifyExpires: verifyExpires,
          profile: { create: {} },
        },
        select: { id: true, email: true, name: true, createdAt: true },
      })

  // Send verification email — link includes email so the verify step proves
  // the click came from the owner of this address (token-plus-email binding).
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(normalizedEmail)}`

  try {
    await sendEmail({
      userId: user.id,
      to: normalizedEmail,
      subject: 'Verify your InteliCareer account',
      type: 'email_verification',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:40px;height:40px;background:#6366f1;border-radius:10px;line-height:40px;color:white;font-weight:bold;font-size:18px;">I</div>
          </div>
          <h2 style="color:#818cf8;margin:0 0 8px;text-align:center;">Welcome, ${name}!</h2>
          <p style="color:#94a3b8;text-align:center;margin:0 0 24px;">Verify your email to activate your account.</p>
          <div style="text-align:center;">
            <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Verify Email
            </a>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin-top:24px;">
            This link expires in 5 minutes.<br/>
            If you didn't create this account, ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
          <p style="color:#475569;font-size:11px;text-align:center;">
            Can't click the button? Copy this link:<br/>
            <span style="color:#818cf8;word-break:break-all;">${verifyUrl}</span>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[Auth] Verification email failed:', err)
  }

  return res.status(201).json({
    message: 'Account created. Check your email to verify.',
    user,
    pendingVerification: true,
  })
})

// ── Verify Email ────────────────────────────────────────────────
router.post('/verify-email', async (req: Request, res: Response) => {
  const { token, email } = req.body
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Verification token is required' })
  }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  // Constant-ish shape of error messages to avoid leaking which half is wrong.
  const invalid = () => res.status(400).json({ error: 'Invalid or expired verification link' })
  if (!user || user.emailVerifyToken !== token) return invalid()
  if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
    return res.status(400).json({ error: 'Verification link has expired. Please register again to get a new one.' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  })

  const tokens = signTokens(user.id)
  return res.json({
    message: 'Email verified successfully',
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
  })
})

// ── Resend Verification ─────────────────────────────────────────
router.post('/resend-verification', async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })

  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  // Always return success to prevent email enumeration
  if (!user || user.emailVerified) {
    return res.json({ message: 'If the email exists and is unverified, a new link was sent.' })
  }

  const verifyToken = generateVerifyToken()
  const verifyExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS)

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: verifyToken, emailVerifyExpires: verifyExpires },
  })

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(normalizedEmail)}`

  try {
    await sendEmail({
      userId: user.id,
      to: normalizedEmail,
      subject: 'Verify your InteliCareer account',
      type: 'email_verification',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
          <h2 style="color:#818cf8;text-align:center;">Verify Your Email</h2>
          <div style="text-align:center;margin:24px 0;">
            <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              Verify Email
            </a>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;">Expires in 5 minutes.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[Auth] Resend verification email failed:', err)
  }

  return res.json({ message: 'If the email exists and is unverified, a new link was sent.' })
})

// ── Login ───────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' })
  }

  const { email, password } = result.data
  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  if (!user) {
    // Timing-safe: still hash to prevent timing attacks
    await bcrypt.hash(password, 12)
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return res.status(423).json({
      error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
    })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1
    const update: any = { failedLoginAttempts: attempts }

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
      update.failedLoginAttempts = 0
    }

    await prisma.user.update({ where: { id: user.id }, data: update })

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      return res.status(423).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' })
    }

    return res.status(401).json({ error: 'Invalid email or password' })
  }

  // Check email verification
  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Please verify your email before logging in.',
      pendingVerification: true,
      email: user.email,
    })
  }

  // Successful login — reset counters
  const clientIp = getClientIp(req)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: clientIp,
    },
  })

  const tokens = signTokens(user.id)
  return res.json({
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
  })
})

// ── Forgot Password ─────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Always return success to prevent email enumeration
  const genericMsg = 'If an account with that email exists, a reset link was sent.'

  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    return res.json({ message: genericMsg })
  }

  const resetToken = generateVerifyToken()
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: resetToken, passwordResetExpires: resetExpires },
  })

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

  try {
    await sendEmail({
      userId: user.id,
      to: normalizedEmail,
      subject: 'Reset your InteliCareer password',
      type: 'password_reset',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:40px;height:40px;background:#6366f1;border-radius:10px;line-height:40px;color:white;font-weight:bold;font-size:18px;">I</div>
          </div>
          <h2 style="color:#818cf8;margin:0 0 8px;text-align:center;">Password Reset</h2>
          <p style="color:#94a3b8;text-align:center;margin:0 0 24px;">
            Hi ${user.name}, we received a request to reset your password.
          </p>
          <div style="text-align:center;">
            <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Reset Password
            </a>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin-top:24px;">
            This link expires in 1 hour.<br/>
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
          <p style="color:#475569;font-size:11px;text-align:center;">
            Can't click the button? Copy this link:<br/>
            <span style="color:#818cf8;word-break:break-all;">${resetUrl}</span>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[Auth] Password reset email failed:', err)
  }

  return res.json({ message: genericMsg })
})

// ── Reset Password ──────────────────────────────────────────────
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
})

router.post('/reset-password', async (req: Request, res: Response) => {
  const result = resetPasswordSchema.safeParse(req.body)
  if (!result.success) {
    const message = Object.values(result.error.flatten().fieldErrors).flat().join('. ')
    return res.status(400).json({ error: message || 'Invalid input' })
  }

  const { token, password } = result.data

  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } })
  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired reset link' })
  }

  if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' })
  }

  // Don't allow reusing the same password
  const isSamePassword = await bcrypt.compare(password, user.passwordHash)
  if (isSamePassword) {
    return res.status(400).json({ error: 'New password must be different from the old one' })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })

  return res.json({ message: 'Password reset successfully. You can now log in.' })
})

// ── Refresh Token ───────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' })
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string }

    // Verify user still exists and is verified
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.emailVerified) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const tokens = signTokens(payload.userId)
    return res.json(tokens)
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
})

export default router
