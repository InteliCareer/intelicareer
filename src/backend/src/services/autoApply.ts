import { prisma } from '../lib/prisma'
import { sendAutoApplyConfirmation } from './email'

// Generate a tailored cover letter based on job + user profile
function generateCoverLetter(job: any, user: any, userSkills: string[]): string {
  const matchingSkills = userSkills.filter(skill => {
    const jobText = `${job.title} ${job.description || ''} ${job.tags || ''}`.toLowerCase()
    return jobText.includes(skill.toLowerCase())
  })

  return `Dear Hiring Team at ${job.company},

I am writing to express my interest in the ${job.title} position${job.location ? ` based in ${job.location}` : ''}.

${user.profile?.bio || `With ${user.profile?.yearsExperience || 'relevant'} years of experience in software development, I bring a strong foundation in modern technologies and a passion for building quality software.`}

My technical skills align well with this role, particularly my experience with ${matchingSkills.length > 0 ? matchingSkills.slice(0, 5).join(', ') : 'backend development and QA automation'}. I have hands-on experience building REST APIs, working with databases, and implementing automated testing pipelines.

${job.visaSponsorship ? 'I noticed this position offers visa sponsorship, which aligns with my interest in relocating to Europe for the right opportunity.' : ''}

I would welcome the opportunity to discuss how my skills and experience could contribute to your team.

Best regards,
${user.name}
${user.email}`
}

export interface AutoApplyResult {
  jobId: string
  status: 'applied' | 'queued' | 'error'
  method: string
  message: string
}

// Queue a job for auto-apply
export async function queueAutoApply(
  userId: string,
  jobId: string,
  options?: { coverLetter?: string }
): Promise<AutoApplyResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userSkills: { include: { skill: true } },
    },
  })
  if (!user) throw new Error('User not found')

  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) throw new Error('Job not found')

  const userSkillNames = user.userSkills.map(us => us.skill.name)
  const coverLetter = options?.coverLetter || generateCoverLetter(job, user, userSkillNames)

  // Check if already applied
  const existing = await prisma.autoApply.findUnique({
    where: { jobId_userId: { jobId, userId } },
  })
  if (existing) {
    return { jobId, status: 'error', method: '', message: 'Already applied to this job' }
  }

  // Determine apply method based on source
  const method = getApplyMethod(job)

  // Create the auto-apply record
  const autoApply = await prisma.autoApply.create({
    data: {
      jobId,
      userId,
      status: 'queued',
      method,
      coverLetter,
    },
  })

  // Process the application
  const result = await processApplication(autoApply.id, job, user, coverLetter, method)

  return result
}

function getApplyMethod(job: any): string {
  if (job.source === 'remotive') return 'redirect'
  if (job.source === 'arbeitnow') return 'redirect'
  if (job.source === 'remoteok') return 'redirect'
  return 'redirect'
}

async function processApplication(
  autoApplyId: string,
  job: any,
  user: any,
  _coverLetter: string,
  method: string
): Promise<AutoApplyResult> {
  try {
    // For redirect-based applications, we mark as "ready" and provide the apply URL
    // The frontend will open the application page with pre-filled data
    if (method === 'redirect') {
      await prisma.autoApply.update({
        where: { id: autoApplyId },
        data: {
          status: 'applied',
          method: 'redirect',
          appliedAt: new Date(),
        },
      })

      // Update job status
      await prisma.job.update({
        where: { id: job.id },
        data: { autoApplyStatus: 'APPLIED' },
      })

      // Also create an Application record in the tracker
      await prisma.application.create({
        data: {
          userId: user.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          isRemote: job.isRemote,
          jobUrl: job.applyUrl || job.sourceUrl,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency,
          stage: 'APPLIED',
          priority: job.visaSponsorship ? 'HIGH' : 'MEDIUM',
          appliedAt: new Date(),
        },
      })

      // Send confirmation email
      try {
        await sendAutoApplyConfirmation(user.id, user.email, job)
      } catch (emailErr) {
        console.error('[AutoApply] Email failed:', emailErr)
      }

      return {
        jobId: job.id,
        status: 'applied',
        method: 'redirect',
        message: `Application tracked. Apply at: ${job.applyUrl || job.sourceUrl}`,
      }
    }

    return {
      jobId: job.id,
      status: 'error',
      method,
      message: 'Unsupported apply method',
    }
  } catch (err: any) {
    await prisma.autoApply.update({
      where: { id: autoApplyId },
      data: { status: 'error', errorMessage: err.message },
    })
    return {
      jobId: job.id,
      status: 'error',
      method,
      message: err.message,
    }
  }
}

// Bulk auto-apply to all eligible jobs
export async function bulkAutoApply(userId: string, jobIds: string[]): Promise<AutoApplyResult[]> {
  const results: AutoApplyResult[] = []
  for (const jobId of jobIds) {
    const result = await queueAutoApply(userId, jobId)
    results.push(result)
  }
  return results
}

// Get auto-apply stats for a user
export async function getAutoApplyStats(userId: string) {
  const total = await prisma.autoApply.count({ where: { userId } })
  const applied = await prisma.autoApply.count({ where: { userId, status: 'applied' } })
  const queued = await prisma.autoApply.count({ where: { userId, status: 'queued' } })
  const errors = await prisma.autoApply.count({ where: { userId, status: 'error' } })
  const saved = await prisma.job.count({ where: { autoApplyStatus: 'SAVED' } })

  const recent = await prisma.autoApply.findMany({
    where: { userId },
    include: { job: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return { total, applied, queued, errors, saved, recent }
}
