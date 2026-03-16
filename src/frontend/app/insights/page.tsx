'use client'

import { useQuery } from '@tanstack/react-query'
import { userApi, marketApi } from '@/lib/api'
import { SKILL_CATEGORY_COLORS } from '@/lib/utils'
import { Zap, TrendingUp, Target, BookOpen, ArrowRight, Star } from 'lucide-react'

const LEARNING_RESOURCES: Record<string, string> = {
  'Kubernetes':      'https://kubernetes.io/docs/tutorials/',
  'AWS':             'https://aws.amazon.com/training/',
  'Docker':          'https://docs.docker.com/get-started/',
  'TypeScript':      'https://www.typescriptlang.org/docs/',
  'React':           'https://react.dev/learn',
  'PostgreSQL':      'https://www.postgresql.org/docs/',
  'Redis':           'https://redis.io/docs/',
  'GraphQL':         'https://graphql.org/learn/',
  'Go':              'https://go.dev/learn/',
  'Python':          'https://docs.python.org/3/tutorial/',
  'System Design':   'https://github.com/donnemartin/system-design-primer',
  'CI/CD':           'https://www.atlassian.com/continuous-delivery',
  'Terraform':       'https://developer.hashicorp.com/terraform/tutorials',
}

export default function InsightsPage() {
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.me().then((r) => r.data),
  })

  const { data: userSkills = [] } = useQuery({
    queryKey: ['user-skills'],
    queryFn: () => userApi.skills().then((r) => r.data),
  })

  const targetRole = profile?.profile?.targetRole || 'Backend Engineer'

  const { data: gapData, isLoading } = useQuery({
    queryKey: ['skill-gap', targetRole],
    queryFn: () => marketApi.skillGap(targetRole).then((r) => r.data),
  })

  const topGaps = gapData?.gaps?.slice(0, 5) ?? []
  const strengths = gapData?.strengths ?? []
  const coverageScore = gapData?.coverageScore ?? 0

  // Generate insights from real data
  const insights = generateInsights({
    coverageScore,
    topGaps,
    strengths,
    targetRole,
    skillCount: userSkills.length,
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Career Insights</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Personalized analysis for{' '}
          <span className="text-brand-400 font-medium">{targetRole}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Generating insights...
        </div>
      ) : (
        <>
          {/* Score overview */}
          <div className="card p-6">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e2535" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={coverageScore >= 70 ? '#10b981' : coverageScore >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${coverageScore} ${100 - coverageScore}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-bold ${coverageScore >= 70 ? 'text-emerald-400' : coverageScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {coverageScore}%
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-100">
                  {coverageScore >= 70 ? 'Strong Profile' : coverageScore >= 40 ? 'Developing Profile' : 'Early Stage Profile'}
                </h2>
                <p className="text-sm text-gray-400 mt-1 max-w-md">
                  {insights.summary}
                </p>
                <div className="flex gap-4 mt-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-400">{strengths.length}</div>
                    <div className="text-xs text-gray-500">Strengths</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-400">{topGaps.length}</div>
                    <div className="text-xs text-gray-500">Key Gaps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-brand-400">{userSkills.length}</div>
                    <div className="text-xs text-gray-500">Total Skills</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Next steps */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-400" /> Priority Actions
              </h2>
              <div className="space-y-3">
                {insights.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-900/50 border border-brand-700/40 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-brand-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills to learn */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" /> Skills to Learn Next
              </h2>
              <div className="space-y-3">
                {topGaps.slice(0, 4).map((gap: { skill: string; category: string; demandPct: number }) => (
                  <div key={gap.skill} className="flex items-center gap-3 group">
                    <span className={`badge text-[11px] ${SKILL_CATEGORY_COLORS[gap.category] || SKILL_CATEGORY_COLORS.OTHER}`}>
                      {gap.skill}
                    </span>
                    <div className="flex-1">
                      <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                        <div className="h-1 bg-brand-600 rounded-full" style={{ width: `${gap.demandPct}%` }} />
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">{gap.demandPct}% of job postings require this</div>
                    </div>
                    {LEARNING_RESOURCES[gap.skill] ? (
                      <a
                        href={LEARNING_RESOURCES[gap.skill]}
                        target="_blank" rel="noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" /> Your Market Strengths
              </h2>
              <div className="flex flex-wrap gap-2">
                {strengths.map((s: { skill: string; category: string; demandPct: number }) => (
                  <div key={s.skill} className="flex items-center gap-1.5">
                    <span className={`badge text-[11px] ${SKILL_CATEGORY_COLORS[s.category] || SKILL_CATEGORY_COLORS.OTHER}`}>
                      {s.skill}
                    </span>
                    <span className="text-[10px] text-emerald-500">{s.demandPct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Career path suggestions */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Career Path Suggestions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {insights.paths.map((path, i) => (
                <div key={i} className="bg-surface-elevated rounded-lg p-4 border border-surface-border">
                  <div className="text-sm font-semibold text-gray-200">{path.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{path.description}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="flex-1 h-1 bg-surface-muted rounded-full overflow-hidden">
                      <div className="h-1 bg-brand-500 rounded-full" style={{ width: `${path.match}%` }} />
                    </div>
                    <span className="text-[10px] text-brand-400 shrink-0">{path.match}% match</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function generateInsights({
  coverageScore, topGaps, strengths, targetRole, skillCount,
}: {
  coverageScore: number
  topGaps: { skill: string; demandPct: number }[]
  strengths: { skill: string; demandPct: number }[]
  targetRole: string
  skillCount: number
}) {
  const summary =
    coverageScore >= 70
      ? `You cover ${coverageScore}% of top skills for ${targetRole}. You are well-positioned. Focus on depth and applying.`
      : coverageScore >= 40
      ? `You cover ${coverageScore}% of required skills. ${topGaps[0]?.skill || 'Key skills'} would make a significant difference.`
      : `You cover ${coverageScore}% of skills. Building ${topGaps.slice(0, 2).map((g) => g.skill).join(' and ')} should be your priority.`

  const actions: string[] = []
  if (topGaps[0]) actions.push(`Learn ${topGaps[0].skill} — required in ${topGaps[0].demandPct}% of ${targetRole} job postings.`)
  if (topGaps[1]) actions.push(`Add ${topGaps[1].skill} to your skillset — a high-leverage gap for this role.`)
  if (skillCount < 5) actions.push('Add more skills to your profile for a more accurate gap analysis.')
  actions.push('Apply to at least 5 positions per week and track them in the Tracker.')
  if (strengths.length > 0) actions.push(`Highlight ${strengths.slice(0, 2).map((s) => s.skill).join(' and ')} prominently in your resume — these are in high demand.`)

  const paths = [
    {
      title: targetRole,
      description: 'Your current target role',
      match: coverageScore,
    },
    {
      title: targetRole.includes('Senior') ? targetRole.replace('Senior', 'Lead') : `Senior ${targetRole}`,
      description: 'Next career level',
      match: Math.max(coverageScore - 20, 10),
    },
    {
      title: targetRole.includes('Backend') ? 'Full Stack Engineer' : targetRole.includes('Frontend') ? 'Full Stack Engineer' : 'Staff Engineer',
      description: 'Adjacent role with high skill overlap',
      match: Math.min(coverageScore + 10, 95),
    },
  ]

  return { summary, actions, paths }
}
