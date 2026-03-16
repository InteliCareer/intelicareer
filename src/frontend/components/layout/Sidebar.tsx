'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Zap,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react'

const navItems = [
  { label: 'Overview',   href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Tracker',    href: '/tracker',     icon: Briefcase },
  { label: 'Market',     href: '/market',      icon: TrendingUp },
  { label: 'Skill Gap',  href: '/skills',      icon: Zap },
  { label: 'Insights',   href: '/insights',    icon: BarChart3 },
  { label: 'Resume',     href: '/resume',      icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen bg-surface-card border-r border-surface-border">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">I</span>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-100 leading-none">InteliCareer</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Career Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-100',
                active
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-600/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-elevated'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-surface-border pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-surface-elevated transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>

        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-brand-200">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-300 truncate">{user.name}</div>
              <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
