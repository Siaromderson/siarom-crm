"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type ToastTone = "error" | "success";
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  error: (message: string) => void;
  success: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = ++seq.current;
    setToasts((list) => [...list, { id, tone, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const api: ToastApi = {
    error: (m) => push("error", m),
    success: (m) => push("success", m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)]">
        {toasts.map((t) => {
          const Icon = t.tone === "error" ? AlertTriangle : CheckCircle2;
          const tone =
            t.tone === "error"
              ? "border-red-300 dark:border-red-800/60 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200"
              : "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200";
          return (
            <div
              key={t.id}
              role="status"
              className={`toast-enter flex items-start gap-2 px-3 py-2 rounded-lg border shadow-sm text-sm ${tone}`}
            >
              <Icon size={16} className="shrink-0 mt-0.5" />
              <span className="flex-1 min-w-0">{t.message}</span>
              <button type="button" onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
