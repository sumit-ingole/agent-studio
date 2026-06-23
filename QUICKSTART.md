# 🚀 AgentStudio - Quick Start Guide

Get AgentStudio running in 5 minutes!

---

## Prerequisites

Verify you have these installed:

```bash
node --version    # Should be 18.17 or higher
npm --version     # Any recent version is fine
```

**Don't have Node.js?** [Download here](https://nodejs.org)

---

## Step 1: Get Your API Key (2 minutes)

1. Go to **[Groq Console](https://console.groq.com)**
2. Sign up (free) or log in
3. Copy your **API Key** from the dashboard
4. Keep it safe—you'll need it in the next step

---

## Step 2: Clone & Setup (1 minute)

```bash
# Clone the repository
git clone https://github.com/sumit-ingole/agent-studio.git
cd agent-studio

# Install pnpm (one-time)
npm install -g pnpm@8

# Verify pnpm installation
pnpm --version    # Should show 8.x.x or higher
```

---

## Step 3: Configure Environment (1 minute)

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your API key
# On macOS/Linux:
nano .env.local

# On Windows (PowerShell):
notepad .env.local
```

Update the file to look like:

```env
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Save and close the editor.

---

## Step 4: Install & Run (1 minute)

```bash
# Install all dependencies (this installs for the entire monorepo)
pnpm install

# Start ComponentForge development server
pnpm dev:component-forge
```

You should see:

```
> @agent-studio/component-forge@1.0.0 dev
> next dev -p 3000

  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

## Step 5: Open in Browser

Open **[http://localhost:3000](http://localhost:3000)** and start generating components! 🎉

---

## What's Included?

### 🏠 Homepage (`/`)
- Overview of AgentStudio
- Features and capabilities
- Link to launch ComponentForge

### 🤖 Agents Hub (`/agents`)
- Tab interface for different AI agents
- Currently featuring ComponentForge (active)
- Other agents coming soon

### ⚙️ ComponentForge (`/agents/component-forge`)
**The main feature!**
- Describe your component needs
- Select framework (Angular, React, HTML)
- Get generated code instantly
- Download as ZIP or individual files

---

## Common Tasks

### 📝 Generate a Component

1. Go to `http://localhost:3000/agents/component-forge`
2. Describe what you need:
   ```
   Create a React dropdown component with search, 
   multi-select, and light theme
   ```
3. Select **React** framework
4. Click **Generate Component**
5. Download the generated code

### 🔄 Reload Code Changes

The dev server has hot reload. Just save your files and the browser updates automatically.

### 🧹 Stop the Server

Press `Ctrl+C` in your terminal.

### 🚀 Deploy to Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

See [Deployment Guide](./README.md#-deployment) for detailed steps.

---

## Build for Production

```bash
# Build all workspaces (creates optimized builds)
pnpm build

# Test production build locally
pnpm start
```

---

## Troubleshooting

### ❌ "GROQ API key not found"

**Fix:** Check `.env.local` exists and has your key:

```bash
cat .env.local    # Show file contents
# Should show: NEXT_PUBLIC_GROQ_API_KEY=your_key_here
```

### ❌ "Port 3000 already in use"

**Fix:** Kill existing process or use different port:

```bash
# Use port 3001 instead
pnpm dev:component-forge -- -p 3001
```

### ❌ "Cannot find pnpm"

**Fix:** Install pnpm:

```bash
npm install -g pnpm@8
```

### ❌ "Module not found: @agent-studio/types"

**Fix:** Rebuild workspaces:

```bash
pnpm install
pnpm build
pnpm dev:component-forge
```

---

## API Usage (Advanced)

Generate components programmatically:

```bash
curl -X POST http://localhost:3000/api/generate-component \
  -H "Content-Type: application/json" \
  -d '{
    "requirement": "Create a React button with loading state",
    "framework": "react",
    "componentName": "LoadingButton",
    "features": ["button", "loading"]
  }'
```

---

## Next Steps

- 📚 **Full Documentation:** See [README.md](./README.md)
- 🛠️ **Development Guide:** See [DEVELOPMENT.md](./DEVELOPMENT.md)
- 💬 **Report Issues:** [GitHub Issues](https://github.com/sumit-ingole/agent-studio/issues)
- 🚀 **Deploy:** Follow [Deployment Guide](./README.md#-deployment)

---

## System Architecture Overview

```
AgentStudio Monorepo
├── Apps (Full Next.js applications)
│   └── component-forge/    ← Main UI you're running
├── Packages (Shared libraries)
│   ├── types/              ← TypeScript definitions
│   ├── ai-prompts/         ← AI prompt templates
│   └── shared-ui/          ← Reusable React components
└── Scripts (Utility scripts)
    ├── setup.sh
    └── build.sh
```

**pnpm workspaces** manage dependencies and builds across all packages.

---

## Performance Tips

- First build might take 30-60 seconds (caching afterwards is faster)
- Code changes hot-reload (usually < 1 second)
- Generated components are cached by React Query
- Use `Ctrl+Shift+R` to hard-refresh browser if needed

---

## Getting Help

- **Documentation:** Read the [README.md](./README.md)
- **Development:** Check [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Issues:** [GitHub Issues](https://github.com/sumit-ingole/agent-studio/issues)
- **Discussions:** [GitHub Discussions](https://github.com/sumit-ingole/agent-studio/discussions)

---

## What's Next After Local Setup?

### 1️⃣ Test ComponentForge
- Generate a few components
- Try different frameworks
- Download and inspect generated code

### 2️⃣ Customize
- Edit prompts in `packages/ai-prompts/`
- Modify UI in `apps/component-forge/`
- Add new features

### 3️⃣ Deploy
- Push to GitHub
- Deploy to Vercel (5 clicks)
- Share with your network

---

## Pro Tips

✨ **Prompt Engineering:** Be specific in component descriptions
- Instead of: "Create a dropdown"
- Better: "Create a React dropdown with multi-select, filtering, and group support"

📦 **Reuse Generated Code:** Save generated components in a shared library

🔄 **Iterate:** Regenerate with different prompts to compare outputs

---

Happy component generation! 🎉

For more questions, see [README.md](./README.md) or open an issue.
