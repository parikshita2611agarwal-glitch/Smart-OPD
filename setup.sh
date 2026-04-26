#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MediQueue Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo ""
  echo "Enter your Anthropic API key (from console.anthropic.com):"
  read -s ANTHROPIC_API_KEY
  echo ""
fi

# Backend setup
echo "▶ Installing backend dependencies..."
cd backend
cp .env.example .env
echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" > .env
echo "PORT=5000" >> .env
npm install --silent
echo "✓ Backend ready"

# Frontend setup
echo "▶ Installing frontend dependencies..."
cd ../frontend
npm install --silent
echo "✓ Frontend ready"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All set! To start:"
echo ""
echo "  Terminal 1:  cd backend && npm start"
echo "  Terminal 2:  cd frontend && npm start"
echo ""
echo "  Then open http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
