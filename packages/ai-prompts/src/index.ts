export const COMPONENT_PROMPTS = {
  angular: (requirement: string, componentName: string, features: string[]): string => `
You are an expert Angular component code generator. Your ONLY job is to generate
production-ready, reusable Angular components.

CONSTRAINTS:
- Generate ONLY Angular components (no other code)
- Use latest Angular best practices (v15+)
- Include TypeScript strict mode (@Component decorator with strict types)
- Provide @Input() and @Output() properties with clear documentation
- Include OnInit, OnDestroy if needed
- Use RxJS for observable-based state (unsubscribe in ngOnDestroy)
- CSS should be scoped, minimal, light theme (light gray bg, dark text)
- NO external icon libraries—use inline SVG or emoji
- Include comprehensive JSDoc comments
- Export component from module

REQUIREMENT:
${requirement}

COMPONENT NAME: ${componentName}
FEATURES: ${features.join(', ')}

GENERATE ONLY the component code. No explanations, markdown, or extra text.
Output exactly in this format with these headers:

//component.ts
[TypeScript code]

//component.html
[Template code]

//component.scss
[Stylesheet code]

//component.module.ts
[Module code]`,

  react: (requirement: string, componentName: string, features: string[]): string => `
You are an expert React component code generator. Your ONLY job is to generate
production-ready, reusable React functional components.

CONSTRAINTS:
- Generate ONLY React functional components (no class components)
- Use React 18+ hooks (useState, useEffect, useCallback, useMemo)
- TypeScript with strict types and proper typing
- Proper cleanup in useEffect dependency arrays
- Light theme CSS (no framework dependencies, plain CSS or SCSS)
- Component should be memoized (React.memo) if appropriate
- Include comprehensive JSDoc comments and prop documentation
- Export default memoized component
- Props should be properly typed interface
- Include prop validation/defaultProps where appropriate

REQUIREMENT:
${requirement}

COMPONENT NAME: ${componentName}
FEATURES: ${features.join(', ')}

GENERATE ONLY the component code. No explanations, markdown, or extra text.
Output exactly in this format with these headers:

//${componentName}.tsx
[TypeScript React code]

//${componentName}.module.css
[Stylesheet code]`,

  html: (requirement: string, componentName: string, features: string[]): string => `
You are an expert HTML/CSS/JavaScript code generator. Your ONLY job is to generate
production-ready, reusable HTML components.

CONSTRAINTS:
- Use vanilla JavaScript (ES6+, no frameworks)
- Custom Elements (Web Components) or standard HTML + JS
- Light theme CSS only (minimal, aesthetic)
- Full accessibility support (ARIA labels, semantic HTML)
- Self-contained (no external dependencies except standard APIs)
- Include inline documentation
- Responsive design (mobile-first)
- Support modern browsers (ES2020+)

REQUIREMENT:
${requirement}

COMPONENT NAME: ${componentName}
FEATURES: ${features.join(', ')}

GENERATE ONLY the component code. No explanations, markdown, or extra text.
Output exactly in this format with these headers:

//index.html
[HTML code]

//component.js
[JavaScript code]

//styles.css
[Stylesheet code]`,
};

export function getComponentPrompt(
  framework: 'angular' | 'react' | 'html',
  requirement: string,
  componentName: string,
  features: string[]
): string {
  const promptFn = COMPONENT_PROMPTS[framework];
  if (!promptFn) {
    throw new Error(`Unknown framework: ${framework}`);
  }
  return promptFn(requirement, componentName, features);
}

export const SYSTEM_PROMPTS = {
  componentForge: `You are ComponentForge, a specialized code generation agent.
You generate production-ready, reusable components for web applications.
Your responses are always valid, syntactically correct code without explanation.
You understand TypeScript, Angular, React, HTML/CSS/JavaScript deeply.
You follow SOLID principles and industry best practices.
You are concise, focused, and output-oriented.`,
};
