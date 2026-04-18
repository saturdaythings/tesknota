"use client";

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon' | 'tab-action';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  selected?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 ' +
  'font-sans font-medium select-none disabled:opacity-50 disabled:pointer-events-none ' +
  'focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent)] ' +
  '[&_svg]:pointer-events-none [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  primary:
    'h-8 px-[var(--space-3)] bg-transparent border border-[var(--color-navy)] rounded-[var(--radius-md)] ' +
    'text-[length:var(--text-sm)] text-[var(--color-navy)] leading-none ' +
    'hover:bg-[var(--color-cream-dark)] active:bg-[var(--color-row-hover)]',
  secondary:
    'h-8 px-[var(--space-3)] bg-transparent border border-[var(--color-row-divider)] rounded-[var(--radius-md)] ' +
    'text-[length:var(--text-sm)] text-[var(--color-navy)] leading-none ' +
    'hover:border-[var(--color-navy)]',
  ghost:
    'h-8 px-[var(--space-2)] bg-transparent border-none rounded-[var(--radius-md)] ' +
    'text-[length:var(--text-sm)] text-[var(--color-meta-text)] leading-none ' +
    'hover:text-[var(--color-navy)]',
  destructive:
    'h-8 px-[var(--space-3)] bg-transparent border border-[var(--color-destructive)] rounded-[var(--radius-md)] ' +
    'text-[length:var(--text-sm)] text-[var(--color-destructive)] leading-none ' +
    'hover:bg-[var(--color-destructive)] hover:text-[var(--color-cream)]',
  icon:
    'w-7 h-7 bg-transparent border-none rounded-[var(--radius-md)] ' +
    'hover:bg-[var(--color-cream-dark)]',
  'tab-action':
    'h-8 px-[var(--space-3)] bg-transparent border border-[var(--color-row-divider)] rounded-[var(--radius-md)] ' +
    'text-[length:var(--text-sm)] text-[var(--color-navy)] leading-none',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size: _size, active, selected, className, children, ...props }, ref) => {
    const isActive = active || selected;
    const tabActionActive =
      variant === 'tab-action' && isActive
        ? 'border-[var(--color-navy)] bg-[var(--color-cream-dark)]'
        : '';

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], tabActionActive, className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
