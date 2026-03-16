# Technical Architecture
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## 1. Architecture Overview

InteliCareer follows a **three-tier architecture** with an additional AI microservice:

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│          Next.js 14 (React) — Vercel / CDN              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST
┌────────────────────────▼────────────────────────────────┐
│                     API LAYER                            │
│         Node.js + Express — REST API (Port 3001)         │
│         JWT Authentication Middleware                    │
└──────┬─────────────────┬───────────────────┬────────────┘
       │                 │                   │
┌──────▼──────┐  ┌───────▼───────┐  ┌───────▼────────────┐
│  PostgreSQL  │  │  AI Service   │  │  Data Pipeline     │
│  (Primary    │  │  FastAPI      │  │  Python Cron       │
│   Database)  │  │  Port 8001    │  │  Workers           │
└─────────────┘  └───────────────┘  └────────────────────┘
```

---

## 2. Frontend Architecture

### Technology Stack

| Tool | Purpose |
|---|---|
| Next.js 14 | React framework with SSR/SSG |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| Recharts | Data visualization (charts) |
| React Query (TanStack) | Server state management and caching |
| Zustand | Client-side state management |
| NextAuth.js | Authentication (session + OAuth) |
| React Hook Form + Zod | Form handling and validation |
| shadcn/ui | Component library |

### Frontend Structure

```
src/frontend/
├── app/                        # Next.js 14 App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── tracker/page.tsx    # Job Application Tracker
│   │   ├── skills/page.tsx     # Skill Gap Analyzer
│   │   ├── market/page.tsx     # Market Trends Dashboard
│   │   ├── insights/page.tsx   # Career Insights Engine
│   │   └── resume/page.tsx     # Resume Analyzer
│   ├── api/                    # Next.js API routes (auth)
│   └── layout.tsx
├── components/
│   ├── tracker/                # Job tracker components
│   ├── charts/                 # Recharts wrappers
│   ├── skill/                  # Skill components
│   └── ui/                     # shadcn/ui components
├── hooks/                      # Custom React hooks
├── lib/                        # API client, utilities
└── types/                      # TypeScript type definitions
```

### Key Frontend Pages

| Route | Feature | Description |
|---|---|---|
| `/dashboard` | Overview | Summary cards, quick stats |
| `/tracker` | Job Tracker | Kanban board, pipeline view |
| `/skills` | Skill Gap | Current skills vs. market demand |
| `/market` | Market Trends | Charts: hiring volume, skill trends |
| `/insights` | Career Insights | AI-generated recommendations |
| `/resume` | Resume Analyzer | Upload and parse resume |

---

## 3. Backend Architecture

### Technology Stack

| Tool | Purpose |
|---|---|
| Node.js 20 | Runtime |
| Express.js | HTTP framework |
| TypeScript | Type safety |
| Prisma ORM | Database access and migrations |
| JSON Web Tokens (JWT) | Authentication |
| bcrypt | Password hashing |
| Zod | Request validation |
| Winston | Logging |
| Jest + Supertest | Testing |

### Backend Structure

```
src/backend/
├── src/
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── applications.controller.ts
│   │   ├── skills.controller.ts
│   │   ├── market.controller.ts
│   │   └── insights.controller.ts
│   ├── routes/                 # Express route definitions
│   ├── middleware/             # Auth, validation, error handling
│   ├── services/               # Business logic
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/
│   └── utils/                  # Helpers
├── tests/
├── .env.example
└── package.json
```

### REST API Endpoints

#### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
DELETE /api/auth/logout
```

#### User Profile
```
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/me/skills
POST   /api/users/me/skills
DELETE /api/users/me/skills/:id
```

#### Job Applications
```
GET    /api/applications          # List all applications
POST   /api/applications          # Create application
GET    /api/applications/:id      # Get single application
PUT    /api/applications/:id      # Update application
DELETE /api/applications/:id      # Delete application
PATCH  /api/applications/:id/stage  # Move to new pipeline stage
```

