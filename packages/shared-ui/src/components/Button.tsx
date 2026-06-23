import React from 'react';
import type { SharedUIComponentProps } from '@agent-studio/types';

interface ButtonProps extends SharedUIComponentProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

/**
 * Button - Reusable button component with variants
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      disabled = false,
      loading = false,
      className = '',
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
      ghost: 'text-slate-700 hover:bg-slate-100',
    };

    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-6 py-2 text-base',
      lg: 'px-8 py-3 text-lg',
    };

    const baseClasses =
      'font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        {...props}
      >
        {loading ? '...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
