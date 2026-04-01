import { prisma } from '../lib/prisma'

// ── Keyword config ──────────────────────────────────────────────
const SEARCH_KEYWORDS = [
  'backend developer', 'backend engineer', 'node.js developer',
  'nodejs developer', 'typescript developer', 'qa engineer',
  'qa automation', 'test automation', 'software engineer',
  'junior developer', 'junior software engineer', 'fullstack developer',
]

const SKILL_KEYWORDS = [
  'node', 'nodejs', 'node.js', 'typescript', 'javascript',
  'express', 'mongodb', 'redis', 'python', 'qa', 'testing',
  'backend', 'back-end', 'api', 'rest', 'docker',
]

const EUROPE_LOCATIONS = [
  'europe', 'remote', 'worldwide', 'global', 'anywhere',
  'france', 'paris', 'germany', 'berlin', 'munich',
  'netherlands', 'amsterdam', 'uk', 'united kingdom', 'london',
  'spain', 'barcelona', 'madrid', 'portugal', 'lisbon',
  'ireland', 'dublin', 'sweden', 'stockholm',
  'denmark', 'copenhagen', 'finland', 'helsinki',
  'austria', 'vienna', 'switzerland', 'zurich',
  'belgium', 'brussels', 'italy', 'milan', 'rome',
  'poland', 'warsaw', 'czech', 'prague',
  'norway', 'oslo', 'estonia', 'tallinn',
  'luxembourg', 'romania', 'bucharest',
]

function isRelevantJob(title: string, tags?: string): boolean {
  const text = `${title} ${tags || ''}`.toLowerCase()
  return SKILL_KEYWORDS.some(kw => text.includes(kw)) ||
    SEARCH_KEYWORDS.some(kw => text.includes(kw))
}

function isEuropeOrRemote(location: string | null): boolean {
  if (!location) return false
  const loc = location.toLowerCase()
  return EUROPE_LOCATIONS.some(eu => loc.includes(eu))
}

function detectVisa(text: string): boolean {
  const lower = (text || '').toLowerCase()
  return lower.includes('visa sponsor') || lower.includes('visa sponsorship') ||
    lower.includes('work permit') || lower.includes('relocation package') ||
    lower.includes('sponsorship available')
}

const ACCEPTED_CURRENCIES = ['USD', 'EUR', 'GBP']

function detectCurrency(text: string): string | null {
  const lower = (text || '').toLowerCase()
  if (lower.includes('$') || lower.includes('usd') || lower.includes('dollar')) return 'USD'
  if (lower.includes('€') || lower.includes('eur') || lower.includes('euro')) return 'EUR'
  if (lower.includes('£') || lower.includes('gbp') || lower.includes('pound')) return 'GBP'
  return null
}

function parseSalaryFromText(text: string): { min: number | null; max: number | null; currency: string | null } {
  if (!text) return { min: null, max: null, currency: null }

  // Match patterns like "$80,000 - $120,000", "€50k-€70k", "£40,000–£60,000"
  const patterns = [
    /[$€£]\s?([\d,]+)\s*[kK]?\s*[-–—to]+\s*[$€£]?\s*([\d,]+)\s*[kK]?/,
    /([\d,]+)\s*[kK]?\s*[-–—to]+\s*([\d,]+)\s*[kK]?\s*(?:USD|EUR|GBP)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let min = parseInt(match[1].replace(/,/g, ''))
      let max = parseInt(match[2].replace(/,/g, ''))
      // Handle "k" notation (80k = 80000)
      if (min < 1000) min *= 1000
      if (max < 1000) max *= 1000
      const currency = detectCurrency(text)
      if (currency && ACCEPTED_CURRENCIES.includes(currency)) {
        return { min, max, currency }
      }
    }
  }

  return { min: null, max: null, currency: detectCurrency(text) }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000)
}

interface RawJob {
  externalId: string
  source: string
  title: string
  company: string
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  description: string | null
  sourceUrl: string | null
  applyUrl: string | null
  tags: string | null
  isRemote: boolean
  visaSponsorship: boolean
  postedAt: Date
}

// ── Remotive ────────────────────────────────────────────────────
async function scrapeRemotive(mode: 'europe' | 'global'): Promise<RawJob[]> {
  const jobs: RawJob[] = []
  for (const category of ['software-dev', 'qa']) {
    try {
      const res = await fetch(`https://remotive.com/api/remote-jobs?category=${category}&limit=100`)
      if (!res.ok) continue
      const data: any = await res.json()
      for (const j of data.jobs || []) {
        const loc = j.candidate_required_location || ''
        const tagStr = (j.tags || []).join(', ')
        if (!isRelevantJob(j.title, tagStr)) continue
        if (mode === 'europe' && !isEuropeOrRemote(loc)) continue
        const desc = stripHtml(j.description || '')
        const salaryText = `${j.salary || ''} ${desc}`
        const salary = parseSalaryFromText(salaryText)
        const currency = salary.currency || detectCurrency(salaryText)
        jobs.push({
          externalId: `remotive-${j.id}`,
          source: 'remotive',
          title: j.title,
          company: j.company_name,
          location: loc || 'Remote',
          salaryMin: salary.min,
          salaryMax: salary.max,
          currency,
          description: desc,
          sourceUrl: j.url,
          applyUrl: j.url,
          tags: tagStr,
          isRemote: true,
          visaSponsorship: detectVisa(desc),
          postedAt: new Date(j.publication_date || Date.now()),
        })
      }
    } catch (err) {
      console.error(`Remotive ${category}:`, err)
    }
  }
  return jobs
}

