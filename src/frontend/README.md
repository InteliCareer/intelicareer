# Frontend — Next.js 14

## Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Charts:** Recharts
- **State:** Zustand (client) + React Query / TanStack Query (server state)
- **Forms:** React Hook Form + Zod
- **Auth:** NextAuth.js
- **Drag & Drop:** dnd-kit (Kanban board)

## Structure

```
src/frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── tracker/         # Job Application Kanban
│   │   ├── skills/          # Skill Gap Analyzer
│   │   ├── market/          # Market Trends Dashboard
│   │   ├── insights/        # Career Insights Engine
│   │   └── resume/          # Resume Analyzer
│   ├── api/                 # Next.js API routes (NextAuth)
│   └── layout.tsx
├── components/
│   ├── tracker/             # Kanban board, application cards
│   ├── charts/              # Chart wrappers
│   ├── skills/              # Skill gap components
│   └── ui/                  # shadcn base components
├── hooks/                   # Custom hooks (useApplications, useMarket, etc.)
├── lib/
│   ├── api.ts               # Axios API client with auth headers
│   └── utils.ts
└── types/                   # Shared TypeScript types
```

## Setup

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## Available Scripts

```bash
npm run dev       # Start development server (port 3000)
npm run build     # Build for production
npm run lint      # Run ESLint
npm run type-check # TypeScript check without compilation
```
