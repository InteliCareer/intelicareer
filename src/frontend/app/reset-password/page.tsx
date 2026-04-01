'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api'
import Link from 'next/link'
import { Check, X, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'

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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_CHECKS.filter(c => c.test(password)).length
    return { passed, total: PASSWORD_CHECKS.length, pct: Math.round((passed / PASSWORD_CHECKS.length) * 100) }
  }, [password])

  const strengthColor = passwordStrength.pct <= 40 ? 'bg-red-500' :
    passwordStrength.pct <= 60 ? 'bg-orange-500' :
    passwordStrength.pct <= 80 ? 'bg-yellow-500' : 'bg-emerald-500'

  const allValid = passwordStrength.passed === passwordStrength.total
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/40 border border-red-700/50 mb-6">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Invalid Reset Link</h1>
          <p className="text-gray-400 mb-6">This link is missing a reset token.</p>
          <Link href="/forgot-password" className="btn-primary inline-block px-6 py-2">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allValid) { setError('Please meet all password requirements'); return }
    if (!passwordsMatch) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword(token!, password)
      setSuccess(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-700/50 mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Password Reset!</h1>
          <p className="text-gray-400 mb-6">Your password has been changed successfully.</p>
          <Link href="/login" className="btn-primary inline-block px-8 py-2.5">
            Sign in with new password
          </Link>
        </div>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-gray-100">Set a new password</h1>
          <p className="text-gray-500 mt-1 text-sm">Choose a strong password for your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">New password</label>
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
                  autoFocus
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
                          {ok ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-gray-600" />}
                          <span className={`text-xs ${ok ? 'text-emerald-400' : 'text-gray-500'}`}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm new password</label>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                maxLength={128}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  {passwordsMatch ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-emerald-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-red-400">Passwords do not match</span>
                    </>
                  )}
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
              disabled={loading || !allValid || !passwordsMatch}
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
