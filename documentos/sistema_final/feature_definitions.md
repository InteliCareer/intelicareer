# Feature Definitions
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## Feature 1 — Job Application Tracker

### Overview

A CRM-style pipeline to manage the entire job search process from discovery to final decision. Users track every application through defined stages, add notes and contacts, and maintain a clear picture of where each opportunity stands.

### Pipeline Stages

```
BOOKMARKED → APPLIED → SCREENING → INTERVIEWING → OFFER → ACCEPTED
                                                         → REJECTED
                                                         → WITHDRAWN
```

### Core Capabilities

| Capability | Description |
|---|---|
| Kanban board | Visual columns per pipeline stage; drag-and-drop to change status |
| Application card | Displays: company logo, role, date, priority badge, stage indicator |
| Application detail | Full view with notes timeline, contact info, salary, job URL |
| Notes | Timestamped private notes per application (interview prep, impressions) |
| Contacts | Store recruiter/interviewer name, email, LinkedIn URL |
| Filters | Filter by stage, priority, company, remote/onsite, date range |
| Search | Full-text search across company and role name |
| Stats | Total applications, conversion rates by stage, avg time per stage |

### UX Design

- Desktop-first Kanban board with horizontal scroll for mobile
- Quick-add form accessible from anywhere in the app
- One-click stage change via dropdown (alternative to drag-and-drop)
- Color-coded priority: Dream (gold), High (red), Medium (blue), Low (grey)

---

## Feature 2 — Skill Gap Analyzer

### Overview

Compares the user's current skill profile against real job market demand for their target role. Outputs a prioritized list of skills to acquire, with demand data to guide learning investment decisions.

### How It Works

```
1. User adds skills to profile (with proficiency level)
2. User sets target role (e.g., "Senior Backend Engineer")
3. System queries market data:
   - Top 20 skills found in job postings for that role (last 90 days)
   - Demand percentage per skill (% of postings that mention it)
4. Gap computed: skills in top-20 demand but absent from user profile
5. Gaps ranked by demand percentage
6. Each gap item shows: skill name, demand %, category, recommended resources
```

### Key Metrics Shown

| Metric | Description |
|---|---|
| Skill Coverage Score | % of top-20 skills user already has |
| Top Gaps | Missing skills sorted by demand % |
| Strength Areas | Skills user has that are in high demand |
| Redundant Skills | User has skill but market demand is very low |

### Visual Design

- Horizontal bar chart: user skills vs. market demand
- Color coding: Green (have it), Red (missing), Yellow (partially match)
- "Learn" button on each gap item → opens curated resource list

---

## Feature 3 — Market Trend Dashboard

### Overview

An analytics dashboard powered by the data pipeline, showing real-time and historical hiring trends across roles, technologies, and geographies.

### Dashboard Panels

#### Panel 1 — Top Skills by Role
- Bar chart showing the 15 most-demanded skills for a selected role
- Role selector (dropdown with search)
- Period selector: 30 days / 90 days / 6 months

#### Panel 2 — Skill Velocity (Trend Chart)
- Line chart showing week-over-week job mentions for selected skills
- Compare up to 3 skills simultaneously
- Trend indicator: "Rapidly Growing", "Growing", "Stable", "Declining"

#### Panel 3 — Hiring Volume Over Time
- Area chart showing total job postings per week for the selected role
- Useful for understanding seasonality and market health

#### Panel 4 — Geographic Hiring Heat
- Bar chart: top 10 countries/regions hiring for the selected role
- "Remote" is a separate top-level category
- Percentage breakdown for each region

#### Panel 5 — Salary Intelligence
- Range chart (min/median/max) for salaries by role
- Filterable by region and remote status
- Powered by salary fields in job posting data

---

## Feature 4 — Career Insights Engine

### Overview

An AI-powered recommendation engine that synthesizes the user's profile, application history, and market data to generate personalized, actionable career guidance.

### Insight Types

| Insight Type | Description | Powered By |
|---|---|---|
| Next Steps | 3–5 concrete actions to take in the next 30 days | GPT-4 + profile + gap data |
| Priority Skills | Top 3 skills to learn based on gap + career goal | Gap analysis + AI narrative |
| Roles to Consider | Related roles where user has high skill overlap | Market data + skill matching |
| Application Strategy | Feedback on application pipeline and conversion rate | Application analytics |
| Market Timing | Is now a good time to apply? (based on hiring volume) | Trend data |

### Technical Flow

```
User requests insights
  ↓
Backend collects context:
  - User skills + proficiency
  - Target role
  - Application history (last 90 days)
  - Top skill gaps (from analyzer)
  - Recent market trend signal
  ↓
Context sent to AI microservice (FastAPI)
  ↓
Structured prompt built:
  "You are a career coach. User profile: [...].
   Market data: [...]. Generate insights in JSON format."
  ↓
OpenAI GPT-4 response parsed into structured sections
  ↓
Insights displayed in frontend with data citations
```

### Design Principles

- Every insight cites data ("This recommendation is based on 847 job postings for your target role")
- User can regenerate insights (cooldown: 1 per day on free tier)
- Insights are editable — user can flag incorrect recommendations
- No hallucination-prone claims — LLM is given factual context only

---

## Feature 5 — Resume Analyzer

### Overview

Allows users to upload their resume and receive automatic skill extraction, profile population, and optional job description matching.

### Sub-Features

#### 5.1 — Resume Upload & Parsing
- Upload PDF or .docx
- AI extracts: skills, job titles, companies, years of experience, education
- Extracted skills matched against platform's canonical skill taxonomy
- User reviews and confirms before saving to profile

#### 5.2 — Skill Profile Synchronization
- Confirmed skills added to user's skill profile
- Proficiency levels inferred from years of experience per technology
- Duplicates handled gracefully (update existing rather than add)

#### 5.3 — Job Description Matcher
- User pastes a job description (or provides URL)
- System extracts required skills from JD
- Compares against user's resume skills
- Output: match score (0–100%), matched skills, missing skills, suggestions

### Example Output

```json
{
  "matchScore": 74,
  "matchedSkills": ["Node.js", "PostgreSQL", "Docker", "TypeScript"],
  "missingSkills": ["Kubernetes", "Redis", "System Design"],
  "suggestions": [
    "Add quantified achievements to your Node.js experience",
    "Mention your PostgreSQL optimization work explicitly",
    "Kubernetes appears in 58% of similar job postings — consider adding it"
  ]
}
```

---

*Each feature is independently deliverable and follows a clear data flow from user input through backend API to AI service and back to the UI.*
