# Sprint Plan
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026
**Methodology:** Agile Scrum (2-week sprints)
**Total Duration:** 12 weeks (6 sprints)

---

## Sprint Overview

| Sprint | Duration | Focus | Delivery |
|---|---|---|---|
| Sprint 1 | Weeks 1–2 | Foundation, planning, architecture | Delivery 1 |
| Sprint 2 | Weeks 3–4 | Database, auth, core API | Delivery 2 |
| Sprint 3 | Weeks 5–6 | Applications API + data pipeline | Delivery 2 |
| Sprint 4 | Weeks 7–8 | Frontend setup + Tracker UI | Delivery 3 |
| Sprint 5 | Weeks 9–10 | Market dashboard + Skill Gap UI | Delivery 3 |
| Sprint 6 | Weeks 11–12 | AI features + final polish | Delivery 4 |

---

## Sprint 1 — Foundation (Weeks 1–2)

**Goal:** Complete conceptual design, documentation, and development environment setup.

### Deliverables
- Project Charter
- Business Plan
- Technical Architecture document
- Data Model document
- Security Plan
- AI/ML Strategy
- Repository created with initial structure
- Docker Compose for local dev environment

### Tasks

| Task | Story | Priority |
|---|---|---|
| Write Project Charter | — | Critical |
| Write Business Plan | — | Critical |
| Design system architecture | — | Critical |
| Design PostgreSQL data model | — | Critical |
| Define REST API contracts (OpenAPI spec) | — | High |
| Set up GitHub repository and folder structure | — | Critical |
| Configure Docker Compose (PostgreSQL + Node + Next) | — | High |
| Set up ESLint, Prettier, TypeScript config | — | Medium |

### Definition of Done
- All documents reviewed and filed in `/documentos/entrega1`
- `docker-compose up` starts the development environment without errors
- Repository structure matches specification

---

## Sprint 2 — Core Backend (Weeks 3–4)

**Goal:** Implement database schema, authentication system, and user/profile APIs.

### Deliverables
- Prisma schema with all core models
- Migration files
- Auth endpoints (register, login, refresh, logout)
- User profile endpoints
- Seeding script with test data
- Postman/Insomnia collection for API testing

### Tasks

| Task | Story | Priority |
|---|---|---|
| Initialize Node.js + Express + TypeScript backend | — | Critical |
| Create Prisma schema (User, UserProfile, UserSkill, Skill) | US-001 | Critical |
| Run initial migration | — | Critical |
| Implement `POST /api/auth/register` | US-001 | Critical |
| Implement `POST /api/auth/login` with JWT | US-002 | Critical |
| Implement refresh token flow | US-002 | High |
| Implement auth middleware (protect routes) | — | Critical |
| Implement `GET/PUT /api/users/me` | US-003 | High |
| Implement skill management endpoints | US-009 | High |
| Write seed script (skills taxonomy, test users) | — | Medium |
| Write unit tests for auth service | — | High |

### Definition of Done
- Auth flow tested end-to-end via API client
- JWT validation blocks unauthorized requests
- Skills seeded with 200+ canonical entries

---

## Sprint 3 — Applications API & Data Pipeline (Weeks 5–6)

**Goal:** Build job application CRUD API and implement the first version of the data collection pipeline.

### Deliverables
- Full Applications REST API
- Application notes and contacts endpoints
- Python data collector (Adzuna + Remotive)
- ETL transformer (skill extraction from job text)
- DB loader and cron scheduler
- 1,000+ job records seeded in database

### Tasks

| Task | Story | Priority |
|---|---|---|
| Create Application, ApplicationNote, ApplicationContact schema | US-004 | Critical |
| Implement CRUD for `/api/applications` | US-004/US-007 | Critical |
| Implement stage change endpoint | US-006 | High |
| Implement `POST /api/applications/:id/notes` | US-007 | High |
| Implement `POST /api/applications/:id/contacts` | US-008 | Medium |
| Build Adzuna API collector | — | High |
| Build Remotive API collector | — | High |
| Build NLP skill extractor (spaCy) | — | High |
| Build normalizer and deduplicator | — | High |
| Build DB loader with upsert logic | — | High |
| Set up scheduler (cron) | — | Medium |
| Create materialized views for market analytics | — | High |
| Test pipeline end-to-end | — | High |
| Write integration tests for applications API | — | Medium |

### Definition of Done
- Applications API passes all integration tests
- Pipeline runs and populates jobs + job_skills tables
- Materialized views return correct aggregated data

---

## Sprint 4 — Frontend Setup & Job Tracker UI (Weeks 7–8)

