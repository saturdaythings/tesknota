"use client";

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from '@/components/ui/Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity"
        style={{
          background: 'var(--color-navy-backdrop)',
          transitionDuration: 'var(--motion-slow)',
          animation: 'fadeIn var(--motion-slow)',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 bg-[var(--color-cream)] rounded-[var(--radius-lg)] overflow-y-auto transition-all',
          'border border-[var(--color-row-divider)]',
          // Desktop: centered, max 520px
          'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[520px] max-h-[80vh]',
          // Mobile: full screen bottom sheet
          'max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:max-h-[90dvh]',
          className,
        )}
        style={{
          boxShadow: 'var(--shadow-md)',
          transitionDuration: 'var(--motion-slow)',
          animation: 'slideIn var(--motion-slow)',
        }}
      >
        {children}
      </div>
    </>
  );
}

export function ModalHeader({ title, onClose, className }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-[var(--space-6)] py-[var(--space-4)]',
        'border-b border-[var(--color-row-divider)]',
        className,
      )}
    >
      <h2
        className="font-serif italic text-[length:var(--text-lg)] leading-tight text-[var(--color-navy)]"
      >
        {title}
      </h2>
      <Button variant="icon" aria-label="Close" onClick={onClose}>
        <X size={16} />
      </Button>
    </div>
  );
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('p-[var(--space-6)] flex flex-col gap-[var(--space-4)]', className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-[var(--space-6)] py-[var(--space-4)]',
        'border-t border-[var(--color-row-divider)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
