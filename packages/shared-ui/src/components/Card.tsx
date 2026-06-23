import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

/**
 * Card - Container component for content grouping
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', hoverable = false }, ref) => {
    const hoverClass = hoverable
      ? 'hover:shadow-lg hover:-translate-y-1 transition-all'
      : '';

    return (
      <div
        ref={ref}
        className={`bg-white rounded-lg border border-slate-200 shadow-sm ${hoverClass} ${className}`}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
