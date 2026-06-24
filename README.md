# 🏗️ AgentStudio

**Multi-Agent AI Platform for Production-Ready Component Generation**

AgentStudio is a monorepo-based platform where specialized AI agents generate production-ready, reusable components for React and HTML. Currently featuring **ComponentForge**, with extensible architecture for additional agents.

---

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Available Commands](#available-commands)
- [Architecture](#architecture)
- [Agents](#agents)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🗂️ Project Structure

```
agent-studio/
├── apps/
│   ├── component-forge/              # Next.js app - Main UI hub
│   │   ├── app/
│   │   │   ├── api/                  # Next.js API routes
│   │   │   │   ├── generate-component/
│   │   │   │   ├── health/
│   │   │   │   └── ...
│   │   │   ├── agents/               # Agent UI pages
│   │   │   │   ├── page.tsx          # Agents hub (tabs)
│   │   │   │   └── [agent-id]/       # Individual agent pages
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── components/               # Reusable React components
│   │   ├── lib/                      # Utilities and helpers
│   │   ├── public/                   # Static assets
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── state-management/             # (Future agent)
│   └── form-builder/                 # (Future agent)
│
├── packages/
│   ├── shared-ui/                    # Shared React components library
│   │   ├── src/components/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai-prompts/                   # Centralized prompt management
│   │   ├── src/
│   │   │   ├── react/
│   │   │   ├── html/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── types/                        # Shared TypeScript types
│       ├── src/
│       │   ├── agent.ts
│       │   ├── component.ts
│       │   └── index.ts
│       └── package.json
│
├── scripts/
│   ├── setup.sh                      # Initial setup
│   ├── build.sh                      # Build all apps
│   └── deploy.sh                     # Deployment script
│
├── docker/
│   ├── Dockerfile                    # Production Docker image
│   └── .dockerignore
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI/CD pipeline
│       └── deploy.yml                # Auto-deployment
│
├── pnpm-workspace.yaml               # pnpm workspace config
├── turbo.json                        # Turborepo config
├── tsconfig.json                     # Root TypeScript config
├── .eslintrc.json
├── .prettierrc.json
├── package.json
├── README.md                         # This file
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.17 or higher
- **pnpm**: 8.0 or higher
- **Groq API Key**: [Get one free](https://console.groq.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/sumit-ingole/agent-studio.git
cd agent-studio

# Install dependencies (pnpm)
pnpm install

# Copy environment template and fill in your API key
cp .env.example .env.local

# Start development server
pnpm dev:component-forge
```

Visit `http://localhost:3000` and navigate to the agents hub.

---

## 📝 Available Commands

### Development

```bash
# Start all apps in development mode (parallel)
pnpm dev

# Start only ComponentForge
pnpm dev:component-forge

# Watch mode with HMR
pnpm dev --watch
```

### Building

```bash
# Build all workspaces
pnpm build

# Build only ComponentForge
pnpm build:component-forge

# Build for production
pnpm build && pnpm start
```

### Code Quality

```bash
# Run linter across all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm type-check

# Format code with Prettier
pnpm format

# Check format without writing
pnpm format:check
```

### Maintenance

```bash
# Clean all generated files and node_modules
pnpm clean

# Reinstall dependencies
pnpm install-dependencies
```

### Docker

```bash
# Build Docker image
pnpm docker:build

# Run Docker container
pnpm docker:run
```

---

## 🏛️ Architecture

### Monorepo Design

AgentStudio uses **pnpm workspaces** + **Turborepo** for:

- **Dependency Management**: Each app/package has isolated deps, shared at root
- **Build Caching**: Turbo caches build outputs to avoid redundant builds
- **Parallel Execution**: Multiple apps/packages build simultaneously
- **Code Sharing**: `packages/` contain shared logic (types, prompts, UI)

### Agent Structure

Each agent is a self-contained module:

```
Agent
├── Requirement Parser (NLP)    → Extract: name, features, framework
├── Skill System                → Modular, focused capabilities
├── LLM Integration (Groq)      → Fast inference, free tier
├── Code Validator              → Syntax & type checking
└── Output Handler              → Download, preview, caching
```

### API Routes

**ComponentForge** exposes:

- `POST /api/generate-component` - Generate a component
- `GET /api/health` - Health check
- `POST /api/validate-code` - Validate generated code

---

## 🤖 Agents

### ✅ ComponentForge (Active)

Generate production-ready UI components.

**Capabilities:**

- Support for React (18+) and HTML5
- TypeScript strict mode
- Light theme CSS (minimal, aesthetic)
- Responsive design
- JSDoc documentation
- Framework-specific best practices

**Example Prompt:**

```
Create a React TreeSelect component with group selection enabled by default,
lazy loading support, and filtering. Should include @Input/@Output properties
and method support for selectors.
```

**Supported Output:**

- Component TypeScript file
- Template (HTML)
- Styles (SCSS/CSS)
- Module configuration
- Download as ZIP or individual files

### 🔜 State Management (Coming Soon)

Generate Redux/NgRx/Zustand boilerplate with DevTools integration.

### 🔜 Form Builder (Coming Soon)

Create form components with validation, error handling, and accessibility.

---

## 🛠️ Development

### Adding a New Agent

1. Create agent folder in `apps/`:

   ```bash
   mkdir -p apps/my-agent/app apps/my-agent/lib
   ```

2. Create `apps/my-agent/package.json`:

   ```json
   {
     "name": "@agent-studio/my-agent",
     "version": "1.0.0",
     "private": true,
     "scripts": {
       "dev": "next dev -p 3001",
       "build": "next build",
       "start": "next start",
       "lint": "next lint",
       "type-check": "tsc --noEmit"
     },
     "dependencies": {
       "next": "^14.2.0",
       "react": "^18.3.1",
       "react-dom": "^18.3.1"
     },
     "devDependencies": {
       "@types/node": "^20.10.6",
       "@types/react": "^18.2.46",
       "typescript": "^5.3.3"
     }
   }
   ```

3. Create `apps/my-agent/tsconfig.json`:

   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./*"]
       }
     },
     "include": ["**/*.ts", "**/*.tsx"],
     "exclude": ["node_modules", ".next"]
   }
   ```

4. Add to `turbo.json` pipeline if needed.

5. Update root `package.json` scripts:
   ```json
   {
     "scripts": {
       "dev:my-agent": "pnpm --filter @agent-studio/my-agent dev"
     }
   }
   ```

### Shared Packages

Import from `@agent-studio/types`, `@agent-studio/ai-prompts`, `@agent-studio/shared-ui`:

```typescript
// In any app
import { ComponentRequest, ComponentResponse } from '@agent-studio/types';
import { getComponentPrompt } from '@agent-studio/ai-prompts';
import { CodeEditor } from '@agent-studio/shared-ui';
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Connect GitHub repo to Vercel
# Vercel auto-detects monorepo + Next.js

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_GROQ_API_KEY=your_key
```

### Docker

```bash
# Build image
pnpm docker:build

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_GROQ_API_KEY=your_key \
  agent-studio:latest
```

### Self-Hosted (Node.js)

```bash
# Build production
pnpm build

# Start production server
pnpm start
```

---

## 📚 API Documentation

### POST /api/generate-component

**Request:**

```json
{
  "requirement": "Create a React TreeSelect with group selection...",
  "framework": "react",
  "componentName": "TreeSelect",
  "features": ["tree", "select", "groups"]
}
```

**Response:**

```json
{
  "success": true,
  "componentName": "TreeSelect",
  "framework": "react",
  "files": {
    "component.tsx": "...",
    "component.module.css": "..."
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Security

- **Environment Variables**: Never commit `.env.local`
- **API Keys**: Use `.env.example` template only
- **Headers**: CORS, CSP, X-Frame-Options configured
- **Input Validation**: Zod schemas for all endpoints
- **Output Sanitization**: Generated code validated before serving

---

## 📊 Performance

- **Build Caching**: Turborepo reduces rebuild time by 80%
- **Code Splitting**: Next.js automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Font Loading**: Inter + Fira Code via Google Fonts (preconnect)
- **API Latency**: Groq ~200-500ms response time

---

## 🧪 Testing

```bash
# Run tests across all packages (when available)
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 👤 Author

**Sumit Ingole**

- GitHub: [@sumit-ingole](https://github.com/sumit-ingole)
- LinkedIn: [Sumit Ingole](https://linkedin.com/in/sumit-ingole-79427aa8/)

---

## 🤝 Contributing

Contributions welcome! Please follow:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🐛 Troubleshooting

### "pnpm: command not found"

```bash
npm install -g pnpm@8
```

### "Cannot find module @agent-studio/types"

```bash
# Rebuild workspaces
pnpm install
pnpm build
```

### Groq API 429 (Rate Limit)

The free tier allows 30 requests/minute. Wait and retry.

### Next.js port already in use

```bash
# Use different port
pnpm dev:component-forge -- -p 3001
```

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sumit-ingole/agent-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sumit-ingole/agent-studio/discussions)
- **Email**: sumit.ingole@example.com

---

Happy building with AgentStudio! 🚀
