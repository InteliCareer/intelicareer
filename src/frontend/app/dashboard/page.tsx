'use client'

import { useQuery } from '@tanstack/react-query'
import { appsApi, marketApi } from '@/lib/api'
import { STAGE_DOT, STAGE_LABELS, formatSalary } from '@/lib/utils'
import { Briefcase, Zap, TrendingUp, Target, ArrowUpRight, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CHART_COLORS = ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95']

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['app-stats'],
    queryFn: () => appsApi.stats().then((r) => r.data),
  })

  const { data: apps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => appsApi.list().then((r) => r.data),
  })

  const { data: topSkills } = useQuery({
    queryKey: ['top-skills-overview'],
    queryFn: () => marketApi.topSkills('Backend Engineer', 30).then((r) => r.data),
  })

  const activeApps = apps?.filter((a: { stage: string }) =>
    ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER'].includes(a.stage)
  ) ?? []

  const stageData = stats
    ? Object.entries(stats.byStage)
        .filter(([, count]) => (count as number) > 0)
        .map(([stage, count]) => ({ stage: STAGE_LABELS[stage] || stage, count }))
    : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your career at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={stats?.total ?? 0}
          icon={<Briefcase className="w-4 h-4" />}
          color="brand"
        />
        <StatCard
          label="Active Pipeline"
          value={activeApps.length}
          icon={<Target className="w-4 h-4" />}
          color="violet"
        />
        <StatCard
          label="Interviews"
          value={stats?.byStage?.INTERVIEWING ?? 0}
          icon={<TrendingUp className="w-4 h-4" />}
          color="emerald"
        />
        <StatCard
          label="Offers"
          value={stats?.byStage?.OFFER ?? 0}
          icon={<Zap className="w-4 h-4" />}
          color="yellow"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline distribution */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Pipeline Breakdown</h2>
            <span className="text-xs text-gray-500">{stats?.total ?? 0} total</span>
          </div>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageData} barSize={22}>
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: '#1e2535',
                    border: '1px solid #2a3347',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  cursor={{ fill: '#2a3347' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stageData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No applications yet. Start tracking!" />
          )}
        </div>

        {/* Top market skills */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Top Market Skills</h2>
            <span className="text-xs text-gray-500 bg-surface-elevated px-2 py-0.5 rounded">Backend · 30d</span>
          </div>
          {topSkills && topSkills.length > 0 ? (
            <div className="space-y-2">
              {topSkills.slice(0, 7).map((s: { skill: string; count: number }, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-400 truncate shrink-0">{s.skill}</div>
                  <div className="flex-1 bg-surface-elevated rounded-full h-1.5">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full"
                      style={{ width: `${(s.count / (topSkills[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 w-6 text-right">{s.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Loading market data..." />
          )}
        </div>
      </div>

      {/* Recent applications */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300">Recent Applications</h2>
          <a href="/tracker" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        {apps && apps.length > 0 ? (
          <div className="space-y-2">
            {apps.slice(0, 6).map((app: {
              id: string
              jobTitle: string
              company: string
              stage: string
              isRemote: boolean
              salaryMin?: number
              salaryMax?: number
              currency?: string
              createdAt: string
            }) => (
              <div
                key={app.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-elevated transition-colors group"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${STAGE_DOT[app.stage] || 'bg-gray-500'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200 truncate">{app.jobTitle}</span>
                    {app.isRemote && (
                      <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded shrink-0">
                        Remote
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>{app.company}</span>
                    {formatSalary(app.salaryMin, app.salaryMax, app.currency) && (
                      <>
                        <span>·</span>
                        <span>{formatSalary(app.salaryMin, app.salaryMax, app.currency)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500 hidden group-hover:flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      STAGE_DOT[app.stage]?.replace('bg-', 'text-').replace('-400', '-300') || 'text-gray-400'
                    } bg-surface-elevated`}
                  >
                    {STAGE_LABELS[app.stage]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No applications yet. Add your first one in the Tracker!" />
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon, color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  const colorMap: Record<string, string> = {
    brand:   'text-brand-400 bg-brand-900/30',
    violet:  'text-violet-400 bg-violet-900/30',
    emerald: 'text-emerald-400 bg-emerald-900/30',
    yellow:  'text-yellow-400 bg-yellow-900/30',
  }
  return (
    <div className="stat-card">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="stat-value mt-2">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-24 text-gray-500 text-sm">{message}</div>
  )
}
