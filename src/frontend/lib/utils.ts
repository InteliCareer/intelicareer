import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STAGE_LABELS: Record<string, string> = {
  BOOKMARKED:  'Bookmarked',
  APPLIED:     'Applied',
  SCREENING:   'Screening',
  INTERVIEWING:'Interviewing',
  OFFER:       'Offer',
  ACCEPTED:    'Accepted',
  REJECTED:    'Rejected',
  WITHDRAWN:   'Withdrawn',
}

export const STAGE_COLORS: Record<string, string> = {
  BOOKMARKED:   'bg-slate-600',
  APPLIED:      'bg-blue-600',
  SCREENING:    'bg-indigo-500',
  INTERVIEWING: 'bg-violet-600',
  OFFER:        'bg-emerald-600',
  ACCEPTED:     'bg-green-600',
  REJECTED:     'bg-red-600',
  WITHDRAWN:    'bg-gray-600',
}

export const STAGE_DOT: Record<string, string> = {
  BOOKMARKED:   'bg-slate-400',
  APPLIED:      'bg-blue-400',
  SCREENING:    'bg-indigo-400',
  INTERVIEWING: 'bg-violet-400',
  OFFER:        'bg-emerald-400',
  ACCEPTED:     'bg-green-400',
  REJECTED:     'bg-red-400',
  WITHDRAWN:    'bg-gray-400',
}

export const PRIORITY_COLORS: Record<string, string> = {
  LOW:    'text-slate-400 border-slate-600',
  MEDIUM: 'text-blue-400 border-blue-700',
  HIGH:   'text-orange-400 border-orange-700',
  DREAM:  'text-yellow-400 border-yellow-600',
}

export const STAGE_ORDER = [
  'BOOKMARKED',
  'APPLIED',
  'SCREENING',
  'INTERVIEWING',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
]

export function formatSalary(min?: number, max?: number, currency = 'USD') {
  if (!min && !max) return null
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `${fmt(min)}+`
  return fmt(max!)
}

export function timeAgo(date: string | Date) {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export const SKILL_CATEGORY_COLORS: Record<string, string> = {
  LANGUAGE:    'bg-blue-900/40 text-blue-300 border border-blue-700/50',
  FRAMEWORK:   'bg-violet-900/40 text-violet-300 border border-violet-700/50',
  DATABASE:    'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
  CLOUD:       'bg-sky-900/40 text-sky-300 border border-sky-700/50',
  DEVOPS:      'bg-orange-900/40 text-orange-300 border border-orange-700/50',
  TOOL:        'bg-slate-700/60 text-slate-300 border border-slate-600/50',
  SOFT_SKILL:  'bg-pink-900/40 text-pink-300 border border-pink-700/50',
  METHODOLOGY: 'bg-teal-900/40 text-teal-300 border border-teal-700/50',
  OTHER:       'bg-gray-700/40 text-gray-300 border border-gray-600/50',
}
