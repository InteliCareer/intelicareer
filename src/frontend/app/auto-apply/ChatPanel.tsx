'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Bot, User, Send, Loader2, Link2, Target, Sparkles, Award, Check,
} from 'lucide-react'
import { scraperApi, userApi } from '@/lib/api'
import {
  GRADE_STYLES, type Portal, type ProfileState, type EvaluationData,
} from '@/lib/types'

type Phase =
  | 'needs_cv'
  | 'ask_role'
  | 'ask_years'
  | 'ask_remote'
  | 'ask_location'
  | 'ready'

type Message =
  | { role: 'user'; text: string; id: string }
  | { role: 'assistant'; id: string; kind: 'text'; text: string }
  | { role: 'assistant'; id: string; kind: 'step'; step: number; title: string; body: string }
  | { role: 'assistant'; id: string; kind: 'import'; job: { title: string; company: string; id: string }; evaluation?: EvaluationData }
  | { role: 'assistant'; id: string; kind: 'scan'; results: { company: string; ats: string; found: number; inserted: number }[]; totalNew: number }
  | { role: 'assistant'; id: string; kind: 'search'; query: string }
  | { role: 'assistant'; id: string; kind: 'summary'; profile: ProfileState }
  | { role: 'assistant'; id: string; kind: 'error'; text: string }

const URL_RE = /\b(https?:\/\/[^\s]+)/i
const ATS_HOST_RE = /(greenhouse\.io|lever\.co|ashbyhq\.com)/i

function newId() { return Math.random().toString(36).slice(2) }

function computeInitialPhase(hasResume: boolean, p: ProfileState | null): Phase {
  if (!hasResume) return 'needs_cv'
  if (!p?.targetRole) return 'ask_role'
  if (p.yearsExperience == null) return 'ask_years'
  if (!p.targetLocation && !p.isRemotePreferred) return 'ask_remote'
  return 'ready'
}

