'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, skillsApi, marketApi } from '@/lib/api'
import { SKILL_CATEGORY_COLORS } from '@/lib/utils'
import { Plus, X, Zap, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'

interface Skill { id: string; name: string; category: string }
interface UserSkill { id: string; skillId: string; level: string; yearsUsed?: number; skill: Skill }
interface GapItem { skillId: string; skill: string; category: string; count: number; demandPct: number; hasSkill: boolean }

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
const LEVEL_COLORS: Record<string, string> = {
  BEGINNER:     'text-gray-400',
  INTERMEDIATE: 'text-blue-400',
  ADVANCED:     'text-violet-400',
  EXPERT:       'text-yellow-400',
}

export default function SkillsPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [targetRole, setTargetRole] = useState('Backend Engineer')
  const [roleInput, setRoleInput] = useState('Backend Engineer')

  const { data: userSkills = [] } = useQuery<UserSkill[]>({
    queryKey: ['user-skills'],
    queryFn: () => userApi.skills().then((r) => r.data),
  })

  const { data: gapData, isLoading: gapLoading } = useQuery({
    queryKey: ['skill-gap', targetRole],
    queryFn: () => marketApi.skillGap(targetRole).then((r) => r.data),
  })

  const removeSkill = useMutation({
    mutationFn: (skillId: string) => userApi.removeSkill(skillId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-skills'] })
      qc.invalidateQueries({ queryKey: ['skill-gap'] })
    },
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Skill Gap Analyzer</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Compare your skills to what the market demands
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Skill
        </button>
      </div>

      {/* Role target */}
      <div className="card p-4 flex items-center gap-3">
        <Zap className="w-4 h-4 text-brand-400 shrink-0" />
        <span className="text-sm text-gray-400 shrink-0">Analyzing against role:</span>
        <input
          className="input flex-1 text-sm py-1.5"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setTargetRole(roleInput)}
          placeholder="e.g. Senior Backend Engineer"
        />
        <button
          onClick={() => setTargetRole(roleInput)}
          className="btn-secondary text-sm py-1.5"
        >
          Analyze
        </button>
      </div>

      {/* Coverage Score */}
      {gapData && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Coverage Score</div>
            <div className="flex items-end gap-2 mt-1">
              <span className={`text-3xl font-bold ${gapData.coverageScore >= 70 ? 'text-emerald-400' : gapData.coverageScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {gapData.coverageScore}%
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-0.5">of top skills covered</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Skills You Have</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{gapData.strengths?.length ?? 0}</div>
            <div className="text-xs text-gray-600 mt-0.5">matching market demand</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Skills to Learn</div>
            <div className="text-3xl font-bold text-red-400 mt-1">{gapData.gaps?.length ?? 0}</div>
            <div className="text-xs text-gray-600 mt-0.5">in top {gapData.all?.length ?? 0} demanded</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Your Skills */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Your Skills
            <span className="ml-auto text-xs text-gray-500 font-normal">{userSkills.length} total</span>
          </h2>
          {userSkills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm">
              <Zap className="w-8 h-8 mb-2 opacity-30" />
              No skills added yet
            </div>
          ) : (
            <div className="space-y-2">
              {userSkills.map((us) => (
                <div key={us.id} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-surface-elevated transition-colors">
                  <span className={`badge text-[11px] ${SKILL_CATEGORY_COLORS[us.skill.category] || SKILL_CATEGORY_COLORS.OTHER}`}>
                    {us.skill.name}
                  </span>
                  <span className={`text-xs ${LEVEL_COLORS[us.level]}`}>{us.level}</span>
                  {us.yearsUsed && (
                    <span className="text-xs text-gray-600">{us.yearsUsed}y</span>
                  )}
                  <button
                    onClick={() => removeSkill.mutate(us.skillId)}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Gap */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Skill Gaps
            <span className="ml-1 text-xs text-gray-500 font-normal">— missing for "{targetRole}"</span>
          </h2>
          {gapLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">Analyzing...</div>
          ) : gapData?.gaps?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-emerald-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mb-2" />
              No gaps! You cover all top skills.
            </div>
          ) : (
            <div className="space-y-2">
              {gapData?.gaps?.slice(0, 10).map((gap: GapItem) => (
                <div key={gap.skillId} className="flex items-center gap-3">
                  <span className={`badge text-[11px] ${SKILL_CATEGORY_COLORS[gap.category] || SKILL_CATEGORY_COLORS.OTHER}`}>
                    {gap.skill}
                  </span>
                  <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-red-500/70 rounded-full"
                      style={{ width: `${gap.demandPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-red-400 shrink-0 w-12 text-right font-medium">
                    {gap.demandPct}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full demand overview */}
      {gapData?.all && gapData.all.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            Full Market Demand
            <span className="text-xs text-gray-500 font-normal ml-1">— {gapData.totalJobs} jobs analyzed</span>
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {gapData.all.map((item: GapItem, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 text-xs text-gray-600 text-right shrink-0">{i + 1}</div>
                <span className={`badge text-[11px] w-28 justify-center ${SKILL_CATEGORY_COLORS[item.category] || SKILL_CATEGORY_COLORS.OTHER}`}>
                  {item.skill}
                </span>
                <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${item.hasSkill ? 'bg-emerald-500' : 'bg-brand-600'}`}
                    style={{ width: `${item.demandPct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right shrink-0">{item.demandPct}%</span>
                {item.hasSkill ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400/70 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddSkillModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}

function AddSkillModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Skill | null>(null)
  const [level, setLevel] = useState('INTERMEDIATE')
  const [years, setYears] = useState('')

  const { data: searchResults = [] } = useQuery<Skill[]>({
    queryKey: ['skill-search', query],
    queryFn: () => skillsApi.search(query).then((r) => r.data),
    enabled: query.length >= 2,
  })

  const addSkill = useMutation({
    mutationFn: () => userApi.addSkill({
      skillId: selected!.id,
      level,
      yearsUsed: years ? parseFloat(years) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-skills'] })
      qc.invalidateQueries({ queryKey: ['skill-gap'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface-card border border-surface-border rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-gray-100">Add Skill</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Search skill</label>
            <input
              className="input"
              placeholder="e.g. TypeScript, Docker, AWS..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
            />
            {searchResults.length > 0 && !selected && (
              <div className="mt-1 bg-surface-elevated border border-surface-border rounded-lg overflow-hidden">
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelected(s); setQuery(s.name) }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-muted transition-colors flex items-center gap-2"
                  >
                    <span className={`badge text-[10px] ${SKILL_CATEGORY_COLORS[s.category] || SKILL_CATEGORY_COLORS.OTHER}`}>
                      {s.category}
                    </span>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Proficiency Level</label>
            <div className="grid grid-cols-4 gap-1">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`text-xs py-1.5 rounded-lg border transition-colors ${
                    level === l
                      ? 'bg-brand-600/20 text-brand-400 border-brand-600/40'
                      : 'text-gray-500 border-surface-border hover:border-surface-muted'
                  }`}
                >
                  {l.charAt(0) + l.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Years of Experience (optional)</label>
            <input
              className="input"
              type="number"
              step="0.5"
              placeholder="3"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => addSkill.mutate()}
              disabled={!selected || addSkill.isPending}
              className="btn-primary flex-1"
            >
              {addSkill.isPending ? 'Adding...' : 'Add Skill'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
