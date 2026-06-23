export type Framework = 'angular' | 'react' | 'html';

export interface ParsedRequirement {
  componentName: string;
  features: string[];
  accessibility?: boolean;
  styleTheme?: 'light' | 'dark';
  framework?: Framework;
  keywords: string[];
}

export interface ComponentRequest {
  requirement: string;
  framework: Framework;
  componentName: string;
  features: string[];
}

export interface ComponentFile {
  [filename: string]: string;
}

export interface ComponentResponse {
  success: boolean;
  componentName: string;
  framework: Framework;
  files: ComponentFile;
  timestamp: string;
  error?: string;
}

export interface APIErrorResponse {
  error: string;
  details?: Record<string, any>;
  status: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'coming-soon' | 'beta';
  capabilities: string[];
}

export interface CodeValidationResult {
  valid: boolean;
  errors: Array<{
    line: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export interface GenerationHistory {
  id: string;
  requirement: string;
  framework: Framework;
  componentName: string;
  files: ComponentFile;
  timestamp: Date;
  ratings?: number;
  tags?: string[];
}

export interface SharedUIComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}
