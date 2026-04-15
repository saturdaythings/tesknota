"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

interface ToastMsg {
  id: string;
  message: string;
}

interface ToastContextValue {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMsg[]>([]);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const toast = useCallback((message: string) => {
    const id = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setMessages((prev) => [...prev, { id, message }]);
    timerRef.current[id] = setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      delete timerRef.current[id];
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {messages.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[900] flex flex-col gap-2 pointer-events-none">
          {messages.map((m) => (
            <div
              key={m.id}
              className="px-4 py-[10px] bg-[var(--blue3)] text-white font-[var(--mono)] text-xs tracking-[0.06em] shadow-lg animate-fade-in"
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
