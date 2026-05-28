"use client";
import { cn } from "@/lib/format";
import { X, type LucideIcon } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function GlassCard({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cn("card p-5", className)} />;
}

export function GlassButton({
  className, variant = "primary", ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline" }) {
  const styles =
    variant === "primary"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : variant === "outline"
      ? "bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-neutral-800"
      : "bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200";
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
        styles, className
      )}
    />
  );
}

export function GlassInput({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn("w-full", className)} />;
}
export function GlassTextarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cn("w-full min-h-[100px]", className)} />;
}
export function GlassSelect({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cn("w-full", className)} />;
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="text-xs font-medium text-slate-600 dark:text-neutral-300 mb-1 block">{children}</label>;
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "red" | "slate" | "purple" }) {
  const map = {
    blue:   "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    green:  "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    amber:  "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    red:    "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
    slate:  "bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700",
    purple: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium", map[tone])}>{children}</span>;
}

/* Tile colorido (KPI com ícone) */
export function StatTile({ icon: Icon, label, value, hint, tone = "emerald" }: {
  icon: LucideIcon;
  label: string; value: string; hint?: string;
  tone?: "emerald" | "blue" | "violet" | "amber" | "red" | "rose";
}) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue:    "bg-slate-50 text-slate-600",
    violet:  "bg-slate-50 text-slate-600",
    amber:   "bg-slate-50 text-slate-600",
    red:     "bg-slate-50 text-slate-600",
    rose:    "bg-slate-50 text-slate-600",
  };
  return (
    <div className="card p-5">
      <div className={cn("inline-flex items-center justify-center w-9 h-9 rounded-lg", tones[tone])}>
        <Icon size={18} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

/* DRAWER lateral estilo Notion (slide-in da direita) */
export function Drawer({ open, onClose, title, children, widthClass = "w-full md:w-[620px] lg:w-[720px] xl:w-[820px]" }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative h-full bg-white dark:bg-neutral-950 border-l border-slate-200 dark:border-neutral-800 shadow-2xl overflow-y-auto flex flex-col",
          "animate-[slideInRight_.25s_cubic-bezier(.2,.8,.2,1)]",
          widthClass
        )}
        style={{ animationFillMode: "both" }}
      >
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-b border-slate-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <div className="text-base font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-3 min-w-0">{title}</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 hover:text-slate-800 dark:hover:text-neutral-100 transition shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

/* MODAL com backdrop blur */
export function Modal({ open, onClose, title, children, size = "md" }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" }[size];

  return (
    <div className="modal-backdrop flex items-center justify-center p-4" onClick={onClose}>
      <div className={cn("modal-panel card w-full p-6", widths)} onClick={(e) => e.stopPropagation()}>
        {(title || true) && (
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-slate-800 dark:text-neutral-100">{title}</div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-neutral-800 text-slate-500 hover:text-slate-800 dark:hover:text-neutral-100 transition">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
