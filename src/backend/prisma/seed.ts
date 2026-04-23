import { PrismaClient, SkillCategory, ApplicationStage, Priority, SkillLevel } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const skills = [
  // Languages
  { name: 'JavaScript', category: SkillCategory.LANGUAGE },
  { name: 'TypeScript', category: SkillCategory.LANGUAGE },
  { name: 'Python', category: SkillCategory.LANGUAGE },
  { name: 'Go', category: SkillCategory.LANGUAGE },
  { name: 'Rust', category: SkillCategory.LANGUAGE },
  { name: 'Java', category: SkillCategory.LANGUAGE },
  { name: 'C#', category: SkillCategory.LANGUAGE },
  { name: 'Ruby', category: SkillCategory.LANGUAGE },
  { name: 'PHP', category: SkillCategory.LANGUAGE },
  { name: 'Swift', category: SkillCategory.LANGUAGE },
  { name: 'Kotlin', category: SkillCategory.LANGUAGE },
  { name: 'Scala', category: SkillCategory.LANGUAGE },
  // Frameworks
  { name: 'React', category: SkillCategory.FRAMEWORK },
  { name: 'Next.js', category: SkillCategory.FRAMEWORK },
  { name: 'Vue.js', category: SkillCategory.FRAMEWORK },
  { name: 'Angular', category: SkillCategory.FRAMEWORK },
  { name: 'Node.js', category: SkillCategory.FRAMEWORK },
  { name: 'Express.js', category: SkillCategory.FRAMEWORK },
  { name: 'Django', category: SkillCategory.FRAMEWORK },
  { name: 'FastAPI', category: SkillCategory.FRAMEWORK },
  { name: 'Flask', category: SkillCategory.FRAMEWORK },
  { name: 'Spring Boot', category: SkillCategory.FRAMEWORK },
  { name: 'NestJS', category: SkillCategory.FRAMEWORK },
  { name: 'Svelte', category: SkillCategory.FRAMEWORK },
  { name: 'Remix', category: SkillCategory.FRAMEWORK },
  { name: 'Laravel', category: SkillCategory.FRAMEWORK },
  // Databases
  { name: 'PostgreSQL', category: SkillCategory.DATABASE },
  { name: 'MySQL', category: SkillCategory.DATABASE },
  { name: 'MongoDB', category: SkillCategory.DATABASE },
  { name: 'Redis', category: SkillCategory.DATABASE },
  { name: 'SQLite', category: SkillCategory.DATABASE },
  { name: 'Elasticsearch', category: SkillCategory.DATABASE },
  { name: 'DynamoDB', category: SkillCategory.DATABASE },
  { name: 'Cassandra', category: SkillCategory.DATABASE },
  // Cloud
  { name: 'AWS', category: SkillCategory.CLOUD },
  { name: 'Google Cloud', category: SkillCategory.CLOUD },
  { name: 'Azure', category: SkillCategory.CLOUD },
  { name: 'Vercel', category: SkillCategory.CLOUD },
  { name: 'Heroku', category: SkillCategory.CLOUD },
  { name: 'Cloudflare', category: SkillCategory.CLOUD },
  // DevOps
  { name: 'Docker', category: SkillCategory.DEVOPS },
  { name: 'Kubernetes', category: SkillCategory.DEVOPS },
  { name: 'CI/CD', category: SkillCategory.DEVOPS },
  { name: 'GitHub Actions', category: SkillCategory.DEVOPS },
  { name: 'Terraform', category: SkillCategory.DEVOPS },
  { name: 'Ansible', category: SkillCategory.DEVOPS },
  { name: 'Jenkins', category: SkillCategory.DEVOPS },
  // Tools
  { name: 'Git', category: SkillCategory.TOOL },
  { name: 'Linux', category: SkillCategory.TOOL },
  { name: 'GraphQL', category: SkillCategory.TOOL },
  { name: 'REST APIs', category: SkillCategory.TOOL },
  { name: 'gRPC', category: SkillCategory.TOOL },
  { name: 'Figma', category: SkillCategory.TOOL },
  { name: 'Jira', category: SkillCategory.TOOL },
  // Soft Skills
  { name: 'System Design', category: SkillCategory.SOFT_SKILL },
  { name: 'Technical Leadership', category: SkillCategory.SOFT_SKILL },
  { name: 'Communication', category: SkillCategory.SOFT_SKILL },
  { name: 'Problem Solving', category: SkillCategory.SOFT_SKILL },
  // Methodology
  { name: 'Agile', category: SkillCategory.METHODOLOGY },
  { name: 'Scrum', category: SkillCategory.METHODOLOGY },
  { name: 'TDD', category: SkillCategory.METHODOLOGY },
]

