# Data Model
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## 1. Entity Relationship Overview

```
users
  └── has many → applications
  └── has many → user_skills
  └── has one  → user_profiles

applications
  └── belongs to → users
  └── has many   → application_notes
  └── has many   → application_contacts

skills
  └── has many → user_skills (through)
  └── has many → job_skills (through)

jobs (market data)
  └── has many → job_skills (through)
  └── belongs to → data source

skill_demand_weekly (materialized view)
  └── aggregates job_skills + time
```

---

## 2. Core Schema (Prisma Format)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// USER DOMAIN
// ─────────────────────────────────────────

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       UserProfile?
  applications  Application[]
  userSkills    UserSkill[]

  @@map("users")
}

model UserProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  targetRole      String?
  targetLocation  String?
  yearsExperience Int?
  bio             String?
  linkedinUrl     String?
  githubUrl       String?
  resumeUrl       String?

  user            User     @relation(fields: [userId], references: [id])

  @@map("user_profiles")
}

model UserSkill {
  id          String    @id @default(uuid())
  userId      String
  skillId     String
  level       SkillLevel  @default(BEGINNER)
  yearsUsed   Float?
  addedAt     DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])
  skill       Skill     @relation(fields: [skillId], references: [id])

  @@unique([userId, skillId])
  @@map("user_skills")
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

// ─────────────────────────────────────────
// JOB APPLICATION TRACKER DOMAIN
// ─────────────────────────────────────────

model Application {
  id            String            @id @default(uuid())
  userId        String
  jobTitle      String
  company       String
  location      String?
  isRemote      Boolean           @default(false)
  jobUrl        String?
  salaryMin     Int?
  salaryMax     Int?
  currency      String?           @default("USD")
  stage         ApplicationStage  @default(BOOKMARKED)
  priority      Priority          @default(MEDIUM)
  appliedAt     DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  user          User              @relation(fields: [userId], references: [id])
  notes         ApplicationNote[]
  contacts      ApplicationContact[]

  @@map("applications")
}

enum ApplicationStage {
  BOOKMARKED     // Saved for later
  APPLIED        // Application submitted
  SCREENING      // Phone screen or assessment
  INTERVIEWING   // Active interview process
  OFFER          // Received an offer
  ACCEPTED       // Offer accepted
  REJECTED       // Application rejected
  WITHDRAWN      // Candidate withdrew
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  DREAM
}

model ApplicationNote {
  id              String      @id @default(uuid())
  applicationId   String
  content         String
  createdAt       DateTime    @default(now())

  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@map("application_notes")
}

model ApplicationContact {
  id              String      @id @default(uuid())
  applicationId   String
  name            String
  role            String?
  email           String?
  linkedinUrl     String?

  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@map("application_contacts")
}

// ─────────────────────────────────────────
// SKILLS DOMAIN
// ─────────────────────────────────────────

model Skill {
  id          String      @id @default(uuid())
  name        String      @unique
  category    SkillCategory
  aliases     String[]
  description String?

  userSkills  UserSkill[]
  jobSkills   JobSkill[]

  @@map("skills")
}

enum SkillCategory {
  LANGUAGE       // Python, JavaScript, Go
  FRAMEWORK      // React, Django, Spring
  DATABASE       // PostgreSQL, MongoDB
  CLOUD          // AWS, GCP, Azure
  DEVOPS         // Docker, Kubernetes, CI/CD
  TOOL           // Git, Figma, Jira
  SOFT_SKILL     // Communication, Leadership
  METHODOLOGY    // Agile, Scrum
  OTHER
}

// ─────────────────────────────────────────
// MARKET DATA DOMAIN
// ─────────────────────────────────────────

model RawJob {
  id          String    @id @default(uuid())
  source      String
  externalId  String
  rawData     Json
  collectedAt DateTime  @default(now())
  processed   Boolean   @default(false)

  @@unique([source, externalId])
  @@map("raw_jobs")
}

model Job {
  id          String    @id @default(uuid())
  title       String
  company     String
  location    String?
  isRemote    Boolean   @default(false)
  countryCode String?
  salaryMin   Int?
  salaryMax   Int?
  currency    String?
  postedAt    DateTime
  source      String
  sourceUrl   String?
  rawJobId    String?   @unique

  jobSkills   JobSkill[]

  @@map("jobs")
}

model JobSkill {
  jobId       String
  skillId     String

  job         Job       @relation(fields: [jobId], references: [id])
  skill       Skill     @relation(fields: [skillId], references: [id])

  @@id([jobId, skillId])
  @@map("job_skills")
}
```

---

## 3. Materialized Views (Analytics)

```sql
-- Skill demand aggregated by week
CREATE MATERIALIZED VIEW skill_demand_weekly AS
SELECT
  s.id          AS skill_id,
  s.name        AS skill_name,
  s.category    AS skill_category,
  DATE_TRUNC('week', j.posted_at) AS week,
  COUNT(DISTINCT js.job_id)       AS job_count
FROM job_skills js
JOIN skills s ON s.id = js.skill_id
JOIN jobs   j ON j.id = js.job_id
GROUP BY s.id, s.name, s.category, DATE_TRUNC('week', j.posted_at)
WITH DATA;

CREATE UNIQUE INDEX ON skill_demand_weekly (skill_id, week);

-- Refresh weekly via cron
REFRESH MATERIALIZED VIEW CONCURRENTLY skill_demand_weekly;
```

```sql
-- Top skills by role (based on normalized job title)
CREATE MATERIALIZED VIEW top_skills_by_role AS
SELECT
  LOWER(TRIM(j.title)) AS normalized_role,
  s.name               AS skill_name,
  COUNT(*)             AS mention_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY LOWER(TRIM(j.title))), 2) AS demand_pct
FROM job_skills js
JOIN jobs   j ON j.id = js.job_id
JOIN skills s ON s.id = js.skill_id
WHERE j.posted_at > NOW() - INTERVAL '90 days'
GROUP BY LOWER(TRIM(j.title)), s.name
WITH DATA;
```

---

## 4. Indexes

```sql
-- Performance indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_stage ON applications(stage);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX idx_jobs_is_remote ON jobs(is_remote);
CREATE INDEX idx_jobs_country_code ON jobs(country_code);
CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);

-- Full-text search
CREATE INDEX idx_jobs_title_fts ON jobs USING GIN(to_tsvector('english', title));
CREATE INDEX idx_skills_name_fts ON skills USING GIN(to_tsvector('english', name));
```

---

## 5. Data Flow Summary

```
User registers
  → User row + UserProfile row created

User adds skills
  → UserSkill rows linked to canonical Skill rows

User creates application
  → Application row with stage = BOOKMARKED

User uploads resume
  → AI service parses resume
  → Extracted skills matched to Skill table
  → UserSkill rows created/updated

Data pipeline runs (every 6h)
  → RawJob rows inserted
  → ETL transforms → Job + JobSkill rows
  → Materialized views refreshed

User requests skill gap analysis
  → UserSkill rows fetched
  → skill_demand_weekly view queried for target role
  → Gap computed: skills in demand but missing from user profile
```

---

*This data model is designed for correctness, query performance, and extensibility — ready to support analytics at scale without a schema rewrite.*
