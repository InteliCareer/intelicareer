# Backend — Node.js + Express + Prisma

## Stack
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Auth:** JWT + bcrypt
- **Validation:** Zod
- **Logging:** Winston
- **Testing:** Jest + Supertest

## Structure

```
src/backend/
├── src/
│   ├── controllers/         # Route handlers (thin layer, delegates to services)
│   ├── services/            # Business logic
│   ├── routes/              # Express route definitions
│   ├── middleware/          # Auth guard, error handler, request validation
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.ts          # Seed script
│   │   └── migrations/
│   └── utils/               # Shared utilities (logger, response helpers)
├── tests/
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## API Base URL

Development: `http://localhost:3001`

All endpoints prefixed with `/api/`

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/intelicareer
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
ANALYTICS_SERVICE_URL=http://localhost:8001
PORT=3001
NODE_ENV=development
```