// Sample job market data
const sampleJobs = [
  {
    title: 'Senior Backend Engineer',
    company: 'Stripe',
    location: 'Remote',
    isRemote: true,
    countryCode: 'US',
    salaryMin: 150000,
    salaryMax: 220000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'Redis', 'System Design'],
  },
  {
    title: 'Senior Backend Engineer',
    company: 'Shopify',
    location: 'Remote',
    isRemote: true,
    countryCode: 'CA',
    salaryMin: 140000,
    salaryMax: 200000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['Ruby', 'Go', 'MySQL', 'Docker', 'Kubernetes', 'Redis', 'GraphQL'],
  },
  {
    title: 'Senior Frontend Engineer',
    company: 'Vercel',
    location: 'Remote',
    isRemote: true,
    countryCode: 'US',
    salaryMin: 160000,
    salaryMax: 230000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'CSS', 'GraphQL'],
  },
  {
    title: 'Senior Frontend Engineer',
    company: 'Figma',
    location: 'San Francisco, CA',
    isRemote: false,
    countryCode: 'US',
    salaryMin: 180000,
    salaryMax: 250000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['React', 'TypeScript', 'WebGL', 'Node.js', 'GraphQL'],
  },
  {
    title: 'Full Stack Engineer',
    company: 'Linear',
    location: 'Remote',
    isRemote: true,
    countryCode: 'US',
    salaryMin: 130000,
    salaryMax: 190000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'Node.js', 'GraphQL', 'Docker'],
  },
  {
    title: 'Full Stack Engineer',
    company: 'Notion',
    location: 'Remote',
    isRemote: true,
    countryCode: 'US',
    salaryMin: 140000,
    salaryMax: 200000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['React', 'TypeScript', 'PostgreSQL', 'Node.js', 'AWS', 'Redis'],
  },
  {
    title: 'DevOps Engineer',
    company: 'HashiCorp',
    location: 'Remote',
    isRemote: true,
    countryCode: 'US',
    salaryMin: 140000,
    salaryMax: 200000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['Kubernetes', 'Terraform', 'Docker', 'AWS', 'Go', 'Linux', 'CI/CD', 'GitHub Actions'],
  },
  {
    title: 'DevOps Engineer',
    company: 'Datadog',
    location: 'New York, NY',
    isRemote: false,
    countryCode: 'US',
    salaryMin: 150000,
    salaryMax: 210000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['Kubernetes', 'Docker', 'Python', 'AWS', 'Ansible', 'CI/CD', 'Terraform'],
  },
  {
    title: 'Backend Engineer',
    company: 'Cloudflare',
    location: 'Remote',
    isRemote: true,
    countryCode: 'US',
    salaryMin: 120000,
    salaryMax: 175000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['Rust', 'Go', 'TypeScript', 'PostgreSQL', 'Docker', 'Linux'],
  },
  {
    title: 'Backend Engineer',
    company: 'Discord',
    location: 'Remote',
    isRemote: true,
    countryCode: 'US',
    salaryMin: 130000,
    salaryMax: 185000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['Python', 'Go', 'PostgreSQL', 'Cassandra', 'Redis', 'Docker', 'Kubernetes'],
  },
  {
    title: 'Frontend Engineer',
    company: 'Loom',
    location: 'Remote',
    isRemote: true,
    countryCode: 'US',
    salaryMin: 110000,
    salaryMax: 160000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'CSS'],
  },
  {
    title: 'Software Engineer',
    company: 'Supabase',
    location: 'Remote',
    isRemote: true,
    countryCode: 'SG',
    salaryMin: 100000,
    salaryMax: 160000,
    currency: 'USD',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    source: 'seed',
    skills: ['TypeScript', 'PostgreSQL', 'Node.js', 'Docker', 'Go', 'React'],
  },
]

