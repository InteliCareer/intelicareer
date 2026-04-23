// Company-portal (ATS) scrapers: Greenhouse, Lever, Ashby.
// Modeled on the "Portal Scanner" pattern from santifer/career-ops, but served
// via stateless public JSON APIs so it runs in our Express process without
// Playwright or an agent loop.

import { prisma } from '../lib/prisma'

export type ATS = 'greenhouse' | 'lever' | 'ashby'

export interface Portal {
  company: string
  ats: ATS
  token: string
  category: 'ai' | 'devtools' | 'fintech' | 'bigtech' | 'other'
}

// Seed list — roughly mirrors the companies career-ops ships with.
// Tokens that 404 are caught per-request and skipped silently.
export const PORTALS: Portal[] = [
  { company: 'Anthropic',    ats: 'greenhouse', token: 'anthropic',   category: 'ai' },
  { company: 'OpenAI',       ats: 'greenhouse', token: 'openai',      category: 'ai' },
  { company: 'Hugging Face', ats: 'greenhouse', token: 'huggingface', category: 'ai' },
  { company: 'Cohere',       ats: 'greenhouse', token: 'cohere',      category: 'ai' },
  { company: 'ElevenLabs',   ats: 'ashby',      token: 'elevenlabs',  category: 'ai' },
  { company: 'Perplexity',   ats: 'ashby',      token: 'perplexity',  category: 'ai' },
  { company: 'Mistral AI',   ats: 'ashby',      token: 'mistralai',   category: 'ai' },

  { company: 'GitHub',       ats: 'greenhouse', token: 'github',      category: 'devtools' },
  { company: 'Vercel',       ats: 'greenhouse', token: 'vercel',      category: 'devtools' },
  { company: 'Replit',       ats: 'greenhouse', token: 'replit',      category: 'devtools' },
  { company: 'Linear',       ats: 'ashby',      token: 'linear',      category: 'devtools' },
  { company: 'Supabase',     ats: 'ashby',      token: 'supabase',    category: 'devtools' },
  { company: 'PostHog',      ats: 'ashby',      token: 'posthog',     category: 'devtools' },
  { company: 'Neon',         ats: 'ashby',      token: 'neon',        category: 'devtools' },
  { company: 'Railway',      ats: 'ashby',      token: 'railway',     category: 'devtools' },

  { company: 'Stripe',       ats: 'greenhouse', token: 'stripe',      category: 'fintech' },
  { company: 'Ramp',         ats: 'ashby',      token: 'ramp',        category: 'fintech' },
  { company: 'Mercury',      ats: 'ashby',      token: 'mercury',     category: 'fintech' },
  { company: 'Bitrefill',    ats: 'lever',      token: 'bitrefill',   category: 'fintech' },

  { company: 'Airbnb',       ats: 'greenhouse', token: 'airbnb',      category: 'bigtech' },
  { company: 'Shopify',      ats: 'greenhouse', token: 'shopify',     category: 'bigtech' },
  { company: 'Discord',      ats: 'greenhouse', token: 'discord',     category: 'bigtech' },
  { company: 'Reddit',       ats: 'greenhouse', token: 'reddit',      category: 'bigtech' },
  { company: 'Figma',        ats: 'greenhouse', token: 'figma',       category: 'bigtech' },
  { company: 'Notion',       ats: 'greenhouse', token: 'notionhq',    category: 'bigtech' },
  { company: 'Spotify',      ats: 'lever',      token: 'spotify',     category: 'bigtech' },
  { company: 'Netflix',      ats: 'lever',      token: 'netflix',     category: 'bigtech' },
]

interface RawPortalJob {
  externalId: string
  source: string
  title: string
  company: string
  location: string | null
  description: string | null
  applyUrl: string | null
  sourceUrl: string | null
  isRemote: boolean
  postedAt: Date
}

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000)
}

