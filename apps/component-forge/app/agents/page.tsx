'use client';

import { useState } from 'react';
import ComponentForgeAgent from './component-forge/page';

interface AgentTab {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: React.ComponentType;
  status: 'active' | 'coming-soon';
}

const AGENT_TABS: AgentTab[] = [
  {
    id: 'component-forge',
    name: 'ComponentForge',
    icon: '🧩',
    description: 'Generate production-ready reusable components',
    component: ComponentForgeAgent,
    status: 'active',
  },
  {
    id: 'state-management',
    name: 'State Boilerplate',
    icon: '⚙️',
    description: 'Generate state management boilerplate',
    component: () => (
      <div className="text-center py-12">
        <p className="text-muted">Coming soon...</p>
      </div>
    ),
    status: 'coming-soon',
  },
  {
    id: 'form-builder',
    name: 'Form Builder',
    icon: '📝',
    description: 'Generate form components with validation',
    component: () => (
      <div className="text-center py-12">
        <p className="text-muted">Coming soon...</p>
      </div>
    ),
    status: 'coming-soon',
  },
];

export default function AgentsHub() {
  const [activeTab, setActiveTab] = useState(0);
  const CurrentAgent = AGENT_TABS[activeTab].component;

  return (
    <div className="min-h-screen bg-contrast-light">
      {/* Header */}
      <div className="surface border-b panel-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-strong mb-2">AI Agent Studio</h1>
          <p className="text-muted">Specialized agents for component and code generation</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 border-b panel-border">
          {AGENT_TABS.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              disabled={tab.status === 'coming-soon'}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === idx
                  ? 'tab-button-active'
                  : tab.status === 'coming-soon'
                    ? 'border-transparent text-muted cursor-not-allowed'
                    : 'border-transparent tab-button hover:text-strong'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Agent Info */}
        <div className="mt-6 mb-8">
          <h2 className="text-2xl font-bold text-strong mb-2">
            {AGENT_TABS[activeTab].icon} {AGENT_TABS[activeTab].name}
          </h2>
          <p className="text-muted">{AGENT_TABS[activeTab].description}</p>
        </div>

        {/* Agent Content */}
        <div className="surface rounded-lg panel-border shadow-sm p-8">
          <CurrentAgent />
        </div>
      </div>
    </div>
  );
}
