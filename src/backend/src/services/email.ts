import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma'

// Configure transporter — uses SMTP env vars or falls back to Ethereal (test)
let transporter: nodemailer.Transporter | null = null

async function getTransporter() {
  if (transporter) return transporter

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    // Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    console.log(`[Email] Using Ethereal test account: ${testAccount.user}`)
    console.log(`[Email] View sent emails at: https://ethereal.email/login`)
  }

  return transporter
}

export async function sendEmail(params: {
  userId: string
  to: string
  subject: string
  html: string
  type: string
}) {
  const transport = await getTransporter()
  const fromAddress = process.env.SMTP_FROM || 'InteliCareer <noreply@intelicareer.com>'

  const info = await transport.sendMail({
    from: fromAddress,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })

  // Log the notification
  await prisma.emailNotification.create({
    data: {
      userId: params.userId,
      type: params.type,
      subject: params.subject,
      body: params.html,
    },
  })

  // For Ethereal, log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info)
  if (previewUrl) {
    console.log(`[Email] Preview: ${previewUrl}`)
  }

  return { messageId: info.messageId, previewUrl }
}

export async function sendNewJobsDigest(userId: string, email: string, jobs: any[]) {
  if (jobs.length === 0) return null

  const jobRows = jobs.map(j => {
    const visa = j.visaSponsorship ? '<span style="color:#10b981;font-weight:bold;">[VISA]</span>' : ''
    const salary = j.salaryMin && j.salaryMax ? `$${j.salaryMin.toLocaleString()}-$${j.salaryMax.toLocaleString()}` : ''
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #334155;">
          <strong>${j.title}</strong> ${visa}<br/>
          <span style="color:#94a3b8;">${j.company} — ${j.location || 'Remote'}</span>
          ${salary ? `<br/><span style="color:#60a5fa;">${salary}</span>` : ''}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #334155;text-align:center;">
          <a href="${j.applyUrl || j.sourceUrl}" style="background:#6366f1;color:white;padding:6px 16px;border-radius:6px;text-decoration:none;font-size:13px;">Apply</a>
        </td>
      </tr>
    `
  }).join('')

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:24px;border-radius:12px;">
      <h2 style="color:#818cf8;margin-top:0;">New Job Matches</h2>
      <p style="color:#94a3b8;">We found <strong>${jobs.length}</strong> new jobs matching your profile:</p>
      <table style="width:100%;border-collapse:collapse;">
        ${jobRows}
      </table>
      <p style="margin-top:20px;color:#64748b;font-size:12px;">
        InteliCareer — Your career intelligence platform
      </p>
    </div>
  `

  return sendEmail({
    userId,
    to: email,
    subject: `${jobs.length} new job matches found`,
    html,
    type: 'new_jobs_digest',
  })
}

export async function sendAutoApplyConfirmation(userId: string, email: string, job: any) {
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:24px;border-radius:12px;">
      <h2 style="color:#10b981;margin-top:0;">Application Submitted!</h2>
      <p>Your application was automatically submitted for:</p>
      <div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0;">
        <strong style="font-size:16px;">${job.title}</strong><br/>
        <span style="color:#94a3b8;">${job.company} — ${job.location || 'Remote'}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;">
        Track your application in the <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auto-apply" style="color:#818cf8;">Auto Apply dashboard</a>.
      </p>
    </div>
  `

  return sendEmail({
    userId,
    to: email,
    subject: `Applied: ${job.title} at ${job.company}`,
    html,
    type: 'auto_apply_confirmation',
  })
}
