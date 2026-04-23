// Paste-URL auto-pipeline: detect which ATS a job URL belongs to, pull the
// canonical record, upsert, and return the stored Job.

import { ATS, PORTALS, fetchSinglePortalJob, upsertImportedJob } from './portals'

interface Parsed {
  ats: ATS
  token: string
  id: string
}

function parseJobUrl(url: string): Parsed | null {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    const path = u.pathname

    // Greenhouse:
    //   boards.greenhouse.io/{token}/jobs/{id}
    //   job-boards.greenhouse.io/{token}/jobs/{id}
    //   {token}.greenhouse.io/jobs/{id}
    if (host.endsWith('greenhouse.io')) {
      const m1 = path.match(/^\/([^/]+)\/jobs\/(\d+)/)
      if (m1) return { ats: 'greenhouse', token: m1[1], id: m1[2] }
      const m2 = path.match(/^\/jobs\/(\d+)/)
      if (m2) {
        const sub = host.split('.')[0]
        if (sub && sub !== 'boards' && sub !== 'job-boards') {
          return { ats: 'greenhouse', token: sub, id: m2[1] }
        }
      }
    }

    // Lever: jobs.lever.co/{company}/{id}
    if (host.endsWith('lever.co')) {
      const m = path.match(/^\/([^/]+)\/([a-f0-9-]+)/i)
      if (m) return { ats: 'lever', token: m[1], id: m[2] }
    }

    // Ashby: jobs.ashbyhq.com/{company}/{id}
    if (host.endsWith('ashbyhq.com')) {
      const m = path.match(/^\/([^/]+)\/([a-f0-9-]+)/i)
      if (m) return { ats: 'ashby', token: m[1], id: m[2] }
    }

    return null
  } catch {
    return null
  }
}

export async function importJobFromUrl(url: string) {
  const parsed = parseJobUrl(url)
  if (!parsed) {
    return { ok: false as const, error: 'Unsupported URL. Supported ATSes: Greenhouse, Lever, Ashby.' }
  }

  const knownPortal = PORTALS.find(
    p => p.ats === parsed.ats && p.token.toLowerCase() === parsed.token.toLowerCase(),
  )
  const companyFallback = knownPortal?.company

  const raw = await fetchSinglePortalJob(parsed.ats, parsed.token, parsed.id, companyFallback)
  if (!raw) {
    return { ok: false as const, error: 'Could not fetch job from the ATS (404 or parse failure).' }
  }

  const job = await upsertImportedJob(raw)
  return { ok: true as const, job }
}
