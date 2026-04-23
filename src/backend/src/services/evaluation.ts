// A–F job evaluation — heuristic scoring of a job against the user's profile.
// Inspired by career-ops' weighted 10-dimension evaluation; we ship a smaller
// four-dimension version that runs synchronously with no LLM dependency.

import { prisma } from '../lib/prisma'

export interface EvaluationBreakdown {
  skills: { score: number; matched: string[]; missing: string[] }
  role:     { score: number; reason: string }
  location: { score: number; reason: string }
  bonuses:  { score: number; reasons: string[] }
}

export interface Evaluation {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number // 0–100
  breakdown: EvaluationBreakdown
  summary: string
}

const WEIGHTS = { skills: 50, role: 20, location: 20, bonuses: 10 }

function scoreToGrade(score: number): Evaluation['grade'] {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function scoreSkills(jobText: string, userSkills: string[]) {
  if (userSkills.length === 0) {
    return { score: 0, matched: [], missing: [] }
  }
  const hay = jobText.toLowerCase()
  const matched: string[] = []
  const missing: string[] = []
  for (const s of userSkills) {
    const needle = s.toLowerCase()
    if (hay.includes(needle)) matched.push(s)
    else missing.push(s)
  }
  // Score = % of user skills mentioned in the job post, weighted mildly so that
  // matching ~60% of skills still produces a good grade (few jobs name them all).
  const pct = matched.length / userSkills.length
  const normalized = Math.min(100, Math.round(pct * 100 * 1.5))
  return { score: normalized, matched, missing }
}

function scoreRole(jobTitle: string, targetRole: string | null | undefined) {
  if (!targetRole) return { score: 60, reason: 'No target role set — neutral score' }
  const t = targetRole.toLowerCase()
  const title = jobTitle.toLowerCase()
  const tokens = t.split(/\s+/).filter(x => x.length > 2)
  const hits = tokens.filter(tok => title.includes(tok)).length
  if (hits === 0) return { score: 20, reason: `Title does not mention "${targetRole}"` }
  const pct = hits / Math.max(tokens.length, 1)
  return {
    score: Math.round(pct * 100),
    reason: `Title matches ${hits}/${tokens.length} of target-role tokens`,
  }
}

function scoreLocation(
  jobLocation: string | null,
  isRemote: boolean,
  target: string | null | undefined,
  remotePreferred: boolean,
) {
  if (isRemote && remotePreferred) {
    return { score: 100, reason: 'Remote role — matches your preference' }
  }
  if (isRemote) return { score: 85, reason: 'Remote role' }
  if (!jobLocation) return { score: 50, reason: 'Location unknown' }
  if (target && jobLocation.toLowerCase().includes(target.toLowerCase())) {
    return { score: 100, reason: `Matches target location "${target}"` }
  }
  if (remotePreferred) {
    return { score: 30, reason: 'On-site role — you prefer remote' }
  }
  return { score: 60, reason: 'On-site role (no remote preference set)' }
}

function scoreBonuses(job: {
  visaSponsorship: boolean
  salaryMin: number | null
  salaryMax: number | null
}) {
  const reasons: string[] = []
  let score = 0
  if (job.visaSponsorship) { score += 50; reasons.push('Offers visa sponsorship') }
  if (job.salaryMin || job.salaryMax) { score += 50; reasons.push('Salary disclosed') }
  if (reasons.length === 0) reasons.push('No bonus signals detected')
  return { score: Math.min(100, score), reasons }
}

export async function evaluateJob(userId: string, jobId: string): Promise<Evaluation> {
  const [user, job] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userSkills: { include: { skill: true } },
      },
    }),
    prisma.job.findUnique({ where: { id: jobId } }),
  ])
  if (!user) throw new Error('User not found')
  if (!job) throw new Error('Job not found')

  const userSkillNames = user.userSkills.map(us => us.skill.name)
  const jobText = `${job.title} ${job.description || ''} ${job.tags || ''}`

  const skills   = scoreSkills(jobText, userSkillNames)
  const role     = scoreRole(job.title, user.profile?.targetRole)
  const location = scoreLocation(
    job.location,
    job.isRemote,
    user.profile?.targetLocation,
    user.profile?.isRemotePreferred ?? false,
  )
  const bonuses  = scoreBonuses({
    visaSponsorship: job.visaSponsorship,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
  })

  const total = Math.round(
    (skills.score   * WEIGHTS.skills   +
     role.score     * WEIGHTS.role     +
     location.score * WEIGHTS.location +
     bonuses.score  * WEIGHTS.bonuses) / 100,
  )

  const grade = scoreToGrade(total)
  const summary = buildSummary(grade, skills, role, location)

  const evalData: Evaluation = {
    grade,
    score: total,
    breakdown: { skills, role, location, bonuses },
    summary,
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      evaluationGrade: grade,
      evaluationScore: total,
      evaluationJson: JSON.stringify(evalData),
      evaluatedAt: new Date(),
    },
  })

  return evalData
}

function buildSummary(
  grade: Evaluation['grade'],
  skills: EvaluationBreakdown['skills'],
  role: EvaluationBreakdown['role'],
  location: EvaluationBreakdown['location'],
): string {
  const head =
    grade === 'A' ? 'Excellent fit.' :
    grade === 'B' ? 'Strong fit.' :
    grade === 'C' ? 'Moderate fit.' :
    grade === 'D' ? 'Weak fit.' :
                    'Poor fit.'
  const parts: string[] = [head]
  if (skills.matched.length > 0) {
    parts.push(`Matches ${skills.matched.length} of your skills (${skills.matched.slice(0, 5).join(', ')}).`)
  }
  if (skills.missing.length > 0 && skills.missing.length <= 5) {
    parts.push(`Gaps: ${skills.missing.join(', ')}.`)
  } else if (skills.missing.length > 5) {
    parts.push(`${skills.missing.length} skill gaps.`)
  }
  parts.push(role.reason + '.')
  parts.push(location.reason + '.')
  return parts.join(' ')
}
