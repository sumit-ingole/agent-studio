# AgentStudio Development Guide

## Getting Started

### Prerequisites

- Node.js 18.17+
- pnpm 8.0+
- Git
- (Optional) Docker for containerized development

### Initial Setup

```bash
# Clone repository
git clone https://github.com/sumit-ingole/agent-studio.git
cd agent-studio

# Run setup script (Unix/Linux/macOS)
bash scripts/setup.sh

# Or manual setup
pnpm install
cp .env.example .env.local
# Edit .env.local with your GROQ_API_KEY
pnpm build
```

## Project Structure Deep Dive

### Apps

Each app in `apps/` is a standalone Next.js application with its own:

- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `public/` - Static assets
- `app/` - Next.js app router

### Packages

Shared packages in `packages/` are:

- **types**: TypeScript type definitions used across apps
- **ai-prompts**: Centralized AI prompt templates
- **shared-ui**: Reusable React components

### Monorepo Configuration

- **pnpm-workspace.yaml**: Defines workspace structure
- **turbo.json**: Turborepo configuration for caching and orchestration
- **package.json** (root): Workspace scripts and shared dev dependencies

## Development Workflows

### Starting Development

```bash
# All apps in parallel
pnpm dev

# ComponentForge only
pnpm dev:component-forge

# Other apps (when added)
pnpm dev:state-management
pnpm dev:form-builder
```

### Building

```bash
# Build all workspaces (with Turbo caching)
pnpm build

# Build specific app
pnpm build:component-forge

# Build with Turbo UI
pnpm run build --ui=web
```

### Code Quality

```bash
# Lint all
pnpm lint
pnpm lint:fix

# Type check
pnpm type-check

# Format code
pnpm format
pnpm format:check
```

## Adding a New Feature

### Example: Adding State Management Agent

1. **Create app structure**:

```bash
mkdir -p apps/state-management/{app,lib,components,public}
```

2. **Create package.json**:

```json
{
  "name": "@agent-studio/state-management",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.1"
  }
}
```

3. **Create tsconfig.json** (extend from root):

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

4. **Create minimal app structure**:

```
- app/
  - layout.tsx
  - page.tsx
  - globals.css
```

5. **Update root package.json**:

```json
{
  "scripts": {
    "dev:state-management": "pnpm --filter @agent-studio/state-management dev"
  }
}
```

6. **Update agents hub** (`apps/component-forge/app/agents/page.tsx`):

```typescript
const AGENT_TABS: AgentTab[] = [
  // ... existing tabs
  {
    id: 'state-management',
    name: 'State Boilerplate',
    icon: '⚙️',
    description: 'Generate state management boilerplate',
    component: StateManagementAgent,
    status: 'active', // Change from 'coming-soon'
  },
];
```

## Working with Shared Packages

### Using Types

```typescript
// In any app
import type { ComponentRequest, Framework } from '@agent-studio/types';
```

### Using Prompts

```typescript
// In any app
import { getComponentPrompt } from '@agent-studio/ai-prompts';

const prompt = getComponentPrompt('react', requirement, name, features);
```

### Using Shared UI

```typescript
// In any app
import { Button, Card, LoadingSpinner } from '@agent-studio/shared-ui';

export default function MyComponent() {
  return (
    <Card>
      <Button onClick={handleClick}>Click me</Button>
    </Card>
  );
}
```

## API Development

### Creating New API Routes

Next.js API routes use App Router pattern:

```typescript
// app/api/my-endpoint/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  // Process...
  return Response.json({ success: true });
}

export async function GET() {
  return Response.json({ status: 'ok' });
}
```

### Integration with Groq

```typescript
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

const message = await groq.messages.create({
  model: 'openai/gpt-oss-120b',
  max_tokens: 2048,
  messages: [{ role: 'user', content: 'Your prompt' }],
});
```

## Environment Variables

### Local Development

Create `.env.local`:

```env
NEXT_PUBLIC_GROQ_API_KEY=your_api_key_here
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)

Set in Vercel dashboard under Project Settings → Environment Variables:

```
NEXT_PUBLIC_GROQ_API_KEY=your_production_key
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Debugging

### VS Code Setup

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    }
  ]
}
```

Start with: `node --inspect-brk ./node_modules/.bin/next dev`

### Browser DevTools

- React DevTools: Check component state
- Network tab: Monitor API calls
- Console: Check for errors

## Testing

```bash
# Run tests (when available)
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Git Workflow

### Branch Naming

- `feature/agent-name` - New features
- `fix/issue-description` - Bug fixes
- `docs/topic` - Documentation
- `refactor/area` - Refactoring

### Commit Messages

```
feat: Add new agent for X
fix: Resolve issue with Y
docs: Update installation guide
refactor: Simplify Z component
```

### Pull Requests

1. Create feature branch from `develop`
2. Make changes and commit
3. Push and create PR to `develop`
4. CI checks must pass
5. Get review approval
6. Merge to `develop`
7. (Periodic) Merge `develop` to `main` for release

## Performance Optimization

### Turbo Caching

Turbo caches build outputs. Clear cache:

```bash
pnpm turbo prune --scope=@agent-studio/component-forge
pnpm build
```

### Next.js Optimization

- Use `next/image` for images
- Code splitting with dynamic imports
- Route-based code splitting (automatic)

### API Performance

- Cache API responses with React Query
- Use Groq's fast inference
- Implement request debouncing on frontend

## Deployment

### Local Testing

```bash
# Build production
pnpm build

# Start production server
pnpm start

# Or with Docker
pnpm docker:build
pnpm docker:run
```

### Vercel Deployment

1. Connect GitHub repo to Vercel
2. Set environment variables
3. Configure build settings:
   - Root Directory: `.`
   - Build Command: `pnpm build`
   - Start Command: `pnpm start`
4. Deploy!

### Docker Deployment

```bash
# Build image
pnpm docker:build

# Run locally
pnpm docker:run

# Push to registry
docker tag agent-studio:latest your-registry/agent-studio:latest
docker push your-registry/agent-studio:latest
```

## Troubleshooting

### "Cannot find module @agent-studio/types"

```bash
# Rebuild workspaces
pnpm install
pnpm build
```

### Port already in use

```bash
# Use different port
pnpm dev:component-forge -- -p 3001
```

### Turbo cache issues

```bash
# Clear turbo cache
pnpm turbo clean
pnpm build
```

### Groq API errors

- Check API key in `.env.local`
- Verify rate limit (30 req/min free tier)
- Check request/response format

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turbo Docs](https://turbo.build)
- [Groq API](https://console.groq.com)
- [TypeScript](https://www.typescriptlang.org)

## Getting Help

- Check existing issues: [GitHub Issues](https://github.com/sumit-ingole/agent-studio/issues)
- Start discussion: [GitHub Discussions](https://github.com/sumit-ingole/agent-studio/discussions)
- Email: sumit.ingole@example.com

---

Happy developing! 🚀
