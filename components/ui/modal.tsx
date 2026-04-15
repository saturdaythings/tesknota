"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
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
    <>
      <style>{`
        @keyframes modal-fade-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes sheet-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .modal-panel {
          animation: modal-fade-in 180ms ease-out forwards;
        }
        @media (max-width: 640px) {
          .modal-panel {
            animation: sheet-slide-up 220ms ease-out forwards;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(26,24,22,0.5)",
          zIndex: "var(--z-modal)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Desktop: centered panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn("modal-panel", className)}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: "var(--z-modal)",
          width: "90vw",
          maxWidth: "520px",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
      >
        {/* Mobile override via CSS — bottom sheet */}
        <style>{`
          @media (max-width: 640px) {
            .modal-panel {
              top: auto !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              transform: none !important;
              width: 100% !important;
              max-width: 100% !important;
              border-radius: var(--radius-lg) var(--radius-lg) 0 0 !important;
              max-height: 90dvh !important;
            }
          }
        `}</style>
        {children}
      </div>
    </>
  );
}

export function ModalHeader({ title, onClose, className }: ModalHeaderProps) {
  return (
    <div
      style={{
        padding: "var(--space-6)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      className={className}
    >
      <h2 className="text-subheading">{title}</h2>
      <Button variant="icon" size="sm" aria-label="Close" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M12 4L4 12M4 4l8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </Button>
    </div>
  );
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div style={{ padding: "var(--space-6)" }} className={className}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      style={{
        padding: "var(--space-4) var(--space-6)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "row",
        gap: "var(--space-3)",
        justifyContent: "flex-end",
      }}
      className={className}
    >
      {children}
    </div>
  );
}