function detectRemote(text: string, location: string | null): boolean {
  const hay = `${location || ''} ${text || ''}`.toLowerCase()
  return /\b(remote|anywhere|worldwide|work\s*from\s*home)\b/.test(hay)
}

async function fetchGreenhouse(portal: Portal): Promise<RawPortalJob[]> {
  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${portal.token}/jobs?content=true`,
  )
  if (!res.ok) return []
  const data: any = await res.json()
  return (data.jobs || []).map((j: any) => {
    const desc = stripHtml(j.content || '')
    const loc = j.location?.name || null
    return {
      externalId: `greenhouse-${portal.token}-${j.id}`,
      source: 'greenhouse',
      title: j.title,
      company: portal.company,
      location: loc,
      description: desc,
      applyUrl: j.absolute_url,
      sourceUrl: j.absolute_url,
      isRemote: detectRemote(desc, loc),
      postedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
    } satisfies RawPortalJob
  })
}

async function fetchLever(portal: Portal): Promise<RawPortalJob[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${portal.token}?mode=json`)
  if (!res.ok) return []
  const data: any = await res.json()
  return (Array.isArray(data) ? data : []).map((j: any) => {
    const desc = stripHtml((j.descriptionPlain || j.description || '') as string)
    const loc = j.categories?.location || null
    return {
      externalId: `lever-${portal.token}-${j.id}`,
      source: 'lever',
      title: j.text,
      company: portal.company,
      location: loc,
      description: desc,
      applyUrl: j.applyUrl || j.hostedUrl,
      sourceUrl: j.hostedUrl,
      isRemote: detectRemote(desc, loc) || /remote/i.test(j.categories?.commitment || ''),
      postedAt: j.createdAt ? new Date(j.createdAt) : new Date(),
    } satisfies RawPortalJob
  })
}

