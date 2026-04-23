'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { scraperApi, autoApplyApi, resumeApi, userApi } from '@/lib/api'
import { formatSalary, timeAgo } from '@/lib/utils'
import {
  Rocket, RefreshCw, Search, ExternalLink, Check,
  X, Loader2, Globe, Shield, ChevronDown, ChevronUp,
  Upload, FileText, Trash2, Download, MapPin, Building2,
  Target, Link2, Sparkles, Award, Bookmark, Bot,
} from 'lucide-react'
import ChatPanel from './ChatPanel'

interface Job {
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

interface Portal {
  key: string
  company: string
  ats: 'greenhouse' | 'lever' | 'ashby'
  category: 'ai' | 'devtools' | 'fintech' | 'bigtech' | 'other'
}

interface EvaluationData {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
  summary: string
  breakdown: {
    skills: { score: number; matched: string[]; missing: string[] }
    role: { score: number; reason: string }
    location: { score: number; reason: string }
    bonuses: { score: number; reasons: string[] }
  }
}

interface Stats {
  total: number
  remote: number
  withVisa: number
  lastScrape: string | null
  bySource: { source: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

interface AutoApplyStats {
  total: number
  applied: number
  queued: number
  errors: number
  saved: number
}

interface ResumeInfo {
  hasResume: boolean
  fileName?: string
  uploadedAt?: string
}

export default function AutoApplyPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [applyStats, setApplyStats] = useState<AutoApplyStats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [applying, setApplying] = useState<Record<string, boolean>>({})
  const [bulkApplying, setBulkApplying] = useState(false)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

  // Search is driven entirely by the chat panel now.
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'eligible' | 'saved' | 'applied' | 'all'>('eligible')

  // Resume
  const [resume, setResume] = useState<ResumeInfo | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // User profile (for chat onboarding)
  const [profile, setProfile] = useState<{
    targetRole: string | null
    yearsExperience: number | null
    isRemotePreferred: boolean
    targetLocation: string | null
  } | null>(null)

  // Portal Scanner
  const [portals, setPortals] = useState<Portal[]>([])
  const [selectedPortals, setSelectedPortals] = useState<Set<string>>(new Set())
  const [portalCategory, setPortalCategory] = useState<string>('all')
  const [scanning, setScanning] = useState(false)
  const [showPortalPanel, setShowPortalPanel] = useState(false)

  // Paste URL
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)

  // Evaluation
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({})
  const [evalOpen, setEvalOpen] = useState<string | null>(null)
  const [evalData, setEvalData] = useState<Record<string, EvaluationData>>({})

