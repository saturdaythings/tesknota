"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

type ToastVariant = "default" | "success" | "error";

interface ToastMsg {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyle: Record<ToastVariant, React.CSSProperties> = {
  default: {},
  success: { borderLeft: "3px solid var(--color-success)" },
  error: { borderLeft: "3px solid var(--color-danger)" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMsg[]>([]);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const toast = useCallback((message: string, variant: ToastVariant = "default") => {
    const id =
      "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setMessages((prev) => [...prev, { id, message, variant }]);
    timerRef.current[id] = setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      delete timerRef.current[id];
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {messages.length > 0 && (
        <div
          role="region"
          aria-live="polite"
          aria-label="Notifications"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: "var(--z-toast)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            pointerEvents: "none",
          }}
          className="sm:bottom-5 sm:right-5 max-sm:bottom-4 max-sm:right-4 max-sm:left-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              role="status"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-lg)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 16px",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-primary)",
                maxWidth: "360px",
                ...variantStyle[m.variant],
              }}
            >
              {m.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
