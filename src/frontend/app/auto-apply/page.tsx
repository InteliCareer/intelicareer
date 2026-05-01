'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { scraperApi, autoApplyApi, resumeApi, userApi } from '@/lib/api'
import {
  Rocket, Search, X, Loader2, Bot,
} from 'lucide-react'
import ChatPanel from './ChatPanel'
import { JobCard } from './components/JobCard'
import { ResumeChip } from './components/ResumeChip'
import { ApplyConfirmModal } from './components/ApplyConfirmModal'
import type {
  Job, Portal, EvaluationData, ResumeInfo, ProfileState,
  ScraperStats, AutoApplyStats,
} from '@/lib/types'

type Tab = 'eligible' | 'saved' | 'applied' | 'all'

export default function AutoApplyPage() {
  // ── Job list state ─────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('eligible')
  const [search, setSearch] = useState('')
  const [hasInteracted, setHasInteracted] = useState(false)

  // ── Stats ──────────────────────────────────────────────────────
  const [stats, setStats] = useState<ScraperStats | null>(null)
  const [applyStats, setApplyStats] = useState<AutoApplyStats | null>(null)

  // ── Per-job interaction state ──────────────────────────────────
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [applying, setApplying] = useState<Record<string, boolean>>({})
  const [bulkApplying, setBulkApplying] = useState(false)
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})

  // ── Apply-confirmation modal ───────────────────────────────────
  const [confirmApplyJob, setConfirmApplyJob] = useState<Job | null>(null)
  const [confirming, setConfirming] = useState(false)

  // ── Evaluation ─────────────────────────────────────────────────
  const [evaluating, setEvaluating] = useState<Record<string, boolean>>({})
  const [evalOpen, setEvalOpen] = useState<string | null>(null)
  const [evalData, setEvalData] = useState<Record<string, EvaluationData>>({})

  // ── Resume + profile (for chat onboarding) ─────────────────────
  const [resume, setResume] = useState<ResumeInfo | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<ProfileState | null>(null)

  // ── Portals (passed into ChatPanel) ────────────────────────────
  const [portals, setPortals] = useState<Portal[]>([])

  // ── Debounced search ───────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // ── Fetchers ───────────────────────────────────────────────────
  const fetchJobs = useCallback(async (opts?: { force?: boolean }) => {
    if (!opts?.force && !hasInteracted && !debouncedSearch && tab === 'eligible') {
      setJobs([]); setTotal(0); setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (tab === 'eligible')      params.status = 'ELIGIBLE'
      else if (tab === 'applied')  params.status = 'APPLIED'
      else if (tab === 'saved')    params.status = 'SAVED'
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

  // Hydrate evalData from already-evaluated jobs the server returned.
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

  // ── Resume handlers ───────────────────────────────────────────
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

  // ── Apply / save / skip / score handlers ──────────────────────
  function handleApply(jobId: string) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const url = job.applyUrl || job.sourceUrl
    if (url) window.open(url, '_blank')
    setConfirmApplyJob(job)
  }

  async function confirmApplied(yes: boolean) {
    const job = confirmApplyJob
    if (!job) return
    if (!yes) { setConfirmApplyJob(null); return }
    setConfirming(true)
    try {
      await autoApplyApi.apply(job.id)
      await fetchJobs({ force: true })
      await fetchStats()
      setConfirmApplyJob(null)
      setHasInteracted(true)
      setTab('applied')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark as applied')
    }
    setConfirming(false)
  }

  async function handleBulkApply() {
    if (selectedJobs.size === 0) return
    setBulkApplying(true)
    try {
      const ids = Array.from(selectedJobs)
      await autoApplyApi.bulkApply(ids)
      for (const jobId of ids) {
        const job = jobs.find(j => j.id === jobId)
        if (job?.applyUrl || job?.sourceUrl) {
          window.open(job!.applyUrl || job!.sourceUrl!, '_blank')
        }
      }
      setSelectedJobs(new Set())
      await fetchJobs({ force: true })
      await fetchStats()
    } catch (err) {
      console.error('Bulk apply failed:', err)
    }
    setBulkApplying(false)
  }

  async function handleSkip(jobId: string) {
    try {
      await autoApplyApi.skip(jobId)
      await fetchJobs({ force: true })
      await fetchStats()
    } catch (err) { console.error('Skip failed:', err) }
  }

  async function handleSave(jobId: string) {
    setSavingMap(prev => ({ ...prev, [jobId]: true }))
    try {
      await autoApplyApi.toggleSave(jobId)
      await fetchJobs({ force: true })
      await fetchStats()
    } catch (err) { console.error('Save failed:', err) }
    setSavingMap(prev => ({ ...prev, [jobId]: false }))
  }

  async function handleEvaluate(jobId: string) {
    setEvaluating(prev => ({ ...prev, [jobId]: true }))
    try {
      const { data } = await scraperApi.evaluate(jobId)
      setEvalData(prev => ({ ...prev, [jobId]: data.evaluation }))
      setEvalOpen(jobId)
      setJobs(prev => prev.map(j => j.id === jobId
        ? { ...j, evaluationGrade: data.evaluation.grade, evaluationScore: data.evaluation.score }
        : j))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Evaluation failed')
    }
    setEvaluating(prev => ({ ...prev, [jobId]: false }))
  }

  // ── Selection helpers ─────────────────────────────────────────
  function toggleSelect(jobId: string) {
    setSelectedJobs(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }
  function selectAll() {
    setSelectedJobs(prev =>
      prev.size === jobs.length ? new Set() : new Set(jobs.map(j => j.id))
    )
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

      {/* Chat Panel */}
      <ChatPanel
        portals={portals}
        hasResume={!!resume?.hasResume}
        profile={profile}
        onJobsUpdated={() => { setHasInteracted(true); fetchJobs({ force: true }); fetchStats() }}
        onSearchQuery={(q) => { setHasInteracted(true); setSearch(q) }}
        onProfileSaved={fetchProfile}
      />

      {/* Toolbar: tabs + search chip + inline stats */}
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
      {(tab === 'eligible' || tab === 'saved') && jobs.length > 0 && (
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
          <span className="text-xs text-gray-500 ml-auto">{total} total</span>
        </div>
      )}

      {/* Job list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState hasInteracted={hasInteracted} tab={tab} />
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
        <ApplyConfirmModal
          job={confirmApplyJob}
          busy={confirming}
          onConfirm={() => confirmApplied(true)}
          onCancel={() => confirmApplied(false)}
        />
      )}
    </div>
  )
}

function EmptyState({ hasInteracted, tab }: { hasInteracted: boolean; tab: Tab }) {
  return (
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
  )
}

