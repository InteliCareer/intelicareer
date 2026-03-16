'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appsApi } from '@/lib/api'
import {
  STAGE_LABELS, STAGE_ORDER, STAGE_COLORS, PRIORITY_COLORS,
  formatSalary, timeAgo, cn
} from '@/lib/utils'
import { Plus, ExternalLink, MapPin, DollarSign, X, Globe } from 'lucide-react'

interface Application {
  id: string
  jobTitle: string
  company: string
  location?: string
  isRemote: boolean
  jobUrl?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  stage: string
  priority: string
  appliedAt?: string
  createdAt: string
  notes: { id: string; content: string; createdAt: string }[]
}

const VISIBLE_STAGES = ['BOOKMARKED', 'APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER']

export default function TrackerPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Application | null>(null)

  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => appsApi.list().then((r) => r.data),
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      appsApi.updateStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      setSelected(null)
    },
  })

  const byStage = VISIBLE_STAGES.reduce((acc, stage) => {
    acc[stage] = apps.filter((a) => a.stage === stage)
    return acc
  }, {} as Record<string, Application[]>)

  // Also show rejected/withdrawn as a collapsed summary
  const closedApps = apps.filter((a) => ['REJECTED', 'WITHDRAWN', 'ACCEPTED'].includes(a.stage))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Job Tracker</h1>
          <p className="text-gray-500 text-sm mt-0.5">{apps.length} applications tracked</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>
        ) : (
          <div className="flex gap-4 min-w-max">
            {VISIBLE_STAGES.map((stage) => {
              const stageApps = byStage[stage] || []
              return (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  apps={stageApps}
                  onSelect={setSelected}
                  onMoveStage={(id, newStage) => stageMutation.mutate({ id, stage: newStage })}
                />
              )
            })}

            {/* Closed column */}
            {closedApps.length > 0 && (
              <div className="w-64 shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Closed</span>
                  <span className="text-xs bg-surface-elevated text-gray-400 px-2 py-0.5 rounded-full">
                    {closedApps.length}
                  </span>
                </div>
                <div className="space-y-2 opacity-60">
                  {closedApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelected(app)}
                      className="bg-surface-card border border-surface-border rounded-lg p-3 cursor-pointer hover:border-surface-muted transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-400 truncate">{app.jobTitle}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{app.company}</div>
                      <div className="text-[10px] text-gray-600 mt-1">{STAGE_LABELS[app.stage]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && <AddApplicationModal onClose={() => setShowAdd(false)} />}

      {/* Detail panel */}
      {selected && (
        <ApplicationDetail
          app={selected}
          onClose={() => setSelected(null)}
          onDelete={() => deleteMutation.mutate(selected.id)}
          onStageChange={(stage) => {
            stageMutation.mutate({ id: selected.id, stage })
            setSelected({ ...selected, stage })
          }}
        />
      )}
    </div>
  )
}

function KanbanColumn({
  stage, apps, onSelect, onMoveStage
}: {
  stage: string
  apps: Application[]
  onSelect: (a: Application) => void
  onMoveStage: (id: string, stage: string) => void
}) {
  const colorClass = STAGE_COLORS[stage] || 'bg-gray-600'

  return (
    <div className="w-64 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${colorClass}`} />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {STAGE_LABELS[stage]}
        </span>
        <span className="ml-auto text-xs bg-surface-elevated text-gray-400 px-2 py-0.5 rounded-full">
          {apps.length}
        </span>
      </div>

      <div className="space-y-2 flex-1">
        {apps.map((app) => (
          <ApplicationCard
            key={app.id}
            app={app}
            onClick={() => onSelect(app)}
            onMoveStage={onMoveStage}
            currentStage={stage}
          />
        ))}
        {apps.length === 0 && (
          <div className="border-2 border-dashed border-surface-border rounded-lg h-24 flex items-center justify-center">
            <span className="text-xs text-gray-600">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicationCard({
  app, onClick, onMoveStage, currentStage
}: {
  app: Application
  onClick: () => void
  onMoveStage: (id: string, stage: string) => void
  currentStage: string
}) {
  const [showMove, setShowMove] = useState(false)
  const priorityClass = PRIORITY_COLORS[app.priority] || PRIORITY_COLORS.MEDIUM

  return (
    <div
      className="bg-surface-card border border-surface-border rounded-lg p-3 cursor-pointer hover:border-brand-600/50 transition-all group relative"
      onClick={onClick}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-100 leading-tight flex-1 truncate">
          {app.jobTitle}
        </span>
        <span className={`badge border shrink-0 text-[10px] ${priorityClass}`}>
          {app.priority}
        </span>
      </div>

      <div className="text-xs text-gray-400 font-medium">{app.company}</div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {app.isRemote ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-900/20 px-1.5 py-0.5 rounded">
            <Globe className="w-2.5 h-2.5" /> Remote
          </span>
        ) : app.location ? (
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <MapPin className="w-2.5 h-2.5" /> {app.location}
          </span>
        ) : null}
        {formatSalary(app.salaryMin, app.salaryMax, app.currency) && (
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <DollarSign className="w-2.5 h-2.5" />
            {formatSalary(app.salaryMin, app.salaryMax, app.currency)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-surface-border">
        <span className="text-[10px] text-gray-600">{timeAgo(app.createdAt)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMove(!showMove) }}
          className="text-[10px] text-gray-500 hover:text-brand-400 transition-colors"
        >
          Move →
        </button>
      </div>

      {showMove && (
        <div
          className="absolute right-0 top-full mt-1 z-10 bg-surface-elevated border border-surface-border rounded-lg shadow-xl py-1 w-40"
          onClick={(e) => e.stopPropagation()}
        >
          {STAGE_ORDER.filter((s) => s !== currentStage).map((s) => (
            <button
              key={s}
              onClick={() => { onMoveStage(app.id, s); setShowMove(false) }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-gray-100 hover:bg-surface-muted transition-colors"
            >
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationDetail({
  app, onClose, onDelete, onStageChange
}: {
  app: Application
  onClose: () => void
  onDelete: () => void
  onStageChange: (stage: string) => void
}) {
  const qc = useQueryClient()
  const [note, setNote] = useState('')

  const addNote = useMutation({
    mutationFn: () => appsApi.addNote(app.id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      setNote('')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-surface-card border-l border-surface-border flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-gray-100">Application Details</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-gray-100">{app.jobTitle}</h3>
            <p className="text-gray-400 mt-0.5">{app.company}</p>
            {app.jobUrl && (
              <a
                href={app.jobUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-1"
              >
                <ExternalLink className="w-3 h-3" /> View job posting
              </a>
            )}
          </div>

          {/* Stage selector */}
          <div>
            <label className="label">Pipeline Stage</label>
            <select
              value={app.stage}
              onChange={(e) => onStageChange(e.target.value)}
              className="input"
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {app.location && (
              <div>
                <div className="label">Location</div>
                <div className="text-gray-300">{app.isRemote ? 'Remote' : app.location}</div>
              </div>
            )}
            {(app.salaryMin || app.salaryMax) && (
              <div>
                <div className="label">Salary</div>
                <div className="text-gray-300">
                  {formatSalary(app.salaryMin, app.salaryMax, app.currency)}
                </div>
              </div>
            )}
            {app.appliedAt && (
              <div>
                <div className="label">Applied</div>
                <div className="text-gray-300">{new Date(app.appliedAt).toLocaleDateString()}</div>
              </div>
            )}
            <div>
              <div className="label">Added</div>
              <div className="text-gray-300">{new Date(app.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <div className="space-y-2 mb-3">
              {app.notes.map((n) => (
                <div key={n.id} className="bg-surface-elevated rounded-lg p-3 text-sm text-gray-300">
                  <p>{n.content}</p>
                  <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && note && addNote.mutate()}
              />
              <button
                onClick={() => note && addNote.mutate()}
                className="btn-primary px-3 text-sm"
                disabled={!note || addNote.isPending}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-surface-border">
          <button
            onClick={onDelete}
            className="w-full text-sm text-red-400 hover:text-red-300 hover:bg-red-900/10 py-2 rounded-lg transition-colors"
          >
            Delete application
          </button>
        </div>
      </div>
    </div>
  )
}

function AddApplicationModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    jobTitle: '', company: '', location: '', isRemote: false,
    jobUrl: '', salaryMin: '', salaryMax: '', priority: 'MEDIUM',
  })

  const mutation = useMutation({
    mutationFn: () => appsApi.create({
      ...form,
      salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      onClose()
    },
  })

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface-card border border-surface-border rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-gray-100">Add Application</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Job Title *</label>
              <input className="input" placeholder="Senior Backend Engineer" value={form.jobTitle}
                onChange={(e) => set('jobTitle', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Company *</label>
              <input className="input" placeholder="Stripe" value={form.company}
                onChange={(e) => set('company', e.target.value)} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="San Francisco, CA" value={form.location}
                onChange={(e) => set('location', e.target.value)} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isRemote}
                  onChange={(e) => set('isRemote', e.target.checked)}
                  className="w-4 h-4 accent-brand-500" />
                <span className="text-sm text-gray-400">Remote</span>
              </label>
            </div>
            <div>
              <label className="label">Min Salary</label>
              <input className="input" type="number" placeholder="120000" value={form.salaryMin}
                onChange={(e) => set('salaryMin', e.target.value)} />
            </div>
            <div>
              <label className="label">Max Salary</label>
              <input className="input" type="number" placeholder="180000" value={form.salaryMax}
                onChange={(e) => set('salaryMax', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Job URL</label>
              <input className="input" placeholder="https://..." value={form.jobUrl}
                onChange={(e) => set('jobUrl', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="DREAM">Dream Company</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!form.jobTitle || !form.company || mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? 'Adding...' : 'Add Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