export default function ChatPanel({
  portals,
  hasResume,
  profile,
  onJobsUpdated,
  onSearchQuery,
  onProfileSaved,
}: {
  portals: Portal[]
  hasResume: boolean
  profile: ProfileState | null
  onJobsUpdated: () => void
  onSearchQuery: (q: string) => void
  onProfileSaved: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [phase, setPhase] = useState<Phase>(() => computeInitialPhase(hasResume, profile))
  const [draftProfile, setDraftProfile] = useState<ProfileState>(() => profile ?? {
    targetRole: null, yearsExperience: null, isRemotePreferred: false, targetLocation: null,
  })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const introducedPhasesRef = useRef<Set<Phase>>(new Set())

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Seed / advance intro messages when phase changes
  useEffect(() => {
    if (introducedPhasesRef.current.has(phase)) return
    introducedPhasesRef.current.add(phase)
    if (phase === 'needs_cv') {
      pushAssistant({ kind: 'step', step: 1, title: 'Upload your CV', body: 'Use the "Your Resume" card below to drop in your CV (PDF or Word). I\'ll wait — once it\'s uploaded I\'ll ask a couple of quick questions to dial in scoring.' })
    } else if (phase === 'ask_role') {
      pushAssistant({ kind: 'step', step: 2, title: 'What role are you targeting?', body: 'e.g. "Senior Backend Engineer", "QA Automation Lead", "Full-Stack Developer". This is used to grade how well each job\'s title matches what you want.' })
    } else if (phase === 'ask_years') {
      pushAssistant({ kind: 'step', step: 3, title: 'How many years of experience?', body: 'Just a number — e.g. 3, 5, 8.' })
    } else if (phase === 'ask_remote') {
      pushAssistant({ kind: 'step', step: 4, title: 'Do you prefer remote work?', body: 'Reply yes or no. If yes, I\'ll weight remote and hybrid roles higher.' })
    } else if (phase === 'ask_location') {
      pushAssistant({ kind: 'step', step: 5, title: 'Preferred location?', body: 'City, country, or region — e.g. "Berlin", "Europe", "Lisbon". Type "skip" if none.' })
    } else if (phase === 'ready') {
      if (introducedPhasesRef.current.size > 1) {
        // Arrived here via onboarding — show summary + ready message.
        pushAssistant({ kind: 'summary', profile: draftProfile })
        pushAssistant({ kind: 'text', text: "All set. You can now paste a job URL, type `scan ai`, or ask me to `score my top match`." })
      } else {
        pushAssistant({ kind: 'text', text: "Welcome back. Paste a URL, type `scan ai`, `score my top match`, or just describe what you're looking for." })
      }
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // If the user uploads a CV mid-conversation, auto-advance past needs_cv.
  useEffect(() => {
    if (phase === 'needs_cv' && hasResume) {
      pushAssistant({ kind: 'text', text: 'Great — got your CV.' })
      setPhase(computeInitialPhase(true, profile))
    }
  }, [hasResume]) // eslint-disable-line react-hooks/exhaustive-deps

  function push(msg: Message) {
    setMessages(prev => [...prev, msg])
  }
  type AssistantMsg = Extract<Message, { role: 'assistant' }>
  type AssistantBody = AssistantMsg extends infer M ? M extends AssistantMsg ? Omit<M, 'role' | 'id'> : never : never
  function pushAssistant(body: AssistantBody) {
    setMessages(prev => [...prev, { role: 'assistant', id: newId(), ...body } as Message])
  }

  async function handleSubmit(raw?: string) {
    const text = (raw ?? input).trim()
    if (!text || busy) return
    setInput('')
    push({ role: 'user', id: newId(), text })
    setBusy(true)
    try {
      if (phase !== 'ready') await handleOnboardingAnswer(text)
      else await route(text)
    } catch (err: any) {
      push({ role: 'assistant', id: newId(), kind: 'error', text: err?.message || 'Something went wrong.' })
    }
    setBusy(false)
  }

  async function handleOnboardingAnswer(text: string) {
    const t = text.trim()
    if (phase === 'needs_cv') {
      pushAssistant({ kind: 'text', text: "I'll wait for the CV first — upload it using the Resume card below." })
      return
    }
    if (phase === 'ask_role') {
      const next = { ...draftProfile, targetRole: t }
      setDraftProfile(next)
      await userApi.update({ targetRole: t })
      onProfileSaved()
      setPhase('ask_years')
      return
    }
    if (phase === 'ask_years') {
      const n = parseInt(t.replace(/\D/g, ''), 10)
      if (isNaN(n) || n < 0 || n > 60) {
        pushAssistant({ kind: 'error', text: "I need a number — e.g. 3 or 7." })
        return
      }
      const next = { ...draftProfile, yearsExperience: n }
      setDraftProfile(next)
      await userApi.update({ yearsExperience: n })
      onProfileSaved()
      setPhase('ask_remote')
      return
    }
    if (phase === 'ask_remote') {
      const yes = /^(y|yes|yeah|yep|true|remote)\b/i.test(t)
      const no = /^(n|no|nope|false|onsite|office)\b/i.test(t)
      if (!yes && !no) {
        pushAssistant({ kind: 'error', text: "Please reply yes or no." })
        return
      }
      const next = { ...draftProfile, isRemotePreferred: yes }
      setDraftProfile(next)
      await userApi.update({ isRemotePreferred: yes })
      onProfileSaved()
      setPhase('ask_location')
      return
    }
    if (phase === 'ask_location') {
      if (/^skip$/i.test(t)) {
        setPhase('ready')
        return
      }
      const next = { ...draftProfile, targetLocation: t }
      setDraftProfile(next)
      await userApi.update({ targetLocation: t })
      onProfileSaved()
      setPhase('ready')
      return
    }
  }

  async function route(text: string) {
    const urlMatch = text.match(URL_RE)
    if (urlMatch && ATS_HOST_RE.test(urlMatch[1])) {
      return doImport(urlMatch[1])
    }

    const lower = text.toLowerCase().trim()

    if (lower.startsWith('scan')) {
      const rest = text.slice(4).trim()
      return doScan(rest)
    }

    if (lower.startsWith('score ') || lower === 'score') {
      const q = text.slice(5).trim() || undefined
      return doScoreFirst(q)
    }

    if (lower.startsWith('find ') || lower.startsWith('search ') || lower.startsWith('show ')) {
      const q = text.replace(/^(find|search|show)\s+/i, '').trim()
      return doSearch(q)
    }

    // Default: treat as a search query against the saved jobs.
    return doSearch(text)
  }

  async function doImport(url: string) {
    push({ role: 'assistant', id: newId(), kind: 'text', text: `Importing from ${new URL(url).hostname}…` })
    const { data } = await scraperApi.importUrl(url)
    const job = data.job
    let evaluation: EvaluationData | undefined
    try {
      const { data: evalResp } = await scraperApi.evaluate(job.id)
      evaluation = evalResp.evaluation
    } catch { /* scoring is best-effort */ }
    onJobsUpdated()
    push({
      role: 'assistant',
      id: newId(),
      kind: 'import',
      job: { id: job.id, title: job.title, company: job.company },
      evaluation,
    })
  }

  async function doScan(rest: string) {
    const tokens = resolveScanTokens(rest, portals)
    if (rest && tokens.length === 0) {
      push({ role: 'assistant', id: newId(), kind: 'error', text: `No companies matched "${rest}". Try: scan ai, scan anthropic openai, or scan all.` })
      return
    }
    push({
      role: 'assistant', id: newId(), kind: 'text',
      text: tokens.length === 0
        ? `Scanning all ${portals.length} portals — this may take a moment…`
        : `Scanning ${tokens.length} portal${tokens.length === 1 ? '' : 's'}…`,
    })
    const { data } = await scraperApi.scanPortals(tokens.length > 0 ? tokens : undefined)
    onJobsUpdated()
    push({ role: 'assistant', id: newId(), kind: 'scan', results: data.results, totalNew: data.totalNew })
  }

  async function doScoreFirst(q?: string) {
    const params: Record<string, string> = { limit: '1' }
    if (q) params.search = q
    const { data } = await scraperApi.jobs(params)
    const top = data.jobs?.[0]
    if (!top) {
      push({ role: 'assistant', id: newId(), kind: 'error', text: q ? `No jobs found matching "${q}".` : 'No jobs in your list yet.' })
      return
    }
    const { data: evalResp } = await scraperApi.evaluate(top.id)
    onJobsUpdated()
    push({
      role: 'assistant',
      id: newId(),
      kind: 'import',
      job: { id: top.id, title: top.title, company: top.company },
      evaluation: evalResp.evaluation,
    })
  }

  async function doSearch(q: string) {
    onSearchQuery(q)
    push({ role: 'assistant', id: newId(), kind: 'search', query: q })
  }

  const suggestions = phase === 'ready'
    ? [
        { label: 'Scan AI companies', value: 'scan ai' },
        { label: 'Scan dev tools',    value: 'scan devtools' },
        { label: 'Score my top match', value: 'score' },
        { label: 'Find backend jobs', value: 'find backend' },
      ]
    : phase === 'ask_remote'
    ? [
        { label: 'Yes, remote', value: 'yes' },
        { label: 'No, prefer onsite/hybrid', value: 'no' },
      ]
    : phase === 'ask_location'
    ? [
        { label: 'Skip', value: 'skip' },
        { label: 'Europe', value: 'Europe' },
        { label: 'Remote', value: 'Remote' },
      ]
    : []

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border">
        <Bot className="w-4 h-4 text-brand-400" />
        <h3 className="text-sm font-semibold text-gray-200">Career Assistant</h3>
        <span className="text-xs text-gray-500 ml-1">
          paste a URL · <code className="text-gray-400">scan</code> · <code className="text-gray-400">score</code> · <code className="text-gray-400">find</code>
        </span>
      </div>

      <div ref={scrollRef} className="px-4 py-3 space-y-3 max-h-[420px] overflow-y-auto">
        {messages.map(m => <MessageRow key={m.id} msg={m} />)}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> thinking…
          </div>
        )}
      </div>

      <div className="px-4 pt-0 pb-3 flex gap-1 flex-wrap">
        {suggestions.map(s => (
          <button
            key={s.value}
            onClick={() => handleSubmit(s.value)}
            disabled={busy}
            className="px-2.5 py-1 rounded-full text-[11px] bg-surface-elevated border border-surface-border text-gray-300 hover:border-brand-500 hover:text-brand-300 transition disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="px-3 pb-3 flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
          placeholder="Paste a URL, type a command, or just describe what you want…"
          className="flex-1 px-3 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500"
          disabled={busy}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={busy || !input.trim()}
          className="flex items-center gap-1 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ── Message rendering ──────────────────────────────────────────────

function MessageRow({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex items-start gap-2 justify-end">
        <div className="max-w-[80%] px-3 py-2 rounded-lg bg-brand-600/20 border border-brand-700/40 text-sm text-gray-100">
          {msg.text}
        </div>
        <div className="w-6 h-6 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-brand-900/40 border border-brand-700/50 flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        {msg.kind === 'text'    && <p className="text-sm text-gray-300">{msg.text}</p>}
        {msg.kind === 'error'   && <p className="text-sm text-red-400">{msg.text}</p>}
        {msg.kind === 'step'    && <StepCard step={msg.step} title={msg.title} body={msg.body} />}
        {msg.kind === 'search'  && <SearchCard query={msg.query} />}
        {msg.kind === 'scan'    && <ScanCard results={msg.results} totalNew={msg.totalNew} />}
        {msg.kind === 'import'  && <ImportCard job={msg.job} evaluation={msg.evaluation} />}
        {msg.kind === 'summary' && <SummaryCard profile={msg.profile} />}
      </div>
    </div>
  )
}

function StepCard({ step, title, body }: { step: number; title: string; body: string }) {
  return (
    <div className="rounded-lg bg-brand-950/30 border border-brand-800/60 p-3 space-y-1">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold">
          {step}
        </span>
        <span className="text-sm font-semibold text-gray-100">{title}</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{body}</p>
    </div>
  )
}

function SummaryCard({ profile }: { profile: ProfileState }) {
  const rows: [string, string][] = [
    ['Target role', profile.targetRole || '—'],
    ['Experience', profile.yearsExperience != null ? `${profile.yearsExperience} years` : '—'],
    ['Remote preferred', profile.isRemotePreferred ? 'Yes' : 'No'],
    ['Location', profile.targetLocation || '—'],
  ]
  return (
    <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/60 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-sm font-semibold text-gray-100">Profile saved</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="text-xs">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">{k}</div>
            <div className="text-gray-200">{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SearchCard({ query }: { query: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border">
      <span className="text-xs text-gray-500">Filtered jobs by</span>
      <span className="text-xs font-mono text-brand-400">{query || '(everything)'}</span>
    </div>
  )
}

function ScanCard({ results, totalNew }: { results: { company: string; ats: string; found: number; inserted: number }[]; totalNew: number }) {
  const active = results.filter(r => r.found > 0)
  return (
    <div className="rounded-lg bg-surface-elevated border border-surface-border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Target className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-sm font-medium text-gray-200">Scan complete</span>
        <span className="text-xs text-gray-500">· {totalNew} new job{totalNew === 1 ? '' : 's'} across {active.length}/{results.length} companies</span>
      </div>
      {active.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {active.slice(0, 20).map((r, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-900/40 text-indigo-200 border border-indigo-700/40">
              {r.company} +{r.inserted}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ImportCard({ job, evaluation }: {
  job: { title: string; company: string; id: string }
  evaluation?: EvaluationData
}) {
  return (
    <div className="rounded-lg bg-surface-elevated border border-surface-border p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Link2 className="w-3.5 h-3.5 text-brand-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-100">{job.title}</div>
          <div className="text-xs text-gray-500">{job.company}</div>
        </div>
        {evaluation && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${GRADE_STYLES[evaluation.grade]}`}>
            <Award className="w-2.5 h-2.5 inline mr-0.5" />
            {evaluation.grade} · {evaluation.score}
          </span>
        )}
      </div>
      {evaluation && (
        <>
          <p className="text-xs text-gray-400">{evaluation.summary}</p>
          {evaluation.breakdown.skills.matched.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {evaluation.breakdown.skills.matched.slice(0, 6).map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 text-[10px] border border-emerald-700/50">
                  {s}
                </span>
              ))}
              {evaluation.breakdown.skills.missing.slice(0, 4).map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 text-[10px] border border-red-700/40">
                  ~{s}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <div className="text-[10px] text-gray-500">
        <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
        Saved to your job list — scroll down to apply or skip
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

function resolveScanTokens(rest: string, portals: Portal[]): string[] {
  if (!rest || /^all\b/i.test(rest)) return []
  const phrase = rest.toLowerCase()
  const categoryAliases: Record<string, Portal['category']> = {
    ai: 'ai',
    'ai companies': 'ai',
    'ml': 'ai',
    devtools: 'devtools',
    'dev tools': 'devtools',
    'developer tools': 'devtools',
    fintech: 'fintech',
    finance: 'fintech',
    bigtech: 'bigtech',
    'big tech': 'bigtech',
  }
  for (const [alias, cat] of Object.entries(categoryAliases)) {
    if (phrase === alias || phrase.startsWith(alias + ' ') || phrase.endsWith(' ' + alias)) {
      return portals.filter(p => p.category === cat).map(p => p.key)
    }
  }
  const tokens = phrase.split(/[,\s]+/).filter(Boolean)
  const keys = new Set<string>()
  for (const t of tokens) {
    for (const p of portals) {
      if (
        p.company.toLowerCase().includes(t) ||
        p.key.toLowerCase().includes(t)
      ) {
        keys.add(p.key)
      }
    }
  }
  return Array.from(keys)
}