async function main() {
  console.log('Seeding database...')

  // Upsert skills
  console.log('Creating skills...')
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    })
  }
  console.log(`Created ${skills.length} skills`)

  // Create demo user
  console.log('Creating demo user...')
  const passwordHash = await bcrypt.hash('demo1234', 12)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@intelicareer.com' },
    update: { emailVerified: true },
    create: {
      email: 'demo@intelicareer.com',
      passwordHash,
      name: 'Alex Developer',
      emailVerified: true,
      profile: {
        create: {
          targetRole: 'Senior Backend Engineer',
          targetLocation: 'Remote',
          yearsExperience: 4,
          isRemotePreferred: true,
        },
      },
    },
  })

  // Add skills to demo user
  const userSkillNames = ['TypeScript', 'Node.js', 'PostgreSQL', 'React', 'Docker', 'Git', 'REST APIs']
  for (const skillName of userSkillNames) {
    const skill = await prisma.skill.findUnique({ where: { name: skillName } })
    if (skill) {
      await prisma.userSkill.upsert({
        where: { userId_skillId: { userId: demoUser.id, skillId: skill.id } },
        update: {},
        create: {
          userId: demoUser.id,
          skillId: skill.id,
          level: SkillLevel.ADVANCED,
          yearsUsed: 3,
        },
      })
    }
  }

  // Create sample applications for demo user
  const applications = [
    {
      jobTitle: 'Senior Backend Engineer',
      company: 'Stripe',
      location: 'Remote',
      isRemote: true,
      jobUrl: 'https://stripe.com/jobs',
      salaryMin: 150000,
      salaryMax: 220000,
      stage: ApplicationStage.INTERVIEWING,
      priority: Priority.DREAM,
      appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      jobTitle: 'Full Stack Engineer',
      company: 'Linear',
      location: 'Remote',
      isRemote: true,
      jobUrl: 'https://linear.app/jobs',
      salaryMin: 130000,
      salaryMax: 190000,
      stage: ApplicationStage.APPLIED,
      priority: Priority.HIGH,
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      jobTitle: 'Backend Engineer',
      company: 'Supabase',
      location: 'Remote',
      isRemote: true,
      jobUrl: 'https://supabase.com/careers',
      salaryMin: 100000,
      salaryMax: 160000,
      stage: ApplicationStage.SCREENING,
      priority: Priority.HIGH,
      appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      jobTitle: 'Software Engineer',
      company: 'Notion',
      location: 'Remote',
      isRemote: true,
      stage: ApplicationStage.BOOKMARKED,
      priority: Priority.MEDIUM,
    },
    {
      jobTitle: 'Node.js Developer',
      company: 'Shopify',
      location: 'Remote',
      isRemote: true,
      stage: ApplicationStage.REJECTED,
      priority: Priority.MEDIUM,
      appliedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      jobTitle: 'Backend Engineer',
      company: 'Discord',
      location: 'Remote',
      isRemote: true,
      stage: ApplicationStage.BOOKMARKED,
      priority: Priority.LOW,
    },
  ]

  for (const app of applications) {
    await prisma.application.create({
      data: { ...app, userId: demoUser.id },
    })
  }

  // Seed market job data
  console.log('Creating market job data...')
  for (const job of sampleJobs) {
    const { skills: jobSkillNames, ...jobData } = job
    const createdJob = await prisma.job.create({ data: jobData })

    for (const skillName of jobSkillNames) {
      const skill = await prisma.skill.findUnique({ where: { name: skillName } })
      if (skill) {
        await prisma.jobSkill.upsert({
          where: { jobId_skillId: { jobId: createdJob.id, skillId: skill.id } },
          update: {},
          create: { jobId: createdJob.id, skillId: skill.id },
        })
      }
    }
  }

  console.log('Seed complete!')
  console.log('Demo login: demo@intelicareer.com / demo1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
