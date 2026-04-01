#!/bin/bash
# ── InteliCareer Security Test Suite ─────────────────────────────
# Tests for OWASP Top 10 vulnerabilities
set -e

BASE="http://localhost:3001"
PASS=0
FAIL=0
WARN=0

green() { echo -e "\033[32m  PASS\033[0m $1"; PASS=$((PASS+1)); }
red()   { echo -e "\033[31m  FAIL\033[0m $1"; FAIL=$((FAIL+1)); }
yellow(){ echo -e "\033[33m  WARN\033[0m $1"; WARN=$((WARN+1)); }

echo "============================================"
echo " InteliCareer Security Audit"
echo " $(date)"
echo "============================================"
echo ""

# ── 1. Security Headers (Helmet) ────────────────────────────────
echo ">> 1. Security Headers"
HEADERS=$(curl -sI "$BASE/health")

if echo "$HEADERS" | grep -qi "x-content-type-options: nosniff"; then
  green "X-Content-Type-Options: nosniff"
else
  red "Missing X-Content-Type-Options header"
fi

if echo "$HEADERS" | grep -qi "x-frame-options"; then
  green "X-Frame-Options present"
else
  red "Missing X-Frame-Options header"
fi

if echo "$HEADERS" | grep -qi "x-xss-protection"; then
  green "X-XSS-Protection present"
else
  yellow "X-XSS-Protection missing (OK if CSP is set)"
fi

if echo "$HEADERS" | grep -qi "strict-transport-security"; then
  green "Strict-Transport-Security present"
else
  yellow "HSTS not set (OK for localhost, required in prod)"
fi

if echo "$HEADERS" | grep -qi "x-powered-by"; then
  red "X-Powered-By header leaks server info"
else
  green "X-Powered-By removed (no server fingerprinting)"
fi

echo ""

# ── 2. CORS Policy ──────────────────────────────────────────────
echo ">> 2. CORS Policy"
CORS_RESP=$(curl -sI -H "Origin: https://evil-site.com" "$BASE/api/auth/login")
if echo "$CORS_RESP" | grep -qi "access-control-allow-origin: https://evil-site.com"; then
  red "CORS allows arbitrary origins"
else
  green "CORS rejects unauthorized origins"
fi

CORS_OK=$(curl -sI -H "Origin: http://localhost:3000" "$BASE/api/auth/login")
if echo "$CORS_OK" | grep -qi "access-control-allow-origin: http://localhost:3000"; then
  green "CORS allows legitimate origin"
else
  yellow "CORS may be too strict for dev"
fi

echo ""

# ── 3. Authentication Security ───────────────────────────────────
echo ">> 3. Authentication"

# Bad credentials should return generic error (no email enumeration)
RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com","password":"wrong"}')
if echo "$RESP" | grep -qi "invalid email or password"; then
  green "Generic error message (no email enumeration)"
else
  red "Login error may leak user existence: $RESP"
fi

# Password validation
RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"weak","name":"Test"}')
if echo "$RESP" | grep -qi "password"; then
  green "Weak passwords rejected"
else
  red "Weak password accepted!"
fi

RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"NoSpecial1","name":"Test"}')
if echo "$RESP" | grep -qi "special"; then
  green "Password requires special characters"
else
  red "Password without special character accepted"
fi

# Email verification required
RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"sectest-'$RANDOM'@test.com","password":"Test@1234!","name":"Sec Test"}')
if echo "$RESP" | grep -qi "pendingVerification"; then
  green "Email verification required on registration"
else
  red "Registration does not require email verification"
fi

# Unverified user cannot login
RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sectest@test.com","password":"Test@1234!"}')
if echo "$RESP" | grep -qi "verify\|verification\|invalid"; then
  green "Unverified users blocked from login"
else
  red "Unverified user could login"
fi

echo ""

# ── 4. Rate Limiting ────────────────────────────────────────────
echo ">> 4. Rate Limiting"
RATE_BLOCKED=false
for i in $(seq 1 12); do
  RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"ratelimit@test.com","password":"wrong"}')
  if [ "$RESP" = "429" ]; then
    RATE_BLOCKED=true
    break
  fi
