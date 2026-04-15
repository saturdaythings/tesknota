"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "modal-title-" + title.toLowerCase().replace(/\s+/g, "-");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[600] flex items-center justify-center p-[18px] bg-[rgba(var(--blue3-ch),0.55)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={cn(
          "bg-[var(--off)] w-full max-w-[540px] max-h-[88dvh] overflow-y-auto relative shadow-[0_20px_60px_rgba(var(--blue3-ch),0.2)]",
          className,
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-[1] flex items-start justify-between px-[26px] pt-6 pb-4 bg-[var(--off)] border-b border-[var(--b2)]">
          <div>
            <div
              id={titleId}
              className="font-[var(--serif)] text-xl text-[var(--ink)]"
            >
              {title}
            </div>
            {subtitle && (
              <div className="font-[var(--mono)] text-xs text-[var(--ink3)] mt-[3px] tracking-[0.1em] uppercase">
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="bg-transparent border-none cursor-pointer text-[22px] text-[var(--ink3)] leading-none p-0 hover:text-[var(--ink)]"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-[26px] py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 flex items-center justify-end gap-2 px-[26px] py-[14px] bg-[var(--off)] border-t border-[var(--b2)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
