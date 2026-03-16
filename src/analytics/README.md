# Analytics Service — Python + FastAPI

## Stack
- **Language:** Python 3.11
- **Framework:** FastAPI
- **NLP:** spaCy
- **AI:** OpenAI Python SDK (GPT-4)
- **Data:** Pandas, Psycopg2
- **Validation:** Pydantic v2
- **Server:** Uvicorn

## Structure

```
src/analytics/
├── main.py                  # FastAPI app entry point
├── routers/
│   ├── resume.py            # POST /parse-resume
│   ├── skill_gap.py         # POST /skill-gap
│   └── insights.py          # POST /career-insights
├── services/
│   ├── resume_parser.py     # NLP extraction + OpenAI calls
│   ├── skill_analyzer.py    # Gap computation logic
│   └── llm_client.py        # OpenAI API wrapper with retry
├── models/
│   ├── resume.py            # Pydantic models for resume requests
│   ├── skill_gap.py         # Pydantic models for gap analysis
│   └── insights.py          # Pydantic models for insights
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Setup

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
# Add OPENAI_API_KEY and DATABASE_URL
uvicorn main:app --reload --port 8001
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/parse-resume` | Extract skills and experience from resume text |
| POST | `/skill-gap` | Compute gap between user skills and role demand |
| POST | `/career-insights` | Generate AI career recommendations |
| GET | `/health` | Health check |

## Environment Variables

```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:password@localhost:5432/intelicareer
MODEL=gpt-4o
MAX_TOKENS=2000
```