**Goal:** Build the Next.js application structure, authentication UI, and the job application tracker.

### Deliverables
- Next.js 14 project initialized with full tooling
- Login and registration pages
- Dashboard layout with sidebar navigation
- Job Application Tracker (Kanban board)
- Application detail view with notes

### Tasks

| Task | Story | Priority |
|---|---|---|
| Initialize Next.js with TypeScript + Tailwind + shadcn/ui | — | Critical |
| Configure React Query and Zustand | — | Critical |
| Build API client (axios wrapper) | — | Critical |
| Build Login page + form validation | US-002 | Critical |
| Build Register page + form validation | US-001 | Critical |
| Connect auth to NextAuth.js + backend | US-001/002 | Critical |
| Build dashboard shell layout + sidebar | — | High |
| Build Kanban board component | US-005 | Critical |
| Implement drag-and-drop (dnd-kit) | US-006 | High |
| Build application card component | US-005 | High |
| Build add application modal/form | US-004 | High |
| Build application detail panel | US-007/008 | Medium |
| Connect all tracker components to API | — | Critical |

### Definition of Done
- User can register, log in, and land on dashboard
- User can add applications and drag them between pipeline stages
- All tracker data persists to PostgreSQL via API

---

## Sprint 5 — Market Dashboard & Skill Gap UI (Weeks 9–10)

**Goal:** Build the market trends dashboard and skill gap analyzer frontend.

### Deliverables
- Market Trends Dashboard with charts
- Top skills bar chart (by role)
- Skill trend over time line chart
- Hiring volume chart
- Skill management UI (add/remove skills)
- Skill Gap Analyzer UI

### Tasks

| Task | Story | Priority |
|---|---|---|
| Build market trends page layout | US-011 | High |
| Build TopSkillsChart component (Recharts BarChart) | US-011 | High |
| Build SkillTrendChart component (Recharts LineChart) | US-012 | High |
| Build HiringVolumeChart component | US-013 | Medium |
| Connect market charts to `/api/market/*` endpoints | — | Critical |
| Build Add Skills page/modal | US-009 | High |
| Build Skill Gap Analyzer page | US-010 | High |
| Build SkillGapCard component (missing skill with demand %) | US-010 | High |
| Add learning resource links to gap items | US-010 | Low |
| Build profile completion prompt (for users with no skills) | US-003 | Medium |
| Mobile responsive layout review | — | Medium |

### Definition of Done
- Market trends page shows real data from pipeline
- Skill gap analyzer shows accurate gaps for user's profile and target role
- Charts are interactive and responsive

---

## Sprint 6 — AI Features, Insights, & Final Polish (Weeks 11–12)

**Goal:** Build the AI microservice, resume analyzer, career insights engine, and finalize the platform for deployment.

### Deliverables
- Python FastAPI AI microservice
- Resume upload and parsing feature
- Career Insights page
- Job description match score feature
- Docker Compose production configuration
- Deployment to Railway + Vercel
- Final documentation update

### Tasks

| Task | Story | Priority |
|---|---|---|
| Initialize FastAPI AI microservice | — | Critical |
| Build resume parser (OpenAI GPT-4 extraction) | US-016 | High |
| Build skill review UI (extracted skills confirmation) | US-017 | High |
| Build job description match scorer | US-018 | Medium |
| Connect resume upload to Node.js → AI service | US-016 | High |
| Build Career Insights page | US-014 | High |
| Build career insights generator (GPT-4 + context) | US-014 | High |
| Build role suggestion component | US-015 | Medium |
| Performance audit and query optimization | — | High |
| Security audit (OWASP checklist) | — | High |
| Write final README and deployment guide | — | High |
| Configure production Docker Compose | — | High |
| Deploy to Railway (backend + AI) | — | Critical |
| Deploy to Vercel (frontend) | — | Critical |
| Final end-to-end testing | — | Critical |

### Definition of Done
- Resume upload → skill extraction → profile update works end-to-end
- Career Insights page generates personalized recommendations
- Platform is deployed and accessible at production URL
- All documentation is up to date

---

## Sprint Ceremonies

| Ceremony | Frequency | Duration |
|---|---|---|
| Sprint Planning | Start of each sprint | 1 hour |
| Daily Standup | Daily | 15 minutes |
| Sprint Review | End of each sprint | 30 minutes |
| Sprint Retrospective | End of each sprint | 30 minutes |

---

*This sprint plan is designed for a solo developer or small team, with realistic scope per sprint and clear exit criteria for each delivery milestone.*
