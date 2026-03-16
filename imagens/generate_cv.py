from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

OUTPUT = "/Users/deborahcollicchio/Desktop/InteliCarrer/imagens/alex_developer_cv.pdf"

# ── Colors (Mixpanel-inspired violet palette) ──────────────────────────────
VIOLET  = colors.HexColor("#7c3aed")
DARK    = colors.HexColor("#1e1e2e")
MID     = colors.HexColor("#4b5563")
LIGHT   = colors.HexColor("#9ca3af")
WHITE   = colors.white
BG_TAG  = colors.HexColor("#ede9fe")

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
)

styles = getSampleStyleSheet()

def s(name, **kw):
    base = styles[name]
    return ParagraphStyle(name + str(id(kw)), parent=base, **kw)

NAME      = s("Normal",    fontSize=26, textColor=DARK,   leading=30, fontName="Helvetica-Bold")
ROLE_H    = s("Normal",    fontSize=12, textColor=VIOLET, leading=16, fontName="Helvetica")
CONTACT   = s("Normal",    fontSize=9,  textColor=MID,    leading=13, fontName="Helvetica")
SEC_TITLE = s("Normal",    fontSize=10, textColor=VIOLET, leading=14, fontName="Helvetica-Bold", spaceAfter=2)
JOB_TITLE = s("Normal",    fontSize=10, textColor=DARK,   leading=14, fontName="Helvetica-Bold")
JOB_CO    = s("Normal",    fontSize=9,  textColor=MID,    leading=13, fontName="Helvetica")
BODY      = s("Normal",    fontSize=9,  textColor=MID,    leading=14, fontName="Helvetica")
BULLET    = s("Normal",    fontSize=9,  textColor=MID,    leading=14, fontName="Helvetica", leftIndent=12)
SKILL_CAT = s("Normal",    fontSize=9,  textColor=VIOLET, leading=13, fontName="Helvetica-Bold")
SKILL_VAL = s("Normal",    fontSize=9,  textColor=MID,    leading=13, fontName="Helvetica")

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb"), spaceAfter=6, spaceBefore=6)

def section(title):
    return [Paragraph(title.upper(), SEC_TITLE), hr()]

def bullet(text):
    return Paragraph(f"• {text}", BULLET)

story = []

# ── Header ─────────────────────────────────────────────────────────────────
story.append(Paragraph("Alex Developer", NAME))
story.append(Spacer(1, 4))
story.append(Paragraph("Senior Backend Engineer", ROLE_H))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "alex.developer@email.com  ·  github.com/alexdev  ·  linkedin.com/in/alexdev  ·  Remote / Worldwide",
    CONTACT
))
story.append(Spacer(1, 10))

# ── Summary ────────────────────────────────────────────────────────────────
story += section("Summary")
story.append(Paragraph(
    "Backend engineer with 4+ years of experience building scalable APIs and distributed systems. "
    "Passionate about developer tooling, data-intensive applications, and remote-first teams. "
    "Strong background in Node.js, TypeScript, and PostgreSQL. Experienced with cloud infrastructure "
    "on AWS and container orchestration with Docker. Open to senior and staff-level remote roles.",
    BODY
))
story.append(Spacer(1, 10))

# ── Experience ─────────────────────────────────────────────────────────────
story += section("Experience")

