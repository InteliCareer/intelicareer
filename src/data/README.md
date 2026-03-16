# Data Pipeline — Python ETL

## Overview

Collects job posting data from external APIs, normalizes and enriches it, and loads it into PostgreSQL for analytics.

**Schedule:** Runs every 6 hours via cron or Railway scheduled jobs.

## Stack
- **Language:** Python 3.11
- **HTTP:** httpx (async) / requests
- **NLP:** spaCy (skill extraction from job descriptions)
- **Database:** Psycopg2 + SQLAlchemy
- **Validation:** Pydantic v2
- **Scheduling:** APScheduler / cron

## Structure

```
src/data/
├── collectors/
│   ├── base_collector.py        # Abstract base class for all collectors
│   ├── adzuna_collector.py      # Adzuna Jobs API
│   └── remotive_collector.py   # Remotive.io API (remote jobs)
├── transformers/
│   ├── skill_extractor.py       # NLP: extract skills from job description text
│   ├── normalizer.py            # Normalize job titles, locations, skill names
│   └── deduplicator.py          # Hash-based deduplication
├── loaders/
│   └── db_loader.py             # Upsert processed jobs into PostgreSQL
├── pipeline.py                  # Orchestrates: collect → transform → load
├── scheduler.py                 # Runs pipeline on schedule
├── requirements.txt
└── .env.example
```

## Running the Pipeline

```bash
# One-time run
python pipeline.py

# Run on schedule (every 6 hours)
python scheduler.py
```

## Data Flow

```
1. Collectors fetch raw job data from APIs
2. Raw JSON stored in raw_jobs table
3. Transformers extract and normalize:
   - Job title standardization
   - Location → ISO country code
   - Skill extraction from description (spaCy NER)
   - Skill name normalization (alias mapping)
   - Duplicate detection
4. Loader upserts into jobs + job_skills tables
5. Materialized views refreshed
```

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/intelicareer
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-key
PIPELINE_BATCH_SIZE=100
LOG_LEVEL=INFO
```
