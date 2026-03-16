# Cybersecurity Plan
## Career Intelligence Dashboard — InteliCareer

**Document Version:** 1.0
**Date:** March 2026

---

## 1. Security Overview

InteliCareer handles personally identifiable information (PII), career data, and resume documents. A security-first approach is required from day one to protect user trust and comply with data protection regulations.

---

## 2. Threat Model

### Assets to Protect

| Asset | Sensitivity | Risk |
|---|---|---|
| User credentials (passwords, tokens) | Critical | Account takeover |
| Resume files | High | Identity theft, data leak |
| Career and application data | High | Privacy violation |
| Job market aggregated data | Medium | Competitive leakage |
| API keys (OpenAI, external APIs) | High | Financial abuse |

### Threat Actors

- **Automated bots** — brute-force login, credential stuffing
- **Malicious users** — trying to access other users' data via IDOR
- **External attackers** — exploiting vulnerable dependencies
- **Insider threats** — accidental data exposure by developers

---

## 3. OWASP Top 10 Mitigation Plan

| OWASP Risk | Mitigation in InteliCareer |
|---|---|
| A01 Broken Access Control | JWT-based auth on all endpoints; row-level scoping in all DB queries |
| A02 Cryptographic Failures | Passwords hashed with bcrypt (cost factor 12); HTTPS enforced everywhere |
| A03 Injection | Parameterized queries via Prisma ORM; no raw SQL with user input |
| A04 Insecure Design | Threat modeling in design phase; principle of least privilege |
| A05 Security Misconfiguration | Environment variables for all secrets; no default credentials |
| A06 Vulnerable Components | `npm audit` and `pip audit` in CI/CD pipeline |
| A07 Auth Failures | Rate limiting on login endpoint; JWT expiry + refresh tokens |
| A08 Data Integrity Failures | Signed JWT tokens; input validation with Zod (frontend) and Joi (backend) |
| A09 Logging Failures | Structured logging with Winston; security events logged separately |
| A10 SSRF | Whitelist allowed external URLs; sanitize user-provided URLs |

---

## 4. Authentication & Authorization

### Authentication Strategy

- **Password-based auth** with bcrypt hashing (cost 12)
- **JWT access tokens** (15-minute expiry)
- **Refresh tokens** (7-day expiry, stored in HttpOnly cookie)
- **Optional OAuth** (Google Sign-In) via NextAuth.js

### Authorization Model

```
Every API endpoint enforces:
1. Token validation (is the JWT valid?)
2. User ownership check (does this user own this resource?)
3. Role check (is the user's tier allowed this feature?)
```

Example middleware:
```javascript
// Ensure user can only access their own applications
if (application.userId !== req.user.id) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

## 5. Data Privacy

### PII Data Handling

| Data Type | Storage | Retention |
|---|---|---|
| Email address | Encrypted at rest | Until account deletion |
| Password hash | bcrypt hash only | Until account deletion |
| Resume file | Encrypted in object storage | Deleted on request |
| Application data | Encrypted at rest | Until user deletes |
| Usage analytics | Anonymized | 90 days rolling |

### Resume Security

- Resumes processed in memory, not persisted unless user opts in
- If stored: encrypted with AES-256 in object storage (S3 or equivalent)
- Access via pre-signed time-limited URLs only
- GDPR/data deletion: full wipe available via account settings

---

## 6. API Security

### Rate Limiting

```
POST /auth/login       → 5 requests/minute per IP
POST /auth/register    → 10 requests/hour per IP
GET  /api/*            → 100 requests/minute per authenticated user
POST /api/ai/*         → 10 requests/minute per user (AI endpoints)
```

### Input Validation

- All request bodies validated with schema (Joi/Zod)
- File uploads: MIME type check, size limit (5MB for resumes), virus scan hook
- SQL: Prisma ORM with parameterized queries — no raw input interpolation

### CORS Policy

```javascript
cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})
```

---

## 7. Infrastructure Security

| Layer | Control |
|---|---|
| HTTPS | TLS 1.3 enforced, HTTP redirects to HTTPS |
| Secrets management | All secrets in environment variables, never in code |
| Database | Not publicly exposed; accessible only from backend service |
| Docker | Non-root container user; minimal base images (alpine) |
| Dependencies | Weekly automated security scanning via GitHub Dependabot |
| CI/CD | Secrets never logged; deploy keys rotated quarterly |

---

## 8. Incident Response Plan

### Severity Levels

| Level | Example | Response Time |
|---|---|---|
| Critical | User data breach | 1 hour — notify affected users, rotate all keys |
| High | API key exposure | 4 hours — revoke key, audit logs |
| Medium | Brute-force attempt | 24 hours — review rate limits, block IP |
| Low | Failed login spike | 72 hours — monitor, adjust thresholds |

### Response Steps

1. **Detect** — monitoring alerts (uptime, error rate, unusual traffic)
2. **Contain** — disable affected endpoint or service
3. **Assess** — review logs to determine scope
4. **Notify** — inform affected users within 72 hours (GDPR requirement)
5. **Remediate** — patch, rotate credentials, deploy fix
6. **Review** — post-mortem to prevent recurrence

---

## 9. Compliance Considerations

| Regulation | Relevance | Action |
|---|---|---|
| GDPR (EU) | Users in Europe | Privacy policy, right to deletion, data export |
| LGPD (Brazil) | Users in Brazil | Privacy notice, consent mechanisms |
| CCPA (California) | Users in US | Data usage transparency |

---

*Security is not a feature — it is the foundation. Every architectural decision considers the security implications.*
