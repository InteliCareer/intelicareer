# Project Milestones
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## Delivery 1 — Foundation

**Timeline:** Weeks 1–2
**Theme:** Conceptual design, documentation, architecture, and environment setup.

### Objectives
- Define the project vision, scope, and business model
- Design the complete system architecture before writing code
- Establish security, AI, and data strategy
- Set up the development environment and repository

### Deliverables
| Document | Location |
|---|---|
| Project Charter | `/documentos/entrega1/gestão de projetos/project_charter.md` |
| Milestones Plan | `/documentos/entrega1/gestão de projetos/milestones.md` |
| Business Plan | `/documentos/entrega1/empreendedorismo/business_plan.md` |
| AI/ML Strategy | `/documentos/entrega1/IA e ML/ai_ml_strategy.md` |
| Big Data Strategy | `/documentos/entrega1/Big Data/big_data_strategy.md` |
| Security Plan | `/documentos/entrega1/Cibersegurança/security_plan.md` |
| Repository structure | `/` |
| Docker Compose for local dev | `/src/` |

### Technical Tasks
- [ ] Create GitHub repository and folder structure
- [ ] Write all Delivery 1 documents
- [ ] Draft OpenAPI specification (REST API contracts)
- [ ] Create `docker-compose.yml` for local development
- [ ] Configure TypeScript, ESLint, Prettier for frontend and backend
- [ ] Set up base Next.js project
- [ ] Set up base Express + Prisma project

### Expected Output
A fully documented project foundation that any developer could pick up and understand. A local development environment that starts with `docker-compose up`.

---

## Delivery 2 — Core Backend

**Timeline:** Weeks 3–6
**Theme:** PostgreSQL database, authentication, REST APIs, data pipeline.

### Objectives
- Implement a production-ready database schema
- Build secure authentication with JWT
- Deliver all core backend CRUD APIs
- Build and run the first version of the job data collection pipeline

### Deliverables
| Artifact | Description |
|---|---|
| Technical Architecture | `/documentos/entrega2/technical_architecture.md` |
| Data Model | `/documentos/entrega2/data_model.md` |
| Prisma schema + migrations | `/src/backend/prisma/schema.prisma` |
| Auth API | `/api/auth/*` endpoints live and tested |
| Users API | `/api/users/me` endpoints |
| Applications API | `/api/applications/*` endpoints |
| Skills API | `/api/users/me/skills` endpoints |
| Market data API | `/api/market/*` endpoints |
| Data pipeline | `/src/data/` collectors, transformers, loaders |
| Seed scripts | 200+ skills, 1,000+ job records |
| API documentation | Postman collection or OpenAPI YAML |

### Technical Tasks
- [ ] Initialize Node.js + Express + TypeScript + Prisma
- [ ] Write Prisma schema (all models)
- [ ] Run initial database migration
- [ ] Implement authentication (register, login, refresh, logout)
- [ ] Implement JWT middleware
- [ ] Implement user profile endpoints
- [ ] Implement applications CRUD + notes + contacts
- [ ] Implement skills endpoints
- [ ] Implement market data endpoints (read from materialized views)
- [ ] Build Adzuna API collector
- [ ] Build Remotive API collector
- [ ] Build NLP skill extractor (spaCy)
- [ ] Build ETL normalizer + deduplicator
- [ ] Build PostgreSQL loader with upsert
- [ ] Create materialized views for analytics
- [ ] Write unit and integration tests
- [ ] Create seed scripts

### Expected Output
A fully functional REST API that can be consumed by a frontend. A pipeline that runs and populates the database with real job market data. All endpoints documented and tested.

---

## Delivery 3 — Dashboard & Analytics

**Timeline:** Weeks 7–10
**Theme:** Next.js frontend, UI components, data visualization.

### Objectives
- Build a fully functional and responsive frontend
- Implement all dashboard pages connected to live APIs
- Deliver the Job Tracker Kanban board
- Deliver Market Trends charts and Skill Gap Analyzer UI

### Deliverables
| Artifact | Description |
|---|---|
| User Stories | `/documentos/entrega3/user_stories.md` |
| Sprint Plan | `/documentos/entrega3/sprint_plan.md` |
| Next.js application | `/src/frontend/` — fully built |
| Login / Register pages | Auth flows working end-to-end |
| Job Tracker page | Kanban board with drag-and-drop |
| Market Trends dashboard | Charts for top skills, trend, volume, salary |
| Skill Gap Analyzer page | Gap visualization with demand percentages |
| Profile / Skills page | Skill management UI |
| Connected to backend | All pages fetch from live APIs |

### Technical Tasks
- [ ] Initialize Next.js 14 with TypeScript + Tailwind + shadcn/ui
- [ ] Configure React Query and Zustand
- [ ] Build auth pages (login, register)
- [ ] Connect NextAuth.js to backend
- [ ] Build dashboard shell + sidebar navigation
- [ ] Build Kanban board (dnd-kit)
- [ ] Build application detail panel
- [ ] Build market trends charts (Recharts)
- [ ] Build skill gap visualization
- [ ] Build skills management UI
- [ ] Build profile completion flow
- [ ] Mobile responsive review pass
- [ ] End-to-end testing (Cypress or Playwright)

### Expected Output
A deployed (or locally runnable) web application where a user can register, add applications, see market trends, and analyze their skill gaps — all powered by live data.

---

## Delivery 4 — Final Product

**Timeline:** Weeks 11–12
**Theme:** AI features, production deployment, final documentation.

### Objectives
- Build and integrate the AI microservice
- Deliver resume parsing and career insights features
- Deploy the complete platform to production
- Complete all documentation

### Deliverables
| Artifact | Description |
|---|---|
| Feature Definitions | `/documentos/entrega4/feature_definitions.md` |
| Roadmap | `/documentos/entrega4/roadmap.md` |
| Risk Analysis | `/documentos/entrega4/risk_analysis.md` |
| Python AI microservice | `/src/analytics/` — FastAPI app |
| Resume Analyzer | Upload, parse, confirm, save to profile |
| Career Insights page | GPT-4 powered personalized recommendations |
| Role suggestion UI | Suggested roles with match scores |
| Job description matcher | Match score feature on resume page |
| Production deployment | Live URL on Railway + Vercel |
| Docker Compose (prod) | Production-ready compose file |
| Final README | Updated with deployment instructions |

### Technical Tasks
- [ ] Initialize FastAPI AI microservice
- [ ] Build resume parser (OpenAI GPT-4 + spaCy)
- [ ] Build skill review UI
- [ ] Build job description matcher
- [ ] Build career insights generator
- [ ] Build role suggestion engine
- [ ] Connect all AI features to Node.js API
- [ ] Performance audit (slow queries, bundle size)
- [ ] Security audit (OWASP checklist)
- [ ] Configure production environment variables
- [ ] Write Docker Compose production config
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Configure custom domain (optional)
- [ ] Final end-to-end smoke testing
- [ ] Update all documentation

### Expected Output
A fully deployed, production-ready platform with AI features. All documentation complete. The platform is accessible via public URL and ready for first users.

---

## Milestone Summary

| Delivery | Weeks | Key Output |
|---|---|---|
| Delivery 1 | 1–2 | Architecture, business plan, dev environment |
| Delivery 2 | 3–6 | Working backend API + data pipeline |
| Delivery 3 | 7–10 | Working frontend connected to live data |
| Delivery 4 | 11–12 | AI features + production deployment |