async function fetchAshby(portal: Portal): Promise<RawPortalJob[]> {
  const res = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${portal.token}?includeCompensation=true`,
  )
  if (!res.ok) return []
  const data: any = await res.json()
  return (data.jobs || []).map((j: any) => {
    const desc = stripHtml(j.descriptionHtml || j.description || '')
    const loc = j.location || j.locationName || null
    return {
      externalId: `ashby-${portal.token}-${j.id}`,
      source: 'ashby',
      title: j.title,
      company: portal.company,
      location: loc,
      description: desc,
      applyUrl: j.applyUrl || j.jobUrl,
      sourceUrl: j.jobUrl || j.applyUrl,
      isRemote: !!j.isRemote || detectRemote(desc, loc),
      postedAt: j.publishedAt ? new Date(j.publishedAt) : new Date(),
    } satisfies RawPortalJob
  })
}

async function fetchPortal(portal: Portal): Promise<RawPortalJob[]> {
  try {
    if (portal.ats === 'greenhouse') return await fetchGreenhouse(portal)
    if (portal.ats === 'lever')      return await fetchLever(portal)
    if (portal.ats === 'ashby')      return await fetchAshby(portal)
    return []
  } catch (err) {
    console.error(`[Portal] ${portal.company} (${portal.ats}:${portal.token})`, err)
    return []
  }
}

async function upsertPortalJobs(raws: RawPortalJob[]): Promise<number> {
  let inserted = 0
  for (const j of raws) {
    try {
      await prisma.job.upsert({
        where: { externalId: j.externalId },
        update: {
          title: j.title,
          company: j.company,
          location: j.location,
          description: j.description,
          applyUrl: j.applyUrl,
          sourceUrl: j.sourceUrl,
          isRemote: j.isRemote,
        },
        create: {
          externalId: j.externalId,
          title: j.title,
          company: j.company,
          location: j.location,
          description: j.description,
          applyUrl: j.applyUrl,
          sourceUrl: j.sourceUrl,
          isRemote: j.isRemote,
          postedAt: j.postedAt,
          source: j.source,
          autoApplyStatus: 'ELIGIBLE',
        },
      })
      inserted++
    } catch {
      /* duplicate / constraint — skip */
    }
  }
  return inserted
}

export async function scanPortals(tokens?: string[]) {
  const selected = tokens && tokens.length > 0
    ? PORTALS.filter(p => tokens.includes(`${p.ats}:${p.token}`))
    : PORTALS
  const results: { company: string; ats: ATS; found: number; inserted: number }[] = []
  for (const p of selected) {
    const raws = await fetchPortal(p)
    const ins = await upsertPortalJobs(raws)
    results.push({ company: p.company, ats: p.ats, found: raws.length, inserted: ins })
    console.log(`[Portal] ${p.company}: ${raws.length} found, ${ins} upserted`)
  }
  return results
}

// Used by the paste-URL importer (importUrl.ts) to pull a single job's full
// record from whichever ATS its URL points to.
export async function fetchSinglePortalJob(
  ats: ATS,
  token: string,
  id: string,
  companyFallback?: string,
): Promise<RawPortalJob | null> {
  try {
    if (ats === 'greenhouse') {
      const res = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${token}/jobs/${id}?content=true`,
      )
      if (!res.ok) return null
      const j: any = await res.json()
      const desc = stripHtml(j.content || '')
      const loc = j.location?.name || null
      return {
        externalId: `greenhouse-${token}-${j.id}`,
        source: 'greenhouse',
        title: j.title,
        company: companyFallback || token,
        location: loc,
        description: desc,
        applyUrl: j.absolute_url,
        sourceUrl: j.absolute_url,
        isRemote: detectRemote(desc, loc),
        postedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
      }
    }
    if (ats === 'lever') {
      const res = await fetch(`https://api.lever.co/v0/postings/${token}/${id}`)
      if (!res.ok) return null
      const j: any = await res.json()
      const desc = stripHtml((j.descriptionPlain || j.description || '') as string)
      const loc = j.categories?.location || null
      return {
        externalId: `lever-${token}-${j.id}`,
        source: 'lever',
        title: j.text,
        company: companyFallback || token,
        location: loc,
        description: desc,
        applyUrl: j.applyUrl || j.hostedUrl,
        sourceUrl: j.hostedUrl,
        isRemote: detectRemote(desc, loc),
        postedAt: j.createdAt ? new Date(j.createdAt) : new Date(),
      }
    }
    if (ats === 'ashby') {
      const res = await fetch(
        `https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=true`,
      )
      if (!res.ok) return null
      const data: any = await res.json()
      const j = (data.jobs || []).find((x: any) => x.id === id)
      if (!j) return null
      const desc = stripHtml(j.descriptionHtml || j.description || '')
      const loc = j.location || j.locationName || null
      return {
        externalId: `ashby-${token}-${j.id}`,
        source: 'ashby',
        title: j.title,
        company: companyFallback || token,
        location: loc,
        description: desc,
        applyUrl: j.applyUrl || j.jobUrl,
        sourceUrl: j.jobUrl || j.applyUrl,
        isRemote: !!j.isRemote || detectRemote(desc, loc),
        postedAt: j.publishedAt ? new Date(j.publishedAt) : new Date(),
      }
    }
    return null
  } catch (err) {
    console.error(`[Portal] fetchSingle ${ats}:${token}/${id}`, err)
    return null
  }
}

export async function upsertImportedJob(raw: RawPortalJob) {
  return prisma.job.upsert({
    where: { externalId: raw.externalId },
    update: {
      title: raw.title,
      company: raw.company,
      location: raw.location,
      description: raw.description,
      applyUrl: raw.applyUrl,
      sourceUrl: raw.sourceUrl,
      isRemote: raw.isRemote,
    },
    create: {
      externalId: raw.externalId,
      title: raw.title,
      company: raw.company,
      location: raw.location,
      description: raw.description,
      applyUrl: raw.applyUrl,
      sourceUrl: raw.sourceUrl,
      isRemote: raw.isRemote,
      postedAt: raw.postedAt,
      source: raw.source,
      autoApplyStatus: 'ELIGIBLE',
    },
  })
}
