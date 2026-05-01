'use client'

import {
  ChevronDown, ChevronUp, Building2, MapPin, Award, Shield, Globe,
  Loader2, Sparkles, Bookmark, Rocket, X, Check, ExternalLink,
} from 'lucide-react'
import { formatSalary, timeAgo } from '@/lib/utils'
import { GRADE_STYLES, sourceColor, type Job, type EvaluationData } from '@/lib/types'

export interface JobCardProps {
  job: Job
  isSelected: boolean
  isExpanded: boolean
  isApplying: boolean
  isEvaluating: boolean
  isSaving: boolean
  showActions: boolean
  hasResume: boolean
  evaluation?: EvaluationData
  isEvalOpen: boolean
  onToggleSelect: () => void
  onToggleExpand: () => void
  onApply: () => void
  onSkip: () => void
  onSave: () => void
  onEvaluate: () => void
  onToggleEval: () => void
}

export function JobCard(props: JobCardProps) {
  const {
    job, isSelected, isExpanded, isApplying, isEvaluating, isSaving,
    showActions, hasResume, evaluation, isEvalOpen,
    onToggleSelect, onToggleExpand, onApply, onSkip, onSave, onEvaluate, onToggleEval,
  } = props

  const grade = evaluation?.grade || job.evaluationGrade || null
  const score = evaluation?.score ?? job.evaluationScore ?? null
  const isSaved = job.autoApplyStatus === 'SAVED'
  const sourcePill = sourceColor(job.source)

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
            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border ${sourcePill}`}>
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
                <EvalRow label="Skills"   score={evaluation.breakdown.skills.score}   detail={`${evaluation.breakdown.skills.matched.length} matched · ${evaluation.breakdown.skills.missing.length} missing`} />
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
                title={hasResume ? "Open job page — you'll confirm after" : 'Open job page'}
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
