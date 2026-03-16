'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/lib/api'
import { SKILL_CATEGORY_COLORS } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { Search, Globe, TrendingUp } from 'lucide-react'

const ROLES = [
  'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer',
  'DevOps Engineer', 'Data Engineer', 'Mobile Engineer',
]

const BAR_COLORS = [
  '#8b5cf6','#7c3aed','#6d28d9','#a78bfa','#c4b5fd',
  '#5b21b6','#4c1d95','#ddd6fe','#ede9fe','#818cf8',
]

export default function MarketPage() {
  const [role, setRole] = useState('Backend Engineer')
  const [roleInput, setRoleInput] = useState('Backend Engineer')

  const { data: topSkills, isLoading: loadingSkills } = useQuery({
    queryKey: ['top-skills', role],
    queryFn: () => marketApi.topSkills(role, 90).then((r) => r.data),
  })

  const { data: recentJobs } = useQuery({
    queryKey: ['recent-jobs', role],
    queryFn: () => marketApi.recentJobs(role).then((r) => r.data),
  })

  const { data: salaries } = useQuery({
    queryKey: ['salaries', role],
    queryFn: () => marketApi.salaryRanges(role).then((r) => r.data),
  })

  const maxCount = topSkills?.[0]?.count || 1

  function applyRole() {
    setRole(roleInput)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Market Intelligence</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real hiring trends from the market</p>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              className="input pl-8 w-56 text-sm"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyRole()}
              placeholder="Role to analyze..."
            />
          </div>
          <div className="flex gap-1">
            {ROLES.slice(0, 3).map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setRoleInput(r) }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  role === r
                    ? 'bg-brand-600/20 text-brand-400 border-brand-600/40'
                    : 'text-gray-500 border-surface-border hover:text-gray-300 hover:border-surface-muted'
                }`}
              >
                {r.replace(' Engineer', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Jobs Indexed</div>
          <div className="text-2xl font-bold text-gray-100 mt-1">{recentJobs?.length ?? '—'}</div>
          <div className="text-xs text-gray-600 mt-0.5">for "{role}"</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Top Skill Demand</div>
          <div className="text-2xl font-bold text-gray-100 mt-1">
            {topSkills?.[0]?.skill ?? '—'}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            {topSkills?.[0]?.count ?? 0} mentions
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Remote Jobs</div>
          <div className="text-2xl font-bold text-gray-100 mt-1">
            {recentJobs?.filter((j: { isRemote: boolean }) => j.isRemote).length ?? '—'}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            {recentJobs?.length
              ? `${Math.round((recentJobs.filter((j: { isRemote: boolean }) => j.isRemote).length / recentJobs.length) * 100)}% of listings`
              : ''}
          </div>
        </div>
      </div>

      {/* Top Skills Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-200">Top Skills Demand</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Most required skills for <span className="text-brand-400">{role}</span> in the last 90 days
            </p>
          </div>
          <TrendingUp className="w-4 h-4 text-gray-600" />
        </div>

        {loadingSkills ? (
          <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Analyzing market...</div>
        ) : topSkills && topSkills.length > 0 ? (
          <div className="space-y-3">
            {topSkills.map((s: { skill: string; category: string; count: number }, i: number) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-4 text-xs text-gray-600 text-right shrink-0">{i + 1}</div>
                <div className="w-28 truncate shrink-0">
                  <span className={`badge text-[11px] px-2 py-0.5 ${SKILL_CATEGORY_COLORS[s.category] || SKILL_CATEGORY_COLORS.OTHER}`}>
                    {s.skill}
                  </span>
                </div>
                <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(s.count / maxCount) * 100}%`,
                      background: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 w-16 text-right shrink-0">
                  {s.count} jobs
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
            No data for this role yet
          </div>
        )}
      </div>

      {/* Salary ranges + recent jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Salary chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-1">Salary Ranges</h2>
          <p className="text-xs text-gray-500 mb-4">Average min/max by job title (USD)</p>
          {salaries && salaries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salaries} layout="vertical" barSize={12}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="title" tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false} tickLine={false} width={120} />
                <Tooltip
                  contentStyle={{ background: '#1e2535', border: '1px solid #2a3347', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                />
                <Bar dataKey="avgMin" fill="#6d28d9" radius={[0, 0, 0, 0]} name="Min" />
                <Bar dataKey="avgMax" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Max" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">No salary data</div>
          )}
        </div>

        {/* Recent jobs */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-1">Recent Job Postings</h2>
          <p className="text-xs text-gray-500 mb-4">Latest from the market</p>
          <div className="space-y-2 overflow-y-auto max-h-52">
            {recentJobs?.slice(0, 8).map((job: {
              id: string
              title: string
              company: string
              isRemote: boolean
              location?: string
              postedAt: string
              jobSkills: { skill: { name: string; category: string } }[]
            }) => (
              <div key={job.id} className="flex items-start gap-3 py-2 border-b border-surface-border last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">{job.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <span>{job.company}</span>
                    {job.isRemote ? (
                      <span className="flex items-center gap-0.5 text-emerald-500">
                        <Globe className="w-2.5 h-2.5" /> Remote
                      </span>
                    ) : job.location ? (
                      <span>{job.location}</span>
                    ) : null}
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {job.jobSkills?.slice(0, 4).map((js: { skill: { name: string; category: string } }) => (
                      <span key={js.skill.name}
                        className={`badge text-[10px] ${SKILL_CATEGORY_COLORS[js.skill.category] || SKILL_CATEGORY_COLORS.OTHER}`}>
                        {js.skill.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-gray-600 shrink-0 mt-1">
                  {new Date(job.postedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
