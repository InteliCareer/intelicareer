# Career Intelligence Dashboard

> A data-driven platform that empowers tech professionals to make smarter career decisions through job tracking, skill analysis, and market intelligence.

## Demo

<video src="https://github.com/InteliCareer/intelicareer/raw/main/docs/demo.mp4" controls muted playsinline width="900">
  Your browser doesn't render embedded video here —
  <a href="https://github.com/InteliCareer/intelicareer/raw/main/docs/demo.mp4">download the walkthrough</a>.
</video>

> 90-second walkthrough. Recording produced by `tools/demo` (Playwright). Regenerate any time with `cd tools/demo && npm run demo` while both dev servers are running.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Development Stages](#development-stages)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

---

## About the Project

The **Career Intelligence Dashboard** is a full-stack web platform designed for developers, tech professionals, and remote job seekers. It consolidates job application tracking, skill gap analysis, market trend visualization, and AI-powered career insights into a single CRM-like interface.

Rather than relying on spreadsheets or disconnected tools, users get a centralized, intelligent system that adapts to their career goals and the current job market.

**Target Users:**
- Software developers and engineers
- Tech professionals in data, design, product, and DevOps
- People pursuing remote or international career opportunities

---

## Key Features

| Feature | Description |
|---|---|
| Job Application Tracker | CRM-style pipeline to manage applications from discovery to offer |
| Skill Gap Analyzer | Compare your skills against real market demand |
| Market Trend Dashboard | Visualize hiring trends by role, tech stack, and region |
| Career Insights Engine | Personalized AI-driven recommendations and career path projections |
| Resume Analyzer | Parse resumes and extract skills with AI matching |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (React), Tailwind CSS, Recharts |
| Backend | Node.js with Express (REST API) |
| Database | PostgreSQL with Prisma ORM |
| AI/ML | Python (FastAPI microservice), OpenAI API |
| Auth | NextAuth.js / JWT |
| Deployment | Docker, Railway / Vercel |
| Data Pipeline | Python scripts, cron jobs, external job APIs |

---

## Folder Structure

```
InteliCareer/
│
├── documentos/                  # All project documentation by delivery
│   ├── entrega1/                # Delivery 1: Foundation documents
│   │   ├── Big Data/            # Big Data concepts and strategy
│   │   ├── Cibersegurança/      # Security policies and threat model
│   │   ├── IA e ML/             # AI/ML strategy and tools
│   │   ├── empreendedorismo/    # Business plan and entrepreneurship
│   │   └── gestão de projetos/  # Project management and charter
│   ├── entrega2/                # Delivery 2: Backend architecture docs
│   ├── entrega3/                # Delivery 3: Frontend and analytics docs
│   └── entrega4/                # Delivery 4: Final product and AI docs
│
├── imagens/                     # Diagrams, wireframes, screenshots
│
├── src/                         # Source code
│   ├── backend/                 # Node.js/Express REST API
│   ├── frontend/                # Next.js application
│   ├── data/                    # Data pipeline scripts and collectors
│   └── analytics/               # Python ML/AI microservice
│
├── README.md
└── .gitignore
```

---

## Development Stages

### Delivery 1 — Foundation (Weeks 1–2)
Conceptual planning, documentation, business model, architecture design.
- Project Charter
- Business Plan
- System Architecture Design
- Initial repository setup

### Delivery 2 — Core Backend (Weeks 3–5)
Database schema, REST API implementation, authentication.
- PostgreSQL schema with Prisma
- Authentication system
- Core CRUD APIs for job tracker, users, skills
- Seeding scripts and API documentation

### Delivery 3 — Dashboard & Analytics (Weeks 6–9)
Frontend development, data visualization, market trend charts.
- Next.js application
- Job tracker UI (Kanban board)
- Market trends dashboard with charts
- Skill gap visualization
- Connected to live backend APIs

### Delivery 4 — Final Product (Weeks 10–12)
AI features, resume analysis, insights engine, deployment.
- AI-powered resume parser
- Career recommendations engine
- Full integration and polish
- Docker deployment
- Final documentation

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- PostgreSQL >= 14
- Docker (optional, for containerized setup)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/InteliCareer.git
cd InteliCareer
```

### 2. Set Up the Backend

```bash
cd src/backend
npm install
cp .env.example .env
# Edit .env with your database and API credentials
npx prisma migrate dev
npm run dev
```

### 3. Set Up the Frontend

```bash
cd src/frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### 4. Set Up the Analytics Service (AI/ML)

```bash
cd src/analytics
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 5. Run with Docker (Full Stack)

```bash
docker-compose up --build
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `ANALYTICS_SERVICE_URL` | Python AI microservice URL |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

*Career Intelligence Dashboard — Built for professionals who treat their career as a product.*