  // Apply-confirmation dialog (asked after the user clicks Apply + we open the URL)
  const [confirmApplyJob, setConfirmApplyJob] = useState<Job | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Saving / bookmarking
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})

  // Debounce the chat-driven search so we don't hammer the API per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Track whether the user has triggered anything yet — page arrives empty.
  const [hasInteracted, setHasInteracted] = useState(false)

  const fetchJobs = useCallback(async (opts?: { force?: boolean }) => {
    // Start the page clean — only fetch once the user has interacted
    // (switched tab, searched, or triggered a chat action).
    if (!opts?.force && !hasInteracted && !debouncedSearch && tab === 'eligible') {
      setJobs([])
      setTotal(0)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (tab === 'eligible') params.status = 'ELIGIBLE'
      else if (tab === 'applied') params.status = 'APPLIED'
      else if (tab === 'saved') params.status = 'SAVED'

      const { data } = await scraperApi.jobs(params)
      setJobs(data.jobs)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    }
    setLoading(false)
  }, [debouncedSearch, tab, hasInteracted])

  const fetchStats = useCallback(async () => {
    try {
      const [scraperRes, applyRes] = await Promise.all([
        scraperApi.stats(),
        autoApplyApi.stats(),
      ])
      setStats(scraperRes.data)
      setApplyStats(applyRes.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  const fetchResume = useCallback(async () => {
    try {
      const { data } = await resumeApi.info()
      setResume(data)
    } catch {
      setResume({ hasResume: false })
    }
  }, [])

  const fetchPortals = useCallback(async () => {
    try {
      const { data } = await scraperApi.portals()
      setPortals(data.portals)
    } catch (err) {
      console.error('Failed to fetch portals:', err)
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await userApi.me()
      const p = data.profile
      setProfile({
        targetRole: p?.targetRole ?? null,
        yearsExperience: p?.yearsExperience ?? null,
        isRemotePreferred: !!p?.isRemotePreferred,
        targetLocation: p?.targetLocation ?? null,
      })
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchResume() }, [fetchResume])
  useEffect(() => { fetchPortals() }, [fetchPortals])
  useEffect(() => { fetchProfile() }, [fetchProfile])

  // Hydrate evalData from already-evaluated jobs the server returned
  useEffect(() => {
    for (const j of jobs) {
      if (j.evaluationJson && !evalData[j.id]) {
        try {
          const parsed: EvaluationData = JSON.parse(j.evaluationJson)
          setEvalData(prev => ({ ...prev, [j.id]: parsed }))
        } catch { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs])

  const [scrapeMode, setScrapeMode] = useState<'europe' | 'global'>('europe')

  async function handleScrape(mode: 'europe' | 'global') {
    setScraping(true)
    setScrapeMode(mode)
    try {
      const { data } = await scraperApi.run(mode)
      await fetchJobs()
      await fetchStats()
      alert(`Scrape complete: ${data.totalNew} new jobs found (${mode})`)
    } catch (err) {
      console.error('Scrape failed:', err)
    }
    setScraping(false)
  }

  async function handleUploadResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await resumeApi.upload(file)
      await fetchResume()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Upload failed')
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDownloadResume() {
    try {
      const { data } = await resumeApi.download()
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = resume?.fileName || 'resume.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Download failed')
    }
  }

  async function handleRemoveResume() {
    if (!confirm('Remove your resume?')) return
    try {
      await resumeApi.remove()
      setResume({ hasResume: false })
    } catch {
      alert('Failed to remove resume')
    }
  }

  function handleApply(jobId: string) {
    // New flow: open the URL for the user, then ask "Did you apply?".
    // Only records the application on confirmation — keeps the Applied tab
    // honest (vs. marking every click as applied).
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const url = job.applyUrl || job.sourceUrl
    if (url) window.open(url, '_blank')
    setConfirmApplyJob(job)
  }

  async function confirmApplied(yes: boolean) {
    const job = confirmApplyJob
    if (!job) return
    if (!yes) {
      setConfirmApplyJob(null)
      return
    }
    setConfirming(true)
    try {
      await autoApplyApi.apply(job.id)
      await fetchJobs({ force: true })
      await fetchStats()
      setConfirmApplyJob(null)
      setTab('applied')
      setHasInteracted(true)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark as applied')
    }
    setConfirming(false)
  }

  async function handleSave(jobId: string) {
    setSavingMap(prev => ({ ...prev, [jobId]: true }))
    try {
      await autoApplyApi.toggleSave(jobId)
      await fetchJobs({ force: true })
      await fetchStats()
    } catch (err) {
      console.error('Save failed:', err)
    }
    setSavingMap(prev => ({ ...prev, [jobId]: false }))
  }

  async function handleBulkApply() {
    if (selectedJobs.size === 0) return
    setBulkApplying(true)
    try {
      const jobIdArray = Array.from(selectedJobs)
      await autoApplyApi.bulkApply(jobIdArray)
      for (const jobId of jobIdArray) {
        const job = jobs.find(j => j.id === jobId)
        if (job?.applyUrl || job?.sourceUrl) {
          window.open(job.applyUrl || job.sourceUrl!, '_blank')
        }
      }
      setSelectedJobs(new Set())
      await fetchJobs()
      await fetchStats()
    } catch (err) {
      console.error('Bulk apply failed:', err)
    }
    setBulkApplying(false)
  }

  async function handleScanPortals() {
    setScanning(true)
    try {
      const keys = selectedPortals.size > 0 ? Array.from(selectedPortals) : undefined
      const { data } = await scraperApi.scanPortals(keys)
      await fetchJobs()
      await fetchStats()
      alert(`Portal scan complete: ${data.totalNew} new jobs from ${data.results.length} companies`)
    } catch (err) {
      console.error('Portal scan failed:', err)
      alert('Portal scan failed')
    }
    setScanning(false)
  }

  function togglePortal(key: string) {
    setSelectedPortals(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAllPortalsInCategory() {
    const keys = filteredPortals.map(p => p.key)
    const allSelected = keys.every(k => selectedPortals.has(k))
    setSelectedPortals(prev => {
      const next = new Set(prev)
      if (allSelected) keys.forEach(k => next.delete(k))
      else keys.forEach(k => next.add(k))
      return next
    })
  }

  async function handleImportUrl() {
    if (!importUrl.trim()) return
    setImporting(true)
    try {
      const { data } = await scraperApi.importUrl(importUrl.trim())
      await fetchJobs()
      await fetchStats()
      setShowUrlModal(false)
      setImportUrl('')
      // Auto-evaluate the freshly imported job
      if (data.job?.id) {
        handleEvaluate(data.job.id)
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Import failed')
    }
    setImporting(false)
  }

  async function handleEvaluate(jobId: string) {
    setEvaluating(prev => ({ ...prev, [jobId]: true }))
    try {
      const { data } = await scraperApi.evaluate(jobId)
      setEvalData(prev => ({ ...prev, [jobId]: data.evaluation }))
      setEvalOpen(jobId)
      // Reflect grade on the card without a full refetch
      setJobs(prev => prev.map(j => j.id === jobId
        ? { ...j, evaluationGrade: data.evaluation.grade, evaluationScore: data.evaluation.score }
        : j))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Evaluation failed')
    }
    setEvaluating(prev => ({ ...prev, [jobId]: false }))
  }

  async function handleSkip(jobId: string) {
    try {
      await autoApplyApi.skip(jobId)
      await fetchJobs()
      await fetchStats()
    } catch (err) {
      console.error('Skip failed:', err)
    }
  }

  function toggleSelect(jobId: string) {
    setSelectedJobs(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  function selectAll() {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(jobs.map(j => j.id)))
    }
  }

  const filteredPortals = portalCategory === 'all'
    ? portals
    : portals.filter(p => p.category === portalCategory)
  const portalCategories: { key: string; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ai', label: 'AI' },
    { key: 'devtools', label: 'Dev Tools' },
    { key: 'fintech', label: 'Fintech' },
    { key: 'bigtech', label: 'Big Tech' },
  ]

  const sourceColors: Record<string, string> = {
    remotive: 'bg-green-900/40 text-green-300 border-green-700/50',
    arbeitnow: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    remoteok: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
    seed: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-brand-400" />
            Auto Apply
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Ask the assistant to scan company boards, import a posting, or score a job.
          </p>
        </div>
        <ResumeChip
          resume={resume}
          uploading={uploading}
          onUpload={() => fileInputRef.current?.click()}
          onDownload={handleDownloadResume}
          onRemove={handleRemoveResume}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleUploadResume}
          className="hidden"
        />
      </div>

      {/* Chat Panel — primary entry point */}
      <ChatPanel
        portals={portals}
        hasResume={!!resume?.hasResume}
        profile={profile}
        onJobsUpdated={() => { setHasInteracted(true); fetchJobs({ force: true }); fetchStats() }}
        onSearchQuery={(q) => { setHasInteracted(true); setSearch(q) }}
        onProfileSaved={fetchProfile}
      />

      {/* Portal Scanner Panel (hidden — kept in case we re-expose later) */}
      {false && showPortalPanel && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-gray-200">Portal Scanner</h3>
              <span className="text-xs text-gray-500">
                Scrape jobs directly from company ATS boards (Greenhouse, Lever, Ashby)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllPortalsInCategory}
                className="text-xs text-gray-400 hover:text-gray-200 transition"
              >
                {filteredPortals.every(p => selectedPortals.has(p.key)) ? 'Deselect all' : 'Select all'}
              </button>
              <button
                onClick={handleScanPortals}
                disabled={scanning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                {scanning ? 'Scanning...' : selectedPortals.size > 0 ? `Scan ${selectedPortals.size} selected` : 'Scan all'}
              </button>
            </div>
          </div>

          <div className="flex gap-1 flex-wrap">
            {portalCategories.map(c => (
              <button
                key={c.key}
                onClick={() => setPortalCategory(c.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  portalCategory === c.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-surface-elevated text-gray-400 hover:text-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {filteredPortals.map(p => {
              const selected = selectedPortals.has(p.key)
              return (
                <button
                  key={p.key}
                  onClick={() => togglePortal(p.key)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs border transition text-left ${
                    selected
                      ? 'bg-indigo-900/40 border-indigo-600 text-indigo-200'
                      : 'bg-surface-elevated border-surface-border text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <span className="font-medium truncate">{p.company}</span>
                  <span className="text-[10px] uppercase text-gray-500 shrink-0">{p.ats}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Single toolbar: tabs + inline stats + search chip */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-surface-card rounded-lg p-1">
          {(['eligible', 'saved', 'applied', 'all'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setHasInteracted(true); setTab(t) }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${
                tab === t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {search && (
          <div className="flex items-center gap-1.5 text-xs bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5">
            <Search className="w-3 h-3 text-brand-400" />
            <span className="font-mono text-brand-300">{search}</span>
            <button
              onClick={() => setSearch('')}
              className="text-gray-500 hover:text-gray-200 transition ml-0.5"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="ml-auto text-xs text-gray-500 flex items-center gap-3">
          <span><span className="text-gray-300 font-medium">{stats?.total ?? 0}</span> jobs</span>
          <span className="text-amber-400"><span className="font-medium">{applyStats?.saved ?? 0}</span> saved</span>
          <span className="text-emerald-400"><span className="font-medium">{stats?.withVisa ?? 0}</span> visa</span>
          <span className="text-blue-400"><span className="font-medium">{applyStats?.applied ?? 0}</span> applied</span>
        </div>
      </div>

      {/* Bulk actions */}
      {tab === 'eligible' && jobs.length > 0 && (
        <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-lg px-4 py-2.5">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedJobs.size === jobs.length && jobs.length > 0}
              onChange={selectAll}
              className="rounded border-gray-600 bg-surface-elevated text-brand-600 focus:ring-brand-500"
            />
            Select all ({selectedJobs.size}/{jobs.length})
          </label>
          <button
            onClick={handleBulkApply}
            disabled={selectedJobs.size === 0 || bulkApplying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-40"
          >
            {bulkApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            Apply to {selectedJobs.size} jobs
          </button>
          <span className="text-xs text-gray-500 ml-auto">
            {total} jobs total
          </span>
        </div>
      )}

      {/* Job List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Bot className="w-10 h-10 mx-auto mb-3 opacity-40 text-brand-400" />
          {!hasInteracted ? (
            <>
              <p className="text-sm text-gray-300">Ready when you are.</p>
              <p className="text-xs text-gray-500 mt-1">
                Use the assistant above to scan company boards, import a URL, or switch tabs to see saved or applied jobs.
              </p>
            </>
          ) : tab === 'saved' ? (
            <p>No saved jobs yet. Click the bookmark on any job to keep it here for later.</p>
          ) : tab === 'applied' ? (
            <p>You haven't marked any jobs applied yet.</p>
          ) : (
            <p>No jobs match your current filter.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJobs.has(job.id)}
              isExpanded={expandedJob === job.id}
              isApplying={applying[job.id] || false}
              isEvaluating={evaluating[job.id] || false}
              isSaving={savingMap[job.id] || false}
              showActions={tab === 'eligible' || tab === 'saved'}
              hasResume={resume?.hasResume || false}
              sourceColor={sourceColors[job.source] || sourceColors.seed}
              evaluation={evalData[job.id]}
              isEvalOpen={evalOpen === job.id}
              onToggleSelect={() => toggleSelect(job.id)}
              onToggleExpand={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              onApply={() => handleApply(job.id)}
              onSkip={() => handleSkip(job.id)}
              onSave={() => handleSave(job.id)}
              onEvaluate={() => handleEvaluate(job.id)}
              onToggleEval={() => setEvalOpen(evalOpen === job.id ? null : job.id)}
            />
          ))}
        </div>
      )}

      {/* Apply-confirmation modal */}
      {confirmApplyJob && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !confirming && setConfirmApplyJob(null)}
        >
          <div
            className="bg-surface-card border border-surface-border rounded-xl p-5 w-full max-w-md space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-gray-100">Did you apply?</h3>
            </div>
            <div>
              <p className="text-sm text-gray-200">{confirmApplyJob.title}</p>
              <p className="text-xs text-gray-500">{confirmApplyJob.company}</p>
            </div>
            <p className="text-xs text-gray-400">
              We'll only move this to your Applied tab if you confirm. Otherwise it stays where it was.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => confirmApplied(false)}
                disabled={confirming}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition"
              >
                Not yet
              </button>
              <button
                onClick={() => confirmApplied(true)}
                disabled={confirming}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Yes, I applied
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste URL Modal */}
      {showUrlModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !importing && setShowUrlModal(false)}
        >
          <div
            className="bg-surface-card border border-surface-border rounded-xl p-5 w-full max-w-lg space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-semibold text-gray-100">Import job from URL</h3>
            </div>
            <p className="text-xs text-gray-400">
              Paste a Greenhouse, Lever, or Ashby job posting URL. We'll pull the
              canonical record, save it, and auto-score it against your profile.
            </p>
            <input
              type="url"
              autoFocus
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              placeholder="https://jobs.lever.co/company/abc-123..."
              className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
              onKeyDown={e => { if (e.key === 'Enter' && !importing) handleImportUrl() }}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowUrlModal(false)}
                disabled={importing}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImportUrl}
                disabled={importing || !importUrl.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {importing ? 'Importing...' : 'Import & Score'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResumeChip({ resume, uploading, onUpload, onDownload, onRemove }: {
  resume: ResumeInfo | null
  uploading: boolean
  onUpload: () => void
  onDownload: () => void
  onRemove: () => void
}) {
  if (!resume?.hasResume) {
    return (
      <button
        onClick={onUpload}
        disabled={uploading}
        className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Upload CV
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-lg pl-2.5 pr-1 py-1">
      <FileText className="w-3.5 h-3.5 text-emerald-400" />
      <span className="text-xs text-gray-300 truncate max-w-[160px]" title={resume.fileName}>
        {resume.fileName}
      </span>
      <button
        onClick={onDownload}
        className="p-1 text-gray-500 hover:text-brand-400 transition"
        title="Download"
      >
        <Download className="w-3 h-3" />
      </button>
      <button
        onClick={onUpload}
        disabled={uploading}
        className="p-1 text-gray-500 hover:text-brand-400 transition disabled:opacity-50"
        title="Replace"
      >
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
      </button>
      <button
        onClick={onRemove}
        className="p-1 text-gray-500 hover:text-red-400 transition"
        title="Remove"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  )
}

const GRADE_STYLES: Record<string, string> = {
  A: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/60',
  B: 'bg-lime-900/40 text-lime-300 border-lime-600/60',
  C: 'bg-amber-900/40 text-amber-300 border-amber-600/60',
  D: 'bg-orange-900/40 text-orange-300 border-orange-600/60',
  F: 'bg-red-900/40 text-red-300 border-red-600/60',
}

function JobCard({ job, isSelected, isExpanded, isApplying, isEvaluating, isSaving, showActions, hasResume, sourceColor, evaluation, isEvalOpen, onToggleSelect, onToggleExpand, onApply, onSkip, onSave, onEvaluate, onToggleEval }: {
  job: Job
  isSelected: boolean
  isExpanded: boolean
  isApplying: boolean
  isEvaluating: boolean
  isSaving: boolean
  showActions: boolean
  hasResume: boolean
  sourceColor: string
  evaluation?: EvaluationData
  isEvalOpen: boolean
  onToggleSelect: () => void
  onToggleExpand: () => void
  onApply: () => void
  onSkip: () => void
  onSave: () => void
  onEvaluate: () => void
  onToggleEval: () => void
}) {
  const grade = evaluation?.grade || job.evaluationGrade || null
  const score = evaluation?.score ?? job.evaluationScore ?? null
  const isSaved = job.autoApplyStatus === 'SAVED'
  return (
    <div className={`bg-surface-card border rounded-xl transition ${
      isSelected ? 'border-brand-500/50 bg-brand-950/20' : 'border-surface-border'
    }`}>
      <div className="px-4 py-3 flex items-start gap-3">
        {showActions && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 rounded border-gray-600 bg-surface-elevated text-brand-600 focus:ring-brand-500"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <button onClick={onToggleExpand} className="text-left">
                <h3 className="text-sm font-semibold text-gray-100 hover:text-brand-400 transition flex items-center gap-1">
                  {job.title}
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </h3>
              </button>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                {job.company}
                {job.location && (
                  <>
                    <span className="text-gray-600">·</span>
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {grade && (
                <button
                  onClick={onToggleEval}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${GRADE_STYLES[grade] || GRADE_STYLES.C}`}
                  title={`Fit score: ${score ?? '?'} / 100 — click for details`}
                >
                  <Award className="w-2.5 h-2.5" />
                  {grade}
                </button>
              )}
              {job.visaSponsorship && (
                <span className="w-5 h-5 flex items-center justify-center rounded bg-emerald-900/40 border border-emerald-700/50" title="Visa sponsorship available">
                  <Shield className="w-2.5 h-2.5 text-emerald-400" />
                </span>
              )}
              {job.isRemote && (
                <span className="w-5 h-5 flex items-center justify-center rounded bg-sky-900/40 border border-sky-700/50" title="Remote">
                  <Globe className="w-2.5 h-2.5 text-sky-400" />
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {(job.salaryMin || job.salaryMax) && (
              <span className="text-blue-400 font-medium">
                {formatSalary(job.salaryMin ?? undefined, job.salaryMax ?? undefined, job.currency ?? 'USD')}
              </span>
            )}
            <span>{timeAgo(job.postedAt)}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border ${sourceColor}`}>
              {job.source}
            </span>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              {job.tags && (
                <div className="flex gap-1 flex-wrap">
                  {job.tags.split(',').slice(0, 12).map((t, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-surface-elevated text-[10px] text-gray-400 border border-surface-border">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
              {job.description && (
                <div className="p-3 bg-surface-elevated rounded-lg text-xs text-gray-300 leading-relaxed max-h-60 overflow-y-auto">
                  {job.description}
                </div>
              )}
            </div>
          )}

          {isEvalOpen && evaluation && (
            <div className="mt-3 p-3 bg-surface-elevated rounded-lg text-xs text-gray-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${GRADE_STYLES[evaluation.grade]}`}>
                    {evaluation.grade} · {evaluation.score}/100
                  </span>
                  <span className="text-xs text-gray-400">{evaluation.summary}</span>
                </div>
                <button onClick={onToggleEval} className="text-gray-500 hover:text-gray-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <EvalRow label="Skills"   score={evaluation.breakdown.skills.score} detail={`${evaluation.breakdown.skills.matched.length} matched · ${evaluation.breakdown.skills.missing.length} missing`} />
                <EvalRow label="Role"     score={evaluation.breakdown.role.score}     detail={evaluation.breakdown.role.reason} />
                <EvalRow label="Location" score={evaluation.breakdown.location.score} detail={evaluation.breakdown.location.reason} />
                <EvalRow label="Bonuses"  score={evaluation.breakdown.bonuses.score}  detail={evaluation.breakdown.bonuses.reasons.join(' · ')} />
              </div>
              {evaluation.breakdown.skills.matched.length > 0 && (
                <div className="pt-1">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Matched skills</div>
                  <div className="flex gap-1 flex-wrap">
                    {evaluation.breakdown.skills.matched.map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 text-[10px] border border-emerald-700/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {evaluation.breakdown.skills.missing.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Gaps</div>
                  <div className="flex gap-1 flex-wrap">
                    {evaluation.breakdown.skills.missing.slice(0, 10).map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 text-[10px] border border-red-700/40">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showActions ? (
            <>
              <button
                onClick={grade ? onToggleEval : onEvaluate}
                disabled={isEvaluating}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                title={grade ? 'Show fit details' : 'Score this job against your profile'}
              >
                {isEvaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {grade ? grade : 'Score'}
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`p-1.5 rounded-lg transition ${
                  isSaved
                    ? 'text-amber-400 bg-amber-900/20 hover:bg-amber-900/30'
                    : 'text-gray-500 hover:text-amber-400 hover:bg-amber-900/20'
                } disabled:opacity-50`}
                title={isSaved ? 'Saved — click to remove' : 'Save for later'}
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                )}
              </button>
              <button
                onClick={onApply}
                disabled={isApplying}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                title={hasResume ? 'Open job page — you\'ll confirm after' : 'Open job page'}
              >
                {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                Apply
              </button>
              <button
                onClick={onSkip}
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                title="Skip"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : job.autoApplyStatus === 'APPLIED' ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Check className="w-3.5 h-3.5" /> Applied
            </span>
          ) : null}

          {(job.applyUrl || job.sourceUrl) && (
            <a
              href={job.applyUrl || job.sourceUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition"
              title="Open job page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function EvalRow({ label, score, detail }: { label: string; score: number; detail: string }) {
  const color =
    score >= 85 ? 'bg-emerald-500' :
    score >= 70 ? 'bg-lime-500' :
    score >= 55 ? 'bg-amber-500' :
    score >= 40 ? 'bg-orange-500' :
                  'bg-red-500'
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-2">
      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
        <span className="uppercase tracking-wider">{label}</span>
        <span className="font-mono text-gray-300">{score}</span>
      </div>
      <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <div className="text-[10px] text-gray-500 mt-1 leading-tight">{detail}</div>
    </div>
  )
}
