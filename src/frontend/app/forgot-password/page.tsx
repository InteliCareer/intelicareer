'use client'

import { useState } from 'react'
import { authApi } from '@/lib/api'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-900/40 border border-brand-700/50 mb-6">
            <Mail className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Check your email</h1>
          <p className="text-gray-400 mb-2">
            If an account exists for <span className="text-gray-200 font-medium">{email}</span>,
            we sent a password reset link.
          </p>
          <p className="text-sm text-gray-500 mb-8">The link expires in 1 hour.</p>

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
              <p className="text-sm text-gray-300">Click <strong>Reset Password</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-brand-400 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-300">Choose a new password and you're in</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => setSent(false)}
              className="text-sm text-brand-400 hover:text-brand-300 transition"
            >
              Try a different email
            </button>
            <p className="text-xs text-gray-600">Check your spam folder if you don't see it.</p>
          </div>

          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mt-8 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
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
          <h1 className="text-2xl font-bold text-gray-100">Forgot your password?</h1>
          <p className="text-gray-500 mt-1 text-sm">Enter your email and we'll send a reset link</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
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
