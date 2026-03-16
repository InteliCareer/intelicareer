# Product Roadmap
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## Strategic Vision

InteliCareer evolves from a personal career tracker to a full career intelligence platform with community insights, employer integrations, and predictive career modeling.

---

## Roadmap Timeline

### Phase 1 — Foundation (Months 1–3) — MVP

**Theme:** Prove the core value proposition.

| Feature | Description | Priority |
|---|---|---|
| Job Application Tracker | Kanban pipeline with CRUD | Critical |
| Skill Management | Add/edit skills with proficiency levels | Critical |
| Skill Gap Analyzer | Compare skills to market demand | Critical |
| Market Trends Dashboard | Top skills, trend charts, regional data | High |
| User Auth & Profiles | Register, login, profile setup | Critical |
| Basic Resume Parsing | Upload resume, extract skills | High |
| Data Pipeline V1 | Adzuna + Remotive collectors | High |

**Milestone:** Platform deployed. Users can track applications and see skill gaps.

---

### Phase 2 — Intelligence (Months 4–6)

**Theme:** Make the platform genuinely intelligent and personalized.

| Feature | Description | Priority |
|---|---|---|
| Career Insights Engine V1 | GPT-4 powered personalized recommendations | High |
| Role Suggestion Engine | Suggest roles based on skill overlap | High |
| Salary Intelligence | Salary ranges by role, skill, region | High |
| Application Analytics | Win rate, pipeline velocity, rejection patterns | High |
| Resume-to-Job Match Score | ATS compatibility scoring | Medium |
| Email Reminders | Follow-up reminders for applications | Medium |
| Additional Data Sources | Stack Overflow, GitHub Jobs, Greenhouse | Medium |

**Milestone:** AI features active. Users receive actionable, personalized career intelligence.

---

### Phase 3 — Growth (Months 7–9)

**Theme:** Expand user base and introduce monetization.

| Feature | Description | Priority |
|---|---|---|
| Pro Tier Launch | Paywall for advanced features | Critical |
| Learning Resource Integration | Direct links to Udemy/Coursera for skill gaps | High |
| Interview Preparation Hub | Common questions by role, prep notes | Medium |
| Company Research Panel | Glassdoor + Crunchbase integration | Medium |
| Export to PDF | Export tracker and insights as report | Low |
| Affiliate Revenue System | Track learning conversions | Medium |
| Multi-language Support | Spanish, Portuguese, French | Medium |

**Milestone:** First paying users. Affiliate revenue stream active.

---

### Phase 4 — Scale (Months 10–18)

**Theme:** Scale to thousands of users with platform network effects.

| Feature | Description | Priority |
|---|---|---|
| Teams / Cohort Plan | Bootcamps and companies track team skills | High |
| Anonymized Salary Insights | Community-contributed salary data | High |
| Career Path Simulator | "If I learn X, I could reach Y in Z months" | High |
| LinkedIn Integration | Sync profile and connections (if API available) | Medium |
| Mobile App (React Native) | Native iOS/Android application | Medium |
| Predictive Hiring Index | ML model predicting role demand 90 days out | Medium |
| Open API | Expose market data API for third-party developers | Low |

**Milestone:** 10,000+ users. Teams tier generating recurring revenue. Data moat established.

---

## Feature Prioritization Matrix

```
                HIGH VALUE
                    |
     Career Insights|  Job Tracker
     Skill Gap       |  Market Dashboard
                    |
LOW EFFORT ─────────┼──────────── HIGH EFFORT
                    |
     Email Reminders|  LinkedIn Integration
     PDF Export     |  Predictive Hiring Index
                    |
                LOW VALUE
```

**Quadrant Strategy:**
- Top-left (High Value, Low Effort): Build first — Sprint 1–4
- Top-right (High Value, High Effort): Plan carefully — Sprint 5–6 and Phase 2
- Bottom-left (Low Value, Low Effort): Nice-to-have in later phases
- Bottom-right (Low Value, High Effort): Deprioritize or drop

---

## Technical Roadmap

| Period | Infrastructure Evolution |
|---|---|
| Months 1–3 | Monolithic Node.js API + PostgreSQL + Python AI service |
| Months 4–6 | Add Redis for caching; read replicas for analytics queries |
| Months 7–9 | CDN for static assets; horizontal scaling for API |
| Months 10–18 | Migrate analytics to data warehouse (BigQuery); Airflow for pipeline |

---

## Success Milestones

| Milestone | Target Date | Metric |
|---|---|---|
| MVP Deployed | Month 3 | Platform accessible with core features |
| First 100 Users | Month 4 | 100 registered accounts |
| First Paying Users | Month 7 | 10 Pro subscriptions |
| Product-Market Fit Signal | Month 9 | >40% of users return weekly |
| $1,000 MRR | Month 10 | 50+ Pro subscribers |
| 5,000 Users | Month 15 | Total registered users |

---

*The roadmap is reviewed at the end of each phase. Priorities adjust based on user feedback, usage data, and market signals.*
