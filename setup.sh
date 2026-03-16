#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  InteliCareer — Local Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check prerequisites
if ! command -v node &>/dev/null; then echo "Node.js not found. Install from nodejs.org"; exit 1; fi
if ! command -v docker &>/dev/null; then echo "Docker not found. Install from docker.com"; exit 1; fi

echo ""
echo "✓ Node.js $(node -v)"
echo "✓ npm $(npm -v)"
echo "✓ Docker detected"

# Copy env files
echo ""
echo "Setting up environment files..."
cp -n src/backend/.env.example src/backend/.env 2>/dev/null && echo "Created src/backend/.env" || echo "src/backend/.env already exists"
cp -n src/frontend/.env.local.example src/frontend/.env.local 2>/dev/null && echo "Created src/frontend/.env.local" || echo "src/frontend/.env.local already exists"

# Install backend deps
echo ""
echo "Installing backend dependencies..."
cd src/backend && npm install && cd ../..

# Install frontend deps
echo ""
echo "Installing frontend dependencies..."
cd src/frontend && npm install && cd ../..

# Start database with Docker
echo ""
echo "Starting PostgreSQL with Docker..."
docker-compose up -d postgres
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Run migrations and seed
echo ""
echo "Running database migrations..."
cd src/backend
npx prisma generate
npx prisma db push
echo "Seeding database with demo data..."
npx ts-node prisma/seed.ts
cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete!"
echo ""
echo "  Start the app:"
echo "    Backend:  cd src/backend && npm run dev"
echo "    Frontend: cd src/frontend && npm run dev"
echo ""
echo "  Or run everything with Docker:"
echo "    docker-compose up"
echo ""
echo "  Demo login:"
echo "    Email:    demo@intelicareer.com"
echo "    Password: demo1234"
echo ""
echo "  URLs:"
echo "    Frontend: http://localhost:3000"
echo "    Backend:  http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
