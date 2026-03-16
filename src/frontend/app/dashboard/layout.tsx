'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { userApi } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, login, setUser } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.replace('/login')
      return
    }

    // Rehydrate user on refresh
    if (!isAuthenticated) {
      userApi.me()
        .then(({ data }) => {
          setUser(data)
        })
        .catch(() => {
          router.replace('/login')
        })
    }
  }, [isAuthenticated, router, setUser, login])

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
