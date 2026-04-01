'use client'

import { useState, useMemo } from 'react'
import { authApi } from '@/lib/api'
import Link from 'next/link'
import { Check, X, Mail, Eye, EyeOff } from 'lucide-react'

interface PasswordCheck {
  label: string
  test: (pw: string) => boolean
}

const PASSWORD_CHECKS: PasswordCheck[] = [
  { label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { label: 'Lowercase letter', test: pw => /[a-z]/.test(pw) },
  { label: 'Uppercase letter', test: pw => /[A-Z]/.test(pw) },
  { label: 'Number', test: pw => /[0-9]/.test(pw) },
  { label: 'Special character (!@#$...)', test: pw => /[^a-zA-Z0-9]/.test(pw) },
]

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_CHECKS.filter(c => c.test(password)).length
    return { passed, total: PASSWORD_CHECKS.length, pct: Math.round((passed / PASSWORD_CHECKS.length) * 100) }
  }, [password])

  const strengthColor = passwordStrength.pct <= 40 ? 'bg-red-500' :
    passwordStrength.pct <= 60 ? 'bg-orange-500' :
    passwordStrength.pct <= 80 ? 'bg-yellow-500' : 'bg-emerald-500'

  const allValid = passwordStrength.passed === passwordStrength.total

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allValid) {
      setError('Please meet all password requirements')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.register({ name, email, password })
      if (data.pendingVerification) {
        setPendingVerification(true)
        setRegisteredEmail(email)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    try {
      await authApi.resendVerification(registeredEmail)
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch {
      // Silently handle
    }
  }

  // ── Pending verification screen ─────────────────────────────
  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-900/40 border border-brand-700/50 mb-6">
            <Mail className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Check your email</h1>
          <p className="text-gray-400 mb-6">
            We sent a verification link to<br />
            <span className="text-gray-200 font-medium">{registeredEmail}</span>
          </p>
          <div className="card p-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-brand-400 text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-gray-300">Open the email from InteliCareer</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-brand-400 text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-gray-300">Click the <strong>Verify Email</strong> button</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-brand-400 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-300">You'll be redirected to your dashboard</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-brand-400 hover:text-brand-300 disabled:text-gray-600 transition"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
            </button>
            <p className="text-xs text-gray-600">
              Check your spam folder if you don't see it.
            </p>
          </div>

          <p className="text-gray-500 text-sm mt-8">
            Wrong email?{' '}
            <button onClick={() => setPendingVerification(false)} className="text-brand-400 hover:text-brand-300">
              Go back
            </button>
          </p>
        </div>
      </div>
    )
  }

  // ── Registration form ───────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold text-gray-100">InteliCareer</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Start tracking your career with intelligence</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                type="text"
                placeholder="Deborah Colicchio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={128}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${passwordStrength.pct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {PASSWORD_CHECKS.map(({ label, test }) => {
                      const ok = test(password)
                      return (
                        <div key={label} className="flex items-center gap-1.5">
                          {ok ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <X className="w-3 h-3 text-gray-600" />
                          )}
                          <span className={`text-xs ${ok ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading || !allValid}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-gray-600 mt-4 text-center">
            By creating an account, you agree that your data is stored securely and used only for your job search.
          </p>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
