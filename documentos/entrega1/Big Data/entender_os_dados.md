# Big Data Strategy
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## 1. Overview

InteliCareer is fundamentally a data product. The market intelligence features depend on collecting, processing, and surfacing large volumes of job posting data continuously. This document defines the Big Data strategy for the platform.

---

## 2. Data Sources

| Source | Type | Method | Data Retrieved |
|---|---|---|---|
| Adzuna API | Job listings | REST API | Title, skills, location, salary, date |
| Remotive.io | Remote jobs | REST API | Role, skills, company, region |
| The Muse API | Tech jobs | REST API | Role, company, location, description |
| LinkedIn (scraping) | Job listings | Ethical scraper (rate-limited) | Title, skills, location |
| GitHub Jobs archive | Historical data | Static dataset | Historical tech job data |
| Stack Overflow Survey | Developer skills | Annual CSV | Self-reported skill and salary data |

---

## 3. Data Volume Estimates

| Metric | Estimate |
|---|---|
| New job postings ingested per day | ~5,000–20,000 |
| Unique skills tracked | ~2,000+ |
| Job posting records at 6 months | ~1.5M rows |
| User-generated data per user/month | ~50–200 records |

This qualifies as "big data" in context: the analytics queries require aggregation across millions of records with real-time performance requirements.

---

## 4. Data Pipeline Architecture

```
External APIs / Web Sources
         |
         v
[Collector Scripts — Python]
 (runs every 6 hours via cron)
         |
         v
[Raw Data Storage — PostgreSQL: raw_jobs table]
         |
         v
[Transform & Normalize — Python ETL]
 - Clean titles
 - Extract skills using NLP
 - Normalize locations
 - Deduplicate postings
         |
         v
[Processed Data — PostgreSQL: jobs, skills, job_skills tables]
         |
         v
[Aggregation Layer — PostgreSQL Materialized Views]
 - skill_demand_by_week
 - top_skills_by_role
 - hiring_volume_by_region
         |
         v
[API Layer — Node.js]
         |
         v
[Frontend Charts & Dashboards]
```

---

## 5. Data Model (Big Data Tables)

### `raw_jobs`
Stores unprocessed scraped/API data.

```sql
CREATE TABLE raw_jobs (
  id UUID PRIMARY KEY,
  source VARCHAR(50),
  external_id VARCHAR(200),
  raw_json JSONB,
  collected_at TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE
);
```

### `jobs` (processed)

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  title VARCHAR(200),
  company VARCHAR(200),
  location VARCHAR(200),
  is_remote BOOLEAN,
  country_code CHAR(2),
  salary_min INTEGER,
  salary_max INTEGER,
  posted_at TIMESTAMP,
  source VARCHAR(50),
  url TEXT
);
```

### `skills`

```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  category VARCHAR(50), -- 'language', 'framework', 'tool', 'soft'
  aliases TEXT[]
);
```

### `job_skills`

```sql
CREATE TABLE job_skills (
  job_id UUID REFERENCES jobs(id),
  skill_id UUID REFERENCES skills(id),
  PRIMARY KEY (job_id, skill_id)
);
```

### Materialized View: `skill_demand_weekly`

```sql
CREATE MATERIALIZED VIEW skill_demand_weekly AS
SELECT
  s.name AS skill,
  s.category,
  DATE_TRUNC('week', j.posted_at) AS week,
  COUNT(DISTINCT js.job_id) AS job_count
FROM job_skills js
JOIN skills s ON s.id = js.skill_id
JOIN jobs j ON j.id = js.job_id
GROUP BY s.name, s.category, DATE_TRUNC('week', j.posted_at);
```

---

## 6. Data Quality Controls

| Control | Implementation |
|---|---|
| Deduplication | Hash of (company + title + location + posted_date) |
| Skill normalization | Canonical skill list + alias mapping (e.g., "JS" → "JavaScript") |
| Location standardization | ISO country codes + city name normalization |
| Freshness checks | Alert if pipeline hasn't run in 12+ hours |
| Schema validation | Pydantic models validate every record before insertion |

---

## 7. Analytics Capabilities

With this data foundation, InteliCareer can surface:

- **Top 10 skills by demand this month** for any role
- **Skill velocity:** fastest growing and declining skills (30-day trend)
- **Geographic heat maps:** which regions are hiring most for a given role
- **Salary ranges** by role, skill set, and location
- **Hiring volume trends** over time (are companies hiring more or less?)

---

## 8. Scaling Plan

| Stage | Storage | Processing |
|---|---|---|
| V1 (MVP) | Single PostgreSQL instance | Python cron scripts on same server |
| V2 | PostgreSQL + read replicas | Separate data worker service |
| V3 | Data warehouse (BigQuery or Redshift) | Apache Airflow DAG orchestration |

---

*Data is the product. Every user interaction and every market signal improves the intelligence layer for all users.*