// ── Arbeitnow ───────────────────────────────────────────────────
async function scrapeArbeitnow(mode: 'europe' | 'global'): Promise<RawJob[]> {
  const jobs: RawJob[] = []
  try {
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`)
      if (!res.ok) break
      const data: any = await res.json()
      for (const j of data.data || []) {
        const tagStr = (j.tags || []).join(', ')
        if (!isRelevantJob(j.title, tagStr)) continue
        // Focus on remote jobs
        if (!j.remote && mode === 'europe' && !isEuropeOrRemote(j.location)) continue
        const desc = stripHtml(j.description || '')
        const salary = parseSalaryFromText(desc)
        const currency = salary.currency || detectCurrency(desc)
        jobs.push({
          externalId: `arbeitnow-${j.slug}`,
          source: 'arbeitnow',
          title: j.title,
          company: j.company_name,
          location: j.location || 'Europe',
          salaryMin: salary.min,
          salaryMax: salary.max,
          currency,
          description: desc,
          sourceUrl: j.url,
          applyUrl: j.url,
          tags: tagStr,
          isRemote: !!j.remote,
          visaSponsorship: detectVisa(desc),
          postedAt: j.created_at ? new Date(j.created_at * 1000) : new Date(),
        })
      }
      if (!data.links?.next) break
    }
  } catch (err) {
    console.error('Arbeitnow:', err)
  }
  return jobs
}

// ── RemoteOK ────────────────────────────────────────────────────
async function scrapeRemoteOK(mode: 'europe' | 'global'): Promise<RawJob[]> {
  const jobs: RawJob[] = []
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: { 'User-Agent': 'InteliCareer/1.0' },
    })
    if (!res.ok) return jobs
    const data: any = await res.json()
    const listings = Array.isArray(data) ? data.slice(1) : []
    for (const j of listings) {
      const tagStr = (j.tags || []).join(', ')
      const loc = j.location || 'Remote'
      if (!isRelevantJob(j.position || '', tagStr)) continue
      if (mode === 'europe' && !isEuropeOrRemote(loc)) continue
      const desc = stripHtml(j.description || '')
      jobs.push({
        externalId: `remoteok-${j.id}`,
        source: 'remoteok',
        title: j.position || j.title || '',
        company: j.company || '',
        location: loc,
        salaryMin: j.salary_min ? parseInt(j.salary_min) : null,
        salaryMax: j.salary_max ? parseInt(j.salary_max) : null,
        currency: j.salary_min ? 'USD' : null,
        description: desc,
        sourceUrl: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
        applyUrl: j.apply_url || j.url || `https://remoteok.com/remote-jobs/${j.id}`,
        tags: tagStr,
        isRemote: true,
        visaSponsorship: detectVisa(desc),
        postedAt: j.date ? new Date(j.date) : new Date(),
      })
    }
  } catch (err) {
    console.error('RemoteOK:', err)
  }
  return jobs
}

// ── Upsert into DB ──────────────────────────────────────────────
async function upsertJobs(rawJobs: RawJob[]): Promise<number> {
  let inserted = 0
  for (const job of rawJobs) {
    try {
      await prisma.job.upsert({
        where: { externalId: job.externalId },
        update: {
          title: job.title,
          company: job.company,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          description: job.description,
          sourceUrl: job.sourceUrl,
          applyUrl: job.applyUrl,
          tags: job.tags,
          isRemote: job.isRemote,
          visaSponsorship: job.visaSponsorship,
        },
        create: {
          externalId: job.externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          description: job.description,
          sourceUrl: job.sourceUrl,
          applyUrl: job.applyUrl,
          tags: job.tags,
          isRemote: job.isRemote,
          visaSponsorship: job.visaSponsorship,
          postedAt: job.postedAt,
          source: job.source,
          autoApplyStatus: 'ELIGIBLE',
        },
      })
      inserted++
    } catch {
      // duplicate or constraint violation — skip
    }
  }
  return inserted
}

// ── Public API ──────────────────────────────────────────────────
// mode: "europe" = only Europe/remote locations (default)
//       "global" = all locations, just filter by skills
export async function runAllScrapers(mode: 'europe' | 'global' = 'europe') {
  const results: { source: string; found: number; inserted: number }[] = []

  const scrapers = [
    { name: 'remotive', fn: () => scrapeRemotive(mode) },
    { name: 'arbeitnow', fn: () => scrapeArbeitnow(mode) },
    { name: 'remoteok', fn: () => scrapeRemoteOK(mode) },
  ]

  for (const { name, fn } of scrapers) {
    console.log(`[Scraper] ${name} (${mode})...`)
    const jobs = await fn()
    const inserted = await upsertJobs(jobs)
    results.push({ source: name, found: jobs.length, inserted })
    console.log(`[Scraper] ${name}: ${jobs.length} found, ${inserted} upserted`)
  }

  return results
}
