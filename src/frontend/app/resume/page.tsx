'use client'

import { useState } from 'react'
import { FileText, Upload, CheckCircle2, X, Zap } from 'lucide-react'
import { SKILL_CATEGORY_COLORS } from '@/lib/utils'
import { userApi, skillsApi } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Sample extracted skills for demo (real AI integration requires OpenAI key)
const DEMO_EXTRACTED = [
  { id: '', name: 'TypeScript', category: 'LANGUAGE' },
  { id: '', name: 'Node.js', category: 'FRAMEWORK' },
  { id: '', name: 'React', category: 'FRAMEWORK' },
  { id: '', name: 'PostgreSQL', category: 'DATABASE' },
  { id: '', name: 'Docker', category: 'DEVOPS' },
  { id: '', name: 'AWS', category: 'CLOUD' },
  { id: '', name: 'REST APIs', category: 'TOOL' },
  { id: '', name: 'Git', category: 'TOOL' },
]

export default function ResumePage() {
  const qc = useQueryClient()
  const [stage, setStage] = useState<'upload' | 'review' | 'done'>('upload')
  const [extracted, setExtracted] = useState<{ id: string; name: string; category: string }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [jd, setJd] = useState('')
  const [matchResult, setMatchResult] = useState<null | { score: number; matched: string[]; missing: string[] }>(null)

  const addSkillsMutation = useMutation({
    mutationFn: async () => {
      const allSkills = await skillsApi.list().then((r) => r.data)
      const skillMap = new Map<string, string>(
  allSkills.map((s: { name: string; id: string }) => [s.name, s.id])
)
      for (const name of Array.from(selected)) {
        const skillId = skillMap.get(name)
        if (skillId) {
          await userApi.addSkill({ skillId, level: 'INTERMEDIATE' })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-skills'] })
      setStage('done')
    },
  })

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // In real implementation: upload to /api/resume/analyze
    // For demo: show sample extracted skills after delay
    setTimeout(() => {
      setExtracted(DEMO_EXTRACTED)
      setSelected(new Set(DEMO_EXTRACTED.map((s) => s.name)))
      setStage('review')
    }, 1500)
  }

  function analyzeMatch() {
    if (!jd.trim()) return
    // Simple client-side matching for demo
    const jdLower = jd.toLowerCase()
    const allSkills = DEMO_EXTRACTED.map((s) => s.name)
    const matched = allSkills.filter((s) => jdLower.includes(s.toLowerCase()))
    const missing = ['Kubernetes', 'Redis', 'GraphQL'].filter((s) => !jdLower.includes(s.toLowerCase()) && !matched.includes(s))
    const score = Math.round((matched.length / (matched.length + missing.length)) * 100)
    setMatchResult({ score, matched, missing })
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Resume Analyzer</h1>
        <p className="text-gray-500 text-sm mt-0.5">Extract skills from your resume and match against job descriptions</p>
      </div>

      {stage === 'upload' && (
        <div className="space-y-4">
          {/* Upload area */}
          <label className="card border-dashed border-2 border-surface-border hover:border-brand-600/50 transition-colors cursor-pointer flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-brand-900/30 border border-brand-700/40 flex items-center justify-center">
              <Upload className="w-6 h-6 text-brand-400" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-200">Drop your resume here</div>
              <div className="text-xs text-gray-500 mt-1">PDF or DOCX, up to 5MB</div>
            </div>
            <span className="btn-secondary text-sm">Choose File</span>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
          </label>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-gray-600">or paste resume text below</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <div>
            <textarea
              className="input h-40 resize-none text-sm"
              placeholder="Paste your resume text here to extract skills..."
              onChange={(e) => {
                if (e.target.value.length > 100) {
                  setTimeout(() => {
                    setExtracted(DEMO_EXTRACTED)
                    setSelected(new Set(DEMO_EXTRACTED.map((s) => s.name)))
                    setStage('review')
                  }, 800)
                }
              }}
            />
          </div>
        </div>
      )}

      {stage === 'review' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-400" />
              Extracted Skills
            </h2>
            <p className="text-xs text-gray-500 mb-4">Review and select which skills to add to your profile</p>
            <div className="flex flex-wrap gap-2">
              {extracted.map((skill) => {
                const isSelected = selected.has(skill.name)
                return (
                  <button
                    key={skill.name}
                    onClick={() => {
                      const next = new Set(selected)
                      if (isSelected) next.delete(skill.name)
                      else next.add(skill.name)
                      setSelected(next)
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 text-brand-300 border-brand-600/50'
                        : 'text-gray-500 border-surface-border opacity-50'
                    }`}
                  >
                    {isSelected ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {skill.name}
                    <span className={`badge text-[9px] ml-1 ${SKILL_CATEGORY_COLORS[skill.category] || ''}`}>
                      {skill.category}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-surface-border">
              <span className="text-xs text-gray-500">{selected.size} of {extracted.length} selected</span>
              <button
                onClick={() => addSkillsMutation.mutate()}
                disabled={selected.size === 0 || addSkillsMutation.isPending}
                className="btn-primary"
              >
                {addSkillsMutation.isPending ? 'Saving...' : `Save ${selected.size} Skills to Profile`}
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="card p-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          <h2 className="text-lg font-semibold text-gray-100">Skills saved to your profile!</h2>
          <p className="text-sm text-gray-500">Check the Skill Gap Analyzer to see how you compare to the market.</p>
          <div className="flex gap-3 mt-2">
            <a href="/skills" className="btn-primary">View Skill Gap</a>
            <button onClick={() => setStage('upload')} className="btn-secondary">Analyze Another</button>
          </div>
        </div>
      )}

      {/* Job Description Matcher */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          Job Description Matcher
        </h2>
        <p className="text-xs text-gray-500 mb-3">Paste a job description to see how well your skills match</p>
        <textarea
          className="input h-32 resize-none text-sm"
          placeholder="Paste a job description here..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <button onClick={analyzeMatch} disabled={!jd.trim()} className="btn-secondary mt-3 text-sm">
          Analyze Match
        </button>

        {matchResult && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${matchResult.score >= 70 ? 'text-emerald-400' : matchResult.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {matchResult.score}%
              </div>
              <div>
                <div className="text-sm font-medium text-gray-200">Match Score</div>
                <div className="text-xs text-gray-500">
                  {matchResult.score >= 70 ? 'Strong match — apply now!' : matchResult.score >= 40 ? 'Moderate match — worth applying' : 'Low match — consider upskilling first'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-emerald-400 mb-1.5">Matched ({matchResult.matched.length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.matched.map((s) => (
                    <span key={s} className="badge bg-emerald-900/30 text-emerald-300 border border-emerald-800/40 text-[11px]">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-red-400 mb-1.5">Missing ({matchResult.missing.length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.missing.map((s) => (
                    <span key={s} className="badge bg-red-900/30 text-red-300 border border-red-800/40 text-[11px]">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