#### Market Data
```
GET    /api/market/trends          # Skill trends over time
GET    /api/market/top-skills      # Top skills by role/region
GET    /api/market/hiring-volume   # Hiring volume trends
GET    /api/market/salary-ranges   # Salary data by role/skill
```

#### AI Features
```
POST   /api/insights/skill-gap     # Analyze skill gaps
POST   /api/insights/career-path   # Career path recommendations
POST   /api/resume/analyze         # Analyze uploaded resume
```

---

## 4. Database Architecture

### Technology: PostgreSQL 15

**Why PostgreSQL:**
- Strong support for JSONB (for flexible job posting data)
- Materialized views for pre-computed analytics
- Full-text search for skill and job matching
- Robust, battle-tested at scale

See `/documentos/entrega2/data_model.md` for the full schema.

### ORM: Prisma

- Type-safe queries auto-generated from schema
- Migration system for schema evolution
- Seeding scripts for development data

---

## 5. AI Microservice Architecture

### Technology: Python 3.11 + FastAPI

**Why a separate service:**
- Python has superior ML/NLP library support (spaCy, Transformers)
- Independent scaling
- Isolated dependency management

```
src/analytics/
├── main.py                     # FastAPI app
├── routers/
│   ├── resume.py               # Resume parsing endpoints
│   ├── skill_gap.py            # Gap analysis endpoints
│   └── insights.py             # Career recommendation endpoints
├── services/
│   ├── resume_parser.py        # NLP extraction logic
│   ├── skill_analyzer.py       # Gap scoring logic
│   └── llm_client.py           # OpenAI API wrapper
├── models/                     # Pydantic data models
├── requirements.txt
└── Dockerfile
```

### AI Endpoints

```
POST /parse-resume              # Extract skills from resume
POST /skill-gap                 # Compute skill gaps
POST /career-insights           # Generate career recommendations
GET  /health                    # Health check
```

---

## 6. Data Pipeline

```
src/data/
├── collectors/
│   ├── adzuna_collector.py     # Adzuna API collector
│   ├── remotive_collector.py   # Remotive API collector
│   └── base_collector.py       # Shared collector logic
├── transformers/
│   ├── skill_extractor.py      # NLP skill extraction from job text
│   ├── normalizer.py           # Normalize titles, locations, skills
│   └── deduplicator.py         # Remove duplicate postings
├── loaders/
│   └── db_loader.py            # Load processed data to PostgreSQL
├── pipeline.py                 # Orchestrates full ETL run
├── scheduler.py                # Cron-based scheduler
└── requirements.txt
```

**Schedule:** Runs every 6 hours via cron (or scheduled task in cloud deployment)

---

## 7. Deployment Strategy

### Development

```bash
docker-compose up
# Spins up: PostgreSQL, Node.js API, Next.js, Python AI service
```

### Production

| Service | Platform | Notes |
|---|---|---|
| Frontend (Next.js) | Vercel | Automatic CI/CD from GitHub |
| Backend (Node.js API) | Railway | Containerized, auto-scaling |
| AI Service (Python) | Railway | Separate service container |
| Database (PostgreSQL) | Railway / Supabase | Managed, with daily backups |
| Data Pipeline | Railway Cron | Scheduled job runner |

### CI/CD Pipeline (GitHub Actions)

```
Push to main branch
  → Run tests (Jest + pytest)
  → Run npm audit / pip audit
  → Build Docker images
  → Deploy to Railway/Vercel
  → Run smoke tests
```

---

## 8. Environment Configuration

```
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/intelicareer
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ANALYTICS_SERVICE_URL=http://analytics:8001
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=https://api.intelicareer.com
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://intelicareer.com

# AI Service
OPENAI_API_KEY=...
DATABASE_URL=postgresql://user:pass@host:5432/intelicareer
```

---

*This architecture is designed for rapid V1 delivery with a clear upgrade path to microservices and distributed data processing at scale.*
