#!/bin/bash

# Setup script for Cafeteria Lite Professional
# Automates local development environment setup

set -e  # Exit on error

echo "🚀 Cafeteria Lite Professional - Local Setup"
echo "=============================================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install Node.js 20+ and try again."
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "❌ npm not found. Install Node.js and try again."
  exit 1
fi

echo "✓ Node.js $(node --version) found"
echo "✓ npm $(npm --version) found"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend

if [ ! -f .env ]; then
  echo "  Creating .env from template..."
  cp .env.example .env
  echo "  ⚠️  Edit backend/.env with your credentials"
fi

echo "  Installing dependencies..."
npm install --silent

echo "✓ Backend setup complete"
echo ""

# Frontend setup
echo "📦 Setting up Frontend..."
cd ../frontend-web

echo "  Installing dependencies..."
npm install --silent

echo "✓ Frontend setup complete"
echo ""

# Summary
echo "=============================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. Update credentials in backend/.env:"
echo "   - Database: DB_HOST, DB_USER, DB_PASSWORD"
echo "   - Firebase: FIREBASE_PROJECT_ID, etc."
echo "   - Stripe: STRIPE_SECRET_KEY (test keys)"
echo ""
echo "2. Start database migrations:"
echo "   cd backend && npx knex migrate:latest"
echo ""
echo "3. Start development servers:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend-web && npm run dev"
echo ""
echo "4. Access the app:"
echo "   Admin: http://localhost:3001"
echo "   API: http://localhost:3000"
echo "   Health: http://localhost:3000/health"
echo ""
echo "📚 See docs/IMPLEMENTATION_GUIDE.md for more details"
echo ""
