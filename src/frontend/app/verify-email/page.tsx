'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

// useSearchParams forces dynamic rendering — wrap the inner component in a
// Suspense boundary so Next.js can statically prerender the loading shell.
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailInner />
    </Suspense>
  )
}

function VerifyEmailFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md text-center">
        <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-100">Loading…</h1>
      </div>
    </div>
  )
}

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    if (!token || !email) {
      setStatus('error')
      setMessage('Verification link is missing its token or email.')
      return
    }

    authApi.verifyEmail(token, email)
      .then(({ data }) => {
        setStatus('success')
        setMessage(data.message || 'Email verified!')
        // Auto-login after verification
        if (data.accessToken) {
          login(data.user, data.accessToken, data.refreshToken)
          setTimeout(() => router.push('/dashboard'), 2000)
        }
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Verification failed.')
      })
  }, [searchParams, login, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-100">Verifying your email...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-700/50 mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Email Verified!</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/40 border border-red-700/50 mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Verification Failed</h1>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/register"
                className="btn-primary inline-block px-6 py-2"
              >
                Register again
              </Link>
              <p className="text-sm text-gray-500">
                Or <Link href="/login" className="text-brand-400 hover:text-brand-300">sign in</Link> if you already verified.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
