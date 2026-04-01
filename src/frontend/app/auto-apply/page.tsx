'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { scraperApi, autoApplyApi, resumeApi } from '@/lib/api'
import { formatSalary, timeAgo } from '@/lib/utils'
import {
  Rocket, RefreshCw, Search, ExternalLink, Check,
  X, Loader2, Globe, Shield, ChevronDown, ChevronUp,
  Upload, FileText, Trash2, Download, MapPin, Building2,
} from 'lucide-react'

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

  // Filters
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterVisa, setFilterVisa] = useState(false)
  const [filterWorkMode, setFilterWorkMode] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterCurrency, setFilterCurrency] = useState('')
  const [tab, setTab] = useState<'eligible' | 'applied' | 'all'>('eligible')

  // Resume
  const [resume, setResume] = useState<ResumeInfo | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(filterLocation), 400)
    return () => clearTimeout(t)
  }, [filterLocation])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (filterSource) params.source = filterSource
      if (filterVisa) params.visa = 'true'
      if (filterWorkMode) params.workMode = filterWorkMode
      if (debouncedLocation) params.location = debouncedLocation
      if (filterCurrency) params.currency = filterCurrency
      if (tab === 'eligible') params.status = 'ELIGIBLE'
      else if (tab === 'applied') params.status = 'APPLIED'

      const { data } = await scraperApi.jobs(params)
      setJobs(data.jobs)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    }
    setLoading(false)
  }, [debouncedSearch, filterSource, filterVisa, filterWorkMode, debouncedLocation, filterCurrency, tab])

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

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchResume() }, [fetchResume])

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

  async function handleApply(jobId: string) {
    setApplying(prev => ({ ...prev, [jobId]: true }))
    try {
      const { data } = await autoApplyApi.apply(jobId)
      if (data.status === 'applied' && data.method === 'redirect') {
        const job = jobs.find(j => j.id === jobId)
        if (job?.applyUrl || job?.sourceUrl) {
          window.open(job.applyUrl || job.sourceUrl!, '_blank')
        }
      }
      await fetchJobs()
      await fetchStats()
    } catch (err: any) {
      console.error('Apply failed:', err)
      alert(err.response?.data?.message || 'Failed to apply')
    }
    setApplying(prev => ({ ...prev, [jobId]: false }))
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

  function clearFilters() {
    setSearch('')
    setFilterSource('')
    setFilterVisa(false)
    setFilterWorkMode('')
    setFilterLocation('')
    setFilterCurrency('')
  }

  const hasActiveFilters = search || filterSource || filterVisa || filterWorkMode || filterLocation || filterCurrency

  const sourceColors: Record<string, string> = {
    remotive: 'bg-green-900/40 text-green-300 border-green-700/50',
    arbeitnow: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
    remoteok: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
    seed: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-brand-400" />
            Auto Apply
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Scrape jobs, filter by criteria, and apply with one click
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScrape('europe')}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {scraping && scrapeMode === 'europe' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {scraping && scrapeMode === 'europe' ? 'Scraping...' : 'Europe'}
          </button>
          <button
            onClick={() => handleScrape('global')}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {scraping && scrapeMode === 'global' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {scraping && scrapeMode === 'global' ? 'Scraping...' : 'Global'}
          </button>
        </div>
      </div>

      {/* Resume Upload Card */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              resume?.hasResume ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-surface-elevated border border-surface-border'
            }`}>
              <FileText className={`w-5 h-5 ${resume?.hasResume ? 'text-emerald-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-200">Your Resume</h3>
              {resume?.hasResume ? (
                <p className="text-xs text-gray-400">
                  {resume.fileName} — uploaded {resume.uploadedAt ? timeAgo(resume.uploadedAt) : ''}
                </p>
              ) : (
                <p className="text-xs text-gray-500">Upload your CV to use when applying to positions</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resume?.hasResume && (
              <>
                <button
                  onClick={handleDownloadResume}
                  className="p-2 text-gray-400 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRemoveResume}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleUploadResume}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {resume?.hasResume ? 'Replace' : 'Upload CV'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Jobs" value={stats?.total ?? 0} />
        <StatCard label="Remote" value={stats?.remote ?? 0} />
        <StatCard label="Visa Sponsor" value={stats?.withVisa ?? 0} accent="emerald" />
        <StatCard label="Applied" value={applyStats?.applied ?? 0} accent="blue" />
        <StatCard
          label="Last Scrape"
          value={stats?.lastScrape ? timeAgo(stats.lastScrape) : 'Never'}
          isText
        />
      </div>

      {/* Source breakdown */}
      {stats && stats.bySource.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {stats.bySource.map(s => (
            <span key={s.source} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${sourceColors[s.source] || sourceColors.seed}`}>
              {s.source}: {s.count}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-card rounded-lg p-1 w-fit">
        {(['eligible', 'applied', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              tab === t ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t === 'eligible' ? 'Eligible' : t === 'applied' ? 'Applied' : 'All Jobs'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filters</h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-brand-400 hover:text-brand-300 transition">
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keywords */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="node.js, backend, QA..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Location</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Paris, Berlin, Europe..."
                value={filterLocation}
                onChange={e => setFilterLocation(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Work Mode */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Work Mode</label>
            <select
              value={filterWorkMode}
              onChange={e => setFilterWorkMode(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Currency</label>
            <select
              value={filterCurrency}
              onChange={e => setFilterCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-gray-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Currencies</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
            </select>
          </div>
        </div>

        {/* Toggle filters */}
        <div className="flex gap-2 flex-wrap pt-1">
          <button
            onClick={() => setFilterVisa(!filterVisa)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filterVisa ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' : 'bg-surface-elevated text-gray-400 border-surface-border hover:border-gray-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Visa Sponsorship
          </button>
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
        <div className="text-center py-20 text-gray-500">
          <Rocket className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No jobs found. Try scraping or adjusting filters.</p>
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
              showActions={tab === 'eligible'}
              hasResume={resume?.hasResume || false}
              sourceColor={sourceColors[job.source] || sourceColors.seed}
              onToggleSelect={() => toggleSelect(job.id)}
              onToggleExpand={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
              onApply={() => handleApply(job.id)}
              onSkip={() => handleSkip(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent, isText }: {
  label: string
  value: number | string
  accent?: string
  isText?: boolean
}) {
  const color = accent === 'emerald' ? 'text-emerald-400' :
                accent === 'blue' ? 'text-blue-400' : 'text-gray-100'
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`${isText ? 'text-sm text-gray-300' : `text-xl font-bold ${color}`}`}>
        {value}
      </div>
    </div>
  )
}

function JobCard({ job, isSelected, isExpanded, isApplying, showActions, hasResume, sourceColor, onToggleSelect, onToggleExpand, onApply, onSkip }: {
  job: Job
  isSelected: boolean
  isExpanded: boolean
  isApplying: boolean
  showActions: boolean
  hasResume: boolean
  sourceColor: string
  onToggleSelect: () => void
  onToggleExpand: () => void
  onApply: () => void
  onSkip: () => void
}) {
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

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {job.visaSponsorship && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
                  VISA
                </span>
              )}
              {job.isRemote && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-900/40 text-sky-300 border border-sky-700/50">
                  Remote
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${sourceColor}`}>
                {job.source}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {(job.salaryMin || job.salaryMax) && (
              <span className="text-blue-400 font-medium">
                {formatSalary(job.salaryMin ?? undefined, job.salaryMax ?? undefined, job.currency ?? 'USD')}
              </span>
            )}
            <span>{timeAgo(job.postedAt)}</span>
            {job.tags && (
              <span className="truncate max-w-[250px]">{job.tags}</span>
            )}
          </div>

          {isExpanded && job.description && (
            <div className="mt-3 p-3 bg-surface-elevated rounded-lg text-xs text-gray-300 leading-relaxed max-h-60 overflow-y-auto">
              {job.description}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showActions ? (
            <>
              <button
                onClick={onApply}
                disabled={isApplying}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                title={hasResume ? 'Apply with your CV' : 'Apply'}
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
