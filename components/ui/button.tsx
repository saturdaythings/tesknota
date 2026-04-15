"use client";

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'danger' | 'icon';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  'inline-flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 ' +
  'font-sans font-medium select-none disabled:opacity-50 disabled:pointer-events-none ' +
  '[&_svg]:pointer-events-none [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  primary:
    'px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] ' +
    'bg-[var(--color-navy)] text-[var(--color-cream)] hover:bg-[var(--color-accent)]',
  secondary:
    'px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] bg-transparent ' +
    'border border-[var(--color-navy)] text-[var(--color-navy)] hover:bg-[var(--color-sand-light)]',
  ghost:
    'px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] bg-transparent ' +
    'text-[var(--color-navy)] hover:bg-[var(--color-sand-light)]',
  destructive:
    'px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] ' +
    'bg-[var(--color-destructive)] text-[var(--color-cream)] hover:opacity-85',
  danger:
    'px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] ' +
    'bg-[var(--color-destructive)] text-[var(--color-cream)] hover:opacity-85',
  icon: 'rounded-[3px] bg-transparent text-[var(--color-navy)] hover:bg-[var(--color-sand-light)]',
};

const sizes: Record<ButtonSize, Record<ButtonVariant, string>> = {
  md: {
    primary: 'min-h-10',
    secondary: 'min-h-10',
    ghost: 'min-h-10',
    destructive: 'min-h-10',
    danger: 'min-h-10',
    icon: 'w-10 h-10',
  },
  sm: {
    primary: 'min-h-8',
    secondary: 'min-h-8',
    ghost: 'min-h-8',
    destructive: 'min-h-8',
    danger: 'min-h-8',
    icon: 'w-8 h-8',
  },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size][variant], className)}
      {...props}
    >
      {children}
    </button>
  ),
);

Button.displayName = 'Button';

export { Button };
