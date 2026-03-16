# AI & Machine Learning Strategy
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## 1. Overview

AI and ML are core differentiators of InteliCareer. Rather than treating AI as a feature, it is embedded into the platform's intelligence layer — powering skill analysis, resume parsing, career recommendations, and trend detection.

---

## 2. AI Use Cases

### 2.1 Resume Parser

**Goal:** Extract structured skill and experience data from unstructured resume text.

**Approach:**
- Use NLP to identify entities: skills, job titles, companies, technologies, certifications
- Map extracted skills to the platform's normalized skill taxonomy
- Score resume completeness and alignment against target job roles

**Tools:** spaCy, HuggingFace Transformers, or OpenAI GPT-4 (extraction via structured prompts)

**Input:** PDF or plain text resume
**Output:** JSON object `{ skills: [...], experience: [...], matchScore: 0.87 }`

---

### 2.2 Skill Gap Analyzer

**Goal:** Identify which skills a user lacks relative to job market demand for their target role.

**Approach:**
1. Collect user's current skills from profile
2. Aggregate skill requirements from job postings for the target role (from data pipeline)
3. Compute frequency scores for each skill across postings
4. Identify gaps: skills present in >30% of postings but absent from user profile
5. Rank gaps by demand and difficulty to learn

**Output:** Prioritized list of missing skills with demand percentages and recommended learning resources.

---

### 2.3 Career Insights Engine

**Goal:** Provide personalized career path recommendations.

**Approach:**
- Collaborative filtering: "Users with your skill profile who transitioned to [Role X] typically added [Skill Y]"
- Rule-based logic: career path trees by role family (e.g., Junior Dev → Mid Dev → Senior Dev → Tech Lead)
- LLM-assisted narrative generation: convert data insights into readable career advice

**Tools:** OpenAI API (GPT-4), Python recommendation logic

---

### 2.4 Market Trend Analysis

**Goal:** Detect and surface emerging skill trends before they peak.

**Approach:**
- Time-series analysis on skill mention frequency in job postings (30-day rolling window)
- Anomaly detection for rapid skill emergence (e.g., a new framework suddenly appearing in 20% of postings)
- Regional comparison: trending skills globally vs. in specific markets

**Tools:** Python (Pandas, Statsmodels), PostgreSQL materialized views

---

## 3. AI Architecture

```
User Request
     |
     v
Next.js Frontend
     |
     v
Node.js API (Express)
     |
     v
Python AI Microservice (FastAPI — port 8001)
     |
     ├── /parse-resume     → spaCy / OpenAI extraction
     ├── /skill-gap        → Aggregation + gap scoring
     ├── /career-insights  → GPT-4 recommendation generation
     └── /trend-analysis   → Time-series skill trend data
```

---

## 4. Data Requirements

| AI Feature | Data Needed | Source |
|---|---|---|
| Resume Parser | Resume text/PDF | User upload |
| Skill Gap Analyzer | Job posting skill lists | Data pipeline (Adzuna, Remotive APIs) |
| Career Insights | Historical career paths, skill transitions | Aggregated platform data + public datasets |
| Trend Analysis | Timestamped job postings with skills | Data pipeline |

---

## 5. Model Selection

| Feature | Approach | Reasoning |
|---|---|---|
| Resume parsing | OpenAI GPT-4 + prompt engineering | High accuracy with minimal training data needed |
| Skill extraction | spaCy NER | Fast, offline, good for structured extraction |
| Gap analysis | Rule-based + statistical | Explainable, deterministic, no hallucination risk |
| Career insights | GPT-4 with structured context | Readable narrative output, flexible |
| Trend detection | Pandas rolling aggregates | Sufficient for V1, upgrade to ML model in V2 |

---

## 6. Responsible AI Principles

- **Transparency:** Users are informed when AI generates content
- **Explainability:** All AI outputs include reasoning ("this skill is missing in 67% of target job postings")
- **Bias mitigation:** Skill demand data is sourced from multiple regions and job boards to reduce geographic bias
- **Privacy:** Resumes are processed ephemerally and not stored without consent
- **User control:** Users can edit AI-extracted skills; AI suggestions are always editable

---

## 7. V1 vs V2 AI Roadmap

| Feature | V1 (MVP) | V2 (Future) |
|---|---|---|
| Resume parsing | GPT-4 prompt-based | Fine-tuned local model |
| Skill gap | Rule-based scoring | ML classifier with feedback loop |
| Career insights | GPT-4 with static prompts | Personalized model with user history |
| Trend detection | Rolling aggregates | ARIMA / Prophet forecasting model |

---

*AI features are designed to augment user judgment, not replace it. Every insight is traceable to data.*
