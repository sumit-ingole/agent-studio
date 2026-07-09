#!/bin/bash

# AgentStudio Setup Script
# This script initializes the project with all necessary configurations

set -e

echo "🚀 AgentStudio Setup Script"
echo "=============================="
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Current: $(node -v)"
  exit 1
fi
echo "  Node.js version: $(node -v) ✓"
echo ""

# Check pnpm
echo "✓ Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "  Installing pnpm..."
  npm install -g pnpm
else
  echo "  pnpm version: $(pnpm -v) ✓"
fi
echo ""

# Install dependencies
echo "✓ Installing dependencies..."
pnpm install --frozen-lockfile
echo "  Dependencies installed ✓"
echo ""

# Setup environment
echo "✓ Setting up environment variables..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "  Created .env.local from .env.example"
  echo "  ⚠️  Please update .env.local with your GROQ_API_KEY"
else
  echo "  .env.local already exists"
fi
echo ""

# Build all workspaces
echo "✓ Building all workspaces..."
pnpm build
echo "  All builds completed ✓"
echo ""

# Success message
echo "=============================="
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your GROQ API key"
echo "2. Run 'pnpm dev:component-forge' to start development"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, see README.md"
