'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'
import Link from 'next/link'
import { Mail, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [resendSent, setResendSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setPendingVerification(false)
    try {
      const { data } = await authApi.login({ email, password })
      login(data.user, data.accessToken, data.refreshToken)
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; pendingVerification?: boolean; email?: string } } }
      if (e.response?.data?.pendingVerification) {
        setPendingVerification(true)
        setPendingEmail(e.response.data.email || email)
      } else {
        setError(e.response?.data?.error || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    try {
      await authApi.resendVerification(pendingEmail)
      setResendSent(true)
    } catch {
      // Silently handle
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold text-gray-100">InteliCareer</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Welcome back</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your career dashboard</p>
        </div>

        <div className="card p-8">
          {/* Pending verification banner */}
          {pendingVerification && (
            <div className="mb-5 p-4 bg-amber-900/20 border border-amber-700/40 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-200 font-medium">Email not verified</p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    Check your inbox at <strong>{pendingEmail}</strong> for the verification link.
                  </p>
                  {!resendSent ? (
                    <button
                      onClick={handleResendVerification}
                      className="text-xs text-amber-300 hover:text-amber-200 mt-2 underline"
                    >
                      Resend verification email
                    </button>
                  ) : (
                    <p className="text-xs text-emerald-400 mt-2">Verification email resent!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-surface-border text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-gray-500 hover:text-brand-400 transition"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          No account?{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
