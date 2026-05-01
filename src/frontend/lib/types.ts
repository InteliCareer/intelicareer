// Shared frontend types for the Auto Apply feature. Anything imported from
// here must stay flat (no React, no axios) so it can be reused by any client
// component or the chat panel without circular imports.

export interface Job {
  id: string
  title: string
  company: string
  location: string | null
  isRemote: boolean
  workMode?: string
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  description: string | null
  applyUrl: string | null
  sourceUrl: string | null
  tags: string | null
  visaSponsorship: boolean
  source: string
  postedAt: string
  scrapedAt: string
  autoApplyStatus: string
  evaluationGrade?: string | null
  evaluationScore?: number | null
  evaluationJson?: string | null
}

export interface ResumeInfo {
  hasResume: boolean
  fileName?: string
  uploadedAt?: string
}

export interface ProfileState {
  targetRole: string | null
  yearsExperience: number | null
  isRemotePreferred: boolean
  targetLocation: string | null
}

export interface Portal {
  key: string
  company: string
  ats: 'greenhouse' | 'lever' | 'ashby'
  category: 'ai' | 'devtools' | 'fintech' | 'bigtech' | 'other'
}

export interface EvaluationData {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
  summary: string
  breakdown: {
    skills:   { score: number; matched: string[]; missing: string[] }
    role:     { score: number; reason: string }
    location: { score: number; reason: string }
    bonuses:  { score: number; reasons: string[] }
  }
}

export interface ScraperStats {
  total: number
  remote: number
  withVisa: number
  lastScrape: string | null
  bySource: { source: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

export interface AutoApplyStats {
  total: number
  applied: number
  queued: number
  errors: number
  saved: number
  skipped?: number
}

export const GRADE_STYLES: Record<string, string> = {
  A: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/60',
  B: 'bg-lime-900/40 text-lime-300 border-lime-600/60',
  C: 'bg-amber-900/40 text-amber-300 border-amber-600/60',
  D: 'bg-orange-900/40 text-orange-300 border-orange-600/60',
  F: 'bg-red-900/40 text-red-300 border-red-600/60',
}

export const SOURCE_COLORS: Record<string, string> = {
  remotive:   'bg-green-900/40 text-green-300 border-green-700/50',
  arbeitnow:  'bg-blue-900/40 text-blue-300 border-blue-700/50',
  remoteok:   'bg-purple-900/40 text-purple-300 border-purple-700/50',
  greenhouse: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  lever:      'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
  ashby:      'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
  seed:       'bg-slate-700/40 text-slate-300 border-slate-600/50',
}

export function sourceColor(source: string) {
  return SOURCE_COLORS[source] || SOURCE_COLORS.seed
}