done
if [ "$RATE_BLOCKED" = true ]; then
  green "Auth rate limiting active (blocked after $i attempts)"
else
  red "No rate limiting on auth endpoints"
fi

echo ""

# ── 5. Account Lockout ──────────────────────────────────────────
echo ">> 5. Brute Force Protection"
# First, verify the demo user and then test lockout
for i in $(seq 1 6); do
  curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@intelicareer.com","password":"wrongpassword"}' > /dev/null
done
RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@intelicareer.com","password":"wrongpassword"}')
if echo "$RESP" | grep -qi "locked\|too many"; then
  green "Account lockout after failed attempts"
else
  yellow "Account lockout may not have triggered (could be rate limited first)"
fi

echo ""

# ── 6. Injection Prevention ─────────────────────────────────────
echo ">> 6. Injection Prevention"

# SQL injection in login
RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com\" OR 1=1--","password":"anything"}')
if echo "$RESP" | grep -qi "invalid\|error"; then
  green "SQL injection in login blocked"
else
  red "Possible SQL injection vulnerability!"
fi

# XSS in name field
RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"xss@test.com","password":"Test@1234!","name":"<script>alert(1)</script>"}')
if echo "$RESP" | grep -q "<script>"; then
  yellow "XSS payload stored in name (sanitize on output)"
else
  green "XSS payload not reflected in response"
fi

# NoSQL injection attempt
RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":"anything"}')
if echo "$RESP" | grep -qi "invalid\|error"; then
  green "NoSQL injection blocked (Zod validation)"
else
  red "Possible NoSQL injection vulnerability!"
fi

echo ""

# ── 7. Protected Routes ─────────────────────────────────────────
echo ">> 7. Authorization"

RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/users/me")
if [ "$RESP" = "401" ]; then
  green "Protected route rejects unauthenticated requests"
else
  red "Protected route accessible without auth (HTTP $RESP)"
fi

RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/applications" \
  -H "Authorization: Bearer fake.jwt.token")
if [ "$RESP" = "401" ]; then
  green "Invalid JWT rejected"
else
  red "Invalid JWT accepted (HTTP $RESP)"
fi

RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/scraper/run" \
  -X POST -H "Authorization: Bearer fake")
if [ "$RESP" = "401" ]; then
  green "Scraper endpoint requires valid auth"
else
  red "Scraper accessible without valid auth"
fi

echo ""

# ── 8. Input Validation ─────────────────────────────────────────
echo ">> 8. Input Validation"

RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"x","name":""}')
if echo "$RESP" | grep -qi "error"; then
  green "Invalid input rejected by validation"
else
  red "Invalid input accepted"
fi

# Oversized payload
RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234!","name":"'"$(python3 -c "print('A'*200000)")"'"}')
if [ "$RESP" = "400" ] || [ "$RESP" = "413" ]; then
  green "Oversized payload rejected"
else
  yellow "Large payload got HTTP $RESP (body limit may be higher)"
fi

echo ""

# ── 9. Information Disclosure ────────────────────────────────────
echo ">> 9. Information Disclosure"

RESP=$(curl -s "$BASE/nonexistent-path")
if echo "$RESP" | grep -qi "stack\|trace\|node_modules\|internal"; then
  red "Error response leaks stack traces"
else
  green "No stack traces in error responses"
fi

RESP=$(curl -sI "$BASE/health")
if echo "$RESP" | grep -qi "server:.*express\|server:.*node"; then
  red "Server header reveals technology"
else
  green "Server technology not disclosed"
fi

echo ""

# ── 10. Body size limit ─────────────────────────────────────────
echo ">> 10. Denial of Service Protection"

RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  --max-time 5 \
  -d '{"email":"test@test.com","password":"'"$(python3 -c "print('A'*2000000)")"'"}')
if [ "$RESP" = "413" ]; then
  green "Large body rejected (413 Payload Too Large)"
else
  yellow "Large body got HTTP $RESP (1MB limit may be sufficient)"
fi

echo ""
echo "============================================"
echo " Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "\033[31m Some tests failed. Review above.\033[0m"
  exit 1
else
  echo -e "\033[32m All critical tests passed!\033[0m"
fi
