# User Stories
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## 1. Epic: User Authentication & Profile

### US-001 — Register Account
**As a** tech professional,
**I want to** create an account with my email and password,
**So that** I can access my personal career dashboard.

**Acceptance Criteria:**
- Email must be unique and validated
- Password must be at least 8 characters with at least one number
- On success, user receives a confirmation and is redirected to onboarding
- Duplicate email shows a clear error message

---

### US-002 — Login
**As a** registered user,
**I want to** log in to my account,
**So that** I can access my saved applications and career data.

**Acceptance Criteria:**
- Successful login issues a JWT and stores refresh token in HttpOnly cookie
- Failed login shows generic error (no email enumeration)
- Redirect to dashboard after login

---

### US-003 — Set Up Career Profile
**As a** new user,
**I want to** set my target role, location, and years of experience,
**So that** the platform can personalize market data and skill analysis for me.

**Acceptance Criteria:**
- Fields: target role, target location, years of experience, remote preference
- All fields optional but prompt displayed to encourage completion
- Profile completion percentage shown in dashboard

---

## 2. Epic: Job Application Tracker

### US-004 — Add Job Application
**As a** job seeker,
**I want to** add a new job application with title, company, and URL,
**So that** I can track it in my pipeline.

**Acceptance Criteria:**
- Required: job title, company name
- Optional: URL, location, remote flag, salary range, notes
- New application defaults to BOOKMARKED stage

---

### US-005 — View Applications as Kanban Board
**As a** job seeker,
**I want to** see all my applications organized by pipeline stage,
**So that** I can quickly understand where each opportunity stands.

**Acceptance Criteria:**
- Columns: Bookmarked, Applied, Screening, Interviewing, Offer, Accepted, Rejected
- Cards show: company, role, date, priority badge
- Drag-and-drop between columns updates the stage

---

### US-006 — Move Application to New Stage
**As a** job seeker,
**I want to** drag or manually move an application to a new pipeline stage,
**So that** my tracker reflects the current status.

**Acceptance Criteria:**
- Stage changes are saved immediately
- Stage change date is recorded
- Visual feedback on successful update

---

### US-007 — Add Notes to Application
**As a** job seeker,
**I want to** add private notes to a job application,
**So that** I can remember interview details, follow-up dates, and impressions.

**Acceptance Criteria:**
- Notes are timestamped
- Multiple notes per application
- Notes are displayed in reverse chronological order

---

### US-008 — Add Recruiter Contact
**As a** job seeker,
**I want to** save the name and contact info of recruiters or interviewers,
**So that** I have all context in one place.

**Acceptance Criteria:**
- Fields: name, role, email, LinkedIn URL
- Multiple contacts per application

---

## 3. Epic: Skill Management

### US-009 — Add My Skills
**As a** user,
**I want to** add skills to my profile with proficiency level,
**So that** the skill gap analyzer can compare them against market demand.

**Acceptance Criteria:**
- User can search and select from canonical skill list
- Proficiency levels: Beginner, Intermediate, Advanced, Expert
- Can add optional years of experience per skill
- Duplicate skill check

---

### US-010 — View Skill Gap Analysis
**As a** user,
**I want to** see which skills I'm missing for my target role,
**So that** I can prioritize what to learn next.

**Acceptance Criteria:**
- Shows top missing skills ranked by demand percentage
- Demand percentage shown (e.g., "Used in 67% of job postings for [role]")
- Each missing skill includes a "Learn" button linking to resources
- Comparison updates when user changes target role

---

## 4. Epic: Market Trend Dashboard

### US-011 — View Top Skills by Role
**As a** user,
**I want to** see the most in-demand skills for a specific role,
**So that** I can understand what the market expects.

**Acceptance Criteria:**
- Role can be selected from dropdown or typed
- Shows top 10–15 skills as bar chart with demand percentage
- Data refreshed from pipeline (no older than 7 days)

---

### US-012 — View Skill Trend Over Time
**As a** user,
**I want to** see how demand for a specific skill has changed over the past 6 months,
**So that** I can identify rising or declining technologies.

**Acceptance Criteria:**
- Line chart showing weekly job postings mentioning the skill
- Can compare up to 3 skills on the same chart
- Trend label: "Growing", "Stable", or "Declining"

---

### US-013 — View Hiring Volume by Region
**As a** user,
**I want to** see where companies are hiring for my target role,
**So that** I can identify geographic opportunities including remote.

**Acceptance Criteria:**
- Bar chart or map showing hiring volume by country/region
- Filterable by role
- "Remote" is treated as a separate region/category

---

## 5. Epic: Career Insights Engine

### US-014 — Get Personalized Career Recommendations
**As a** user,
**I want to** receive AI-generated advice on my next career steps,
**So that** I have a concrete action plan.

**Acceptance Criteria:**
- Insights generated based on: current skills, target role, application history
- Presented as structured list: "Next steps", "Skills to prioritize", "Roles to consider"
- Each recommendation is traceable to data (not generic)
- User can regenerate insights

---

### US-015 — Receive Role Suggestions
**As a** user,
**I want to** see related roles I may be a strong fit for,
**So that** I can discover opportunities I hadn't considered.

**Acceptance Criteria:**
- Suggestions based on current skill overlap with other role requirements
- Shows match percentage per suggested role
- Can navigate to market data for each suggested role

---

## 6. Epic: Resume Analyzer

### US-016 — Upload Resume for Analysis
**As a** user,
**I want to** upload my resume and have skills extracted automatically,
**So that** I don't have to manually add all my skills.

**Acceptance Criteria:**
- Accepts PDF and .docx formats
- Maximum file size: 5MB
- Processing completes within 30 seconds
- Extracted skills shown for user review before saving

---

### US-017 — Review and Confirm Extracted Skills
**As a** user,
**I want to** review the skills extracted from my resume before they are saved,
**So that** I can correct any errors.

**Acceptance Criteria:**
- Extracted skills shown as editable chip list
- User can remove incorrect skills
- User can add skills that were missed
- Confirmation saves all selected skills to profile

---

### US-018 — Match Resume to Job Description
**As a** user,
**I want to** paste a job description and see how well my resume matches it,
**So that** I know my ATS compatibility and gaps.

**Acceptance Criteria:**
- Match score shown as percentage (0–100%)
- Matched skills highlighted in green
- Missing skills listed separately
- Suggestions for resume improvements

---

## 7. Priority Matrix

| Story | Epic | Priority | Complexity | Delivery |
|---|---|---|---|---|
| US-001, US-002 | Auth | Critical | Low | D2 |
| US-003 | Profile | High | Low | D2 |
| US-004 to US-008 | Tracker | Critical | Medium | D3 |
| US-009, US-010 | Skills | High | Medium | D3 |
| US-011 to US-013 | Market | High | High | D3 |
| US-014, US-015 | Insights | Medium | High | D4 |
| US-016 to US-018 | Resume | Medium | High | D4 |

---

*These user stories define the complete V1 feature scope. Each story maps to backend API endpoints and frontend components.*
