# Business Plan
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## 1. Problem Statement

Tech professionals face a fragmented and opaque job search process:

- **No central system** to track applications across multiple platforms (LinkedIn, Indeed, Glassdoor, company portals)
- **No visibility into skill gaps** — candidates don't know which technologies they need to learn to become competitive
- **Market data is scattered** — trends about salaries, in-demand roles, and hiring volumes are buried across reports and job boards
- **Resume-to-job alignment is manual** — there are no accessible tools that instantly tell a candidate how well their resume matches a target role
- **Career decisions are made blindly** — without data, professionals rely on intuition or expensive career coaches

The result: prolonged job searches, missed opportunities, and misaligned skill development.

---

## 2. Market Analysis

### Market Size

| Segment | Estimate |
|---|---|
| Global tech workforce | ~70 million professionals |
| Active job seekers (tech) at any time | ~15–20% = ~12–14 million |
| Remote job seekers (global) | ~35% of tech professionals |
| Total Addressable Market (TAM) | $4.2B (career tools + job matching SaaS) |
| Serviceable Available Market (SAM) | $600M (dev-focused career tools) |
| Serviceable Obtainable Market (SOM, Y1) | $1.2M (5,000 paying users × $20/month) |

### Market Trends

- Remote work normalization has expanded the international talent pool, increasing competition and the need for data-driven career strategies
- AI-powered HR tools are growing at 15% CAGR
- Developer tooling and productivity software market is expanding rapidly
- Professionals increasingly treat their career as a personal brand/product

---

## 3. Value Proposition

> **"One platform that tells you where you are, where the market is going, and exactly what you need to do to get the job you want."**

| User Pain | InteliCareer Solution |
|---|---|
| Applications lost in spreadsheets | Visual Kanban pipeline with status tracking |
| Unknown skill gaps | AI-powered skill comparison vs. real job postings |
| Opaque hiring trends | Live dashboards by role, tech, and region |
| Resume misalignment | Resume parser + job match scoring |
| Lack of career direction | Personalized insights and recommended learning paths |

---

## 4. Competitors

| Competitor | What They Do | Weakness |
|---|---|---|
| LinkedIn | Professional networking + job postings | No career analytics or gap analysis |
| Huntr | Job application tracker | No market data or skill analysis |
| Teal HQ | Resume builder + job tracker | Limited insights, no trend data |
| JobScan | Resume/ATS optimization | Single-feature, no holistic career view |
| Glassdoor | Salary and company reviews | No personalization or tracking |
| Levels.fyi | Compensation data (tech) | Narrow scope, no gap analysis |

---

## 5. Differentiation

InteliCareer wins by combining what competitors offer separately:

1. **Integrated system** — track applications AND analyze skills AND see market trends in one place
2. **AI-driven personalization** — recommendations based on your specific profile and goals
3. **Market intelligence layer** — aggregated, real-time data from multiple job sources
4. **Developer-first UX** — designed by and for tech professionals
5. **Remote/international focus** — data segmented by region and remote status

---

## 6. Revenue Possibilities

### Freemium Model

| Tier | Price | Features |
|---|---|---|
| Free | $0/month | Up to 20 tracked applications, basic skill analysis, public market data |
| Pro | $19/month | Unlimited tracking, full AI insights, resume analyzer, advanced trends |
| Teams | $49/month per seat | Shared dashboards, team skill mapping, bulk analytics (for bootcamps, agencies) |

### Additional Revenue Streams (Future)

- **Affiliate partnerships** with online learning platforms (Coursera, Udemy) from skill gap recommendations
- **API access** for HR tech companies and recruiting platforms
- **Career coaching marketplace** — connect users with coaches based on their gap analysis
- **Anonymized aggregate data reports** sold to HR analytics firms

---

## 7. Scalability

### Technical Scalability

- **Stateless backend** — horizontally scalable Node.js API servers
- **Read replicas** in PostgreSQL for analytics queries
- **AI microservice** independently scalable (Python/FastAPI)
- **CDN + edge caching** for frontend and public market data
- **Job data pipeline** runs on cron workers, decoupled from user-facing API

### Business Scalability

- **No marginal cost per user** for core features (SaaS model)
- **Data network effect** — more users → richer aggregate market insights → better recommendations for all
- **Geographic expansion** — add new regional job markets by extending data pipeline sources
- **Vertical expansion** — adapt platform for designers, PMs, data scientists with role-specific skill taxonomies

---

## 8. Go-to-Market Strategy

### Phase 1 — Launch (Months 1–3)
- Publish on Product Hunt and Hacker News
- Target developer communities: Dev.to, Reddit (r/cscareerquestions, r/remotework)
- Free tier to drive adoption

### Phase 2 — Growth (Months 4–9)
- Content marketing: "Which tech skills are trending in 2026?" articles
- Partnerships with coding bootcamps for referral program
- Build in public on social media

### Phase 3 — Monetization (Months 10+)
- Launch Pro tier
- Add affiliate revenue from learning platform integrations
- Enterprise/Teams tier for bootcamps and recruiters

---

*This business plan defines the strategic foundation for InteliCareer's commercial viability and long-term growth.*