jobs = [
    {
        "title": "Senior Backend Engineer",
        "company": "Cloudify Labs — Remote",
        "period": "Jan 2023 – Present",
        "bullets": [
            "Designed and shipped a multi-tenant REST API serving 2M+ requests/day using Node.js and TypeScript.",
            "Reduced average query latency by 60% through PostgreSQL indexing and query plan optimisation.",
            "Led migration from monolith to microservices, containerised with Docker and deployed on AWS ECS.",
            "Mentored 3 junior engineers; introduced TDD practices that reduced production bugs by 40%.",
            "Implemented CI/CD pipelines with GitHub Actions; achieved 99.8% deployment success rate.",
        ],
    },
    {
        "title": "Backend Engineer",
        "company": "DataStream Inc — Remote",
        "period": "Mar 2021 – Dec 2022",
        "bullets": [
            "Built a real-time data ingestion pipeline processing 500K events/hour using Node.js and Redis Streams.",
            "Developed GraphQL API consumed by 3 internal frontend teams, reducing over-fetching by 35%.",
            "Managed PostgreSQL schema design and wrote migration scripts for zero-downtime deployments.",
            "Integrated AWS S3 and Lambda for async document processing workflows.",
        ],
    },
    {
        "title": "Junior Backend Developer",
        "company": "TechStart Agency — São Paulo, Brazil",
        "period": "Jun 2019 – Feb 2021",
        "bullets": [
            "Developed RESTful APIs for 5 client projects using Node.js and Express.",
            "Worked with MySQL and MongoDB databases; wrote automated tests with Jest.",
            "Deployed applications to Heroku and later migrated to AWS EC2.",
        ],
    },
]

for job in jobs:
    story.append(Paragraph(job["title"], JOB_TITLE))
    story.append(Paragraph(f"{job['company']}  ·  {job['period']}", JOB_CO))
    story.append(Spacer(1, 3))
    for b in job["bullets"]:
        story.append(bullet(b))
    story.append(Spacer(1, 8))

# ── Skills ─────────────────────────────────────────────────────────────────
story += section("Skills")

skill_rows = [
    ("Languages",    "TypeScript · JavaScript · Python · Go (learning)"),
    ("Frameworks",   "Node.js · Express.js · NestJS · FastAPI"),
    ("Databases",    "PostgreSQL · Redis · MongoDB · MySQL"),
    ("Cloud & DevOps","AWS (EC2, S3, Lambda, ECS) · Docker · GitHub Actions · CI/CD"),
    ("Tools",        "Git · Linux · REST APIs · GraphQL · Prisma ORM"),
    ("Methodology",  "Agile · Scrum · TDD · System Design · Code Review"),
]

for cat, val in skill_rows:
    row_table = Table(
        [[Paragraph(cat, SKILL_CAT), Paragraph(val, SKILL_VAL)]],
        colWidths=[4.5*cm, None],
    )
    row_table.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))
    story.append(row_table)

story.append(Spacer(1, 10))

# ── Education ──────────────────────────────────────────────────────────────
story += section("Education")
story.append(Paragraph("B.Sc. Computer Science", JOB_TITLE))
story.append(Paragraph("University of São Paulo — 2015 – 2019", JOB_CO))
story.append(Spacer(1, 10))

# ── Projects ───────────────────────────────────────────────────────────────
story += section("Projects")

projects = [
    ("InteliCareer (this platform)",
     "Full-stack career intelligence dashboard built with Next.js, Node.js, and PostgreSQL. "
     "Features job application tracking, skill gap analysis, and market trend visualisation."),
    ("OpenQueue",
     "Open-source job queue library for Node.js backed by Redis. 800+ GitHub stars. "
     "Supports delayed jobs, retry logic, and priority queues."),
    ("PgWatch",
     "PostgreSQL slow query monitor with Slack alerts. Built with Go and deployed as a single binary."),
]

for name, desc in projects:
    story.append(Paragraph(name, JOB_TITLE))
    story.append(Paragraph(desc, BODY))
    story.append(Spacer(1, 6))

# ── Languages & Misc ───────────────────────────────────────────────────────
story += section("Languages & Availability")
story.append(Paragraph("English (Fluent) · Portuguese (Native) · Spanish (Basic)", BODY))
story.append(Spacer(1, 4))
story.append(Paragraph("Available for remote full-time roles. Open to US, EU, and international teams.", BODY))

# ── Build ──────────────────────────────────────────────────────────────────
doc.build(story)
print(f"PDF created: {OUTPUT}")
