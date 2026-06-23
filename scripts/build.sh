#!/bin/bash

# AgentStudio Build Script
# Builds all workspaces for production

set -e

echo "🔨 Building AgentStudio..."
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation
if [ ! -f "pnpm-workspace.yaml" ]; then
  echo -e "${RED}Error: Not in AgentStudio root directory${NC}"
  exit 1
fi

# Clean previous builds
echo "  Cleaning previous builds..."
pnpm clean

echo ""
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo ""
echo "🏗️  Building workspaces..."

# Build with turbo
pnpm build

echo ""
echo "📊 Build statistics:"
echo "  - Component-Forge: $(du -sh apps/component-forge/.next 2>/dev/null || echo 'N/A')"

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""
echo "Build artifacts:"
echo "  - apps/component-forge/.next (Next.js build)"
echo "  - dist/ (Generated libraries)"
echo ""
echo "Next: Deploy with 'pnpm docker:build' or Vercel"
