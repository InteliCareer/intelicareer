# Project Charter
## Career Intelligence Dashboard

**Document Version:** 1.0
**Date:** March 2026
**Status:** Approved

---

## 1. Project Name

**Career Intelligence Dashboard** (InteliCareer)

---

## 2. Vision

To become the leading intelligent platform that transforms how tech professionals navigate their careers — turning raw job market data into personalized, actionable career strategies.

---

## 3. Mission

To empower developers, engineers, and tech professionals with a centralized, data-driven workspace where they can track job opportunities, understand their market value, identify skill gaps, and receive AI-powered guidance — removing the guesswork from career growth.

---

## 4. Objectives

| # | Objective | Priority |
|---|---|---|
| 1 | Build a CRM-style job application tracker with pipeline stages | High |
| 2 | Develop a skill gap analyzer that compares user skills against market demand | High |
| 3 | Create market trend visualizations for roles, technologies, and regions | High |
| 4 | Integrate an AI engine for personalized career recommendations | Medium |
| 5 | Build a resume parser that extracts and evaluates skills | Medium |
| 6 | Support remote and international job market data | Medium |
| 7 | Launch a scalable SaaS model with free and premium tiers | Low (future) |

---

## 5. Stakeholders

| Stakeholder | Role | Interest |
|---|---|---|
| Project Owner / Developer | Architect, lead developer | Full platform delivery |
| End Users (Developers) | Primary users | Career tracking and insights |
| End Users (Tech Professionals) | Primary users | Skill and market analysis |
| Remote Job Seekers | Target audience | International market visibility |
| Academic Supervisors | Evaluators (if academic context) | Documentation and delivery quality |
| Potential Investors | Future stakeholders | Scalability and revenue model |

---

## 6. Scope

### In Scope

- User registration and authentication
- Job application tracker with Kanban board and pipeline stages
- Skill input and management per user profile
- Skill gap analysis based on aggregated job market data
- Market trend dashboard (charts by role, technology, region)
- Career insights and recommendation engine (AI-assisted)
- Resume upload, parsing, and skill extraction
- RESTful API backend
- Responsive web frontend (desktop-first)
- Data collection pipeline from public job sources

### Out of Scope (V1)

- Native mobile application
- Direct integration with LinkedIn or other professional networks (pending API access)
- Real-time job application via the platform
- Employer-facing features or job posting tools
- Full offline support

---

## 7. Success Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| User Registrations | 500+ users within 3 months of launch | Database user count |
| Job Applications Tracked | Avg. 10+ per active user | Application records |
| Feature Adoption | 70% of users use Skill Gap Analyzer | Event tracking / analytics |
| AI Insights Engagement | 60% of users open Career Insights section | Page views / session data |
| System Uptime | 99.5% availability | Monitoring tools (UptimeRobot) |
| API Response Time | < 300ms average | Backend performance logs |
| Resume Parsing Accuracy | > 85% correct skill extraction | Manual audit / feedback |
| User Retention | 40% return users in 30 days | Cohort analysis |

---

## 8. Constraints

- Budget: Limited (open-source tools and free-tier cloud services preferred)
- Timeline: 12 weeks from kickoff to final delivery
- Team: Solo developer or small team
- Data: Job data sourced only from publicly available APIs and scrapers (ethical use)

---

## 9. Assumptions

- Users have basic familiarity with web applications
- PostgreSQL will be hosted on a managed service (Railway or Supabase)
- AI features depend on OpenAI API availability and quota
- Market data will be collected via public APIs (Adzuna, Remotive, etc.)

---

## 10. Risks Summary

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| API rate limits on job data sources | Medium | High | Cache responses, use multiple sources |
| OpenAI API costs exceed budget | Low | Medium | Limit AI calls, add usage caps |
| Scope creep | High | Medium | Strict milestone adherence |
| Data quality issues | Medium | High | Validation layer in data pipeline |

---

*This document is the authoritative reference for the project's intent, boundaries, and expectations.*
