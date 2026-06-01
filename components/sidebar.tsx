"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Calculator, Briefcase, ListChecks, CalendarDays,
  Users, Settings, LogOut, Target, UserCircle2, FileSignature, Receipt, GraduationCap,
  Menu, X, type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/format";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Role } from "@/types/database";

type Item = { href: string; label: string; icon: LucideIcon };

const nav = (role: Role): Item[] => {
  if (role !== "admin") {
    return [
      { href: "/tarefas", label: "Tarefas", icon: ListChecks },
      { href: "/agenda", label: "Agenda", icon: CalendarDays },
    ];
  }
  return [
    { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/calculadora", label: "Calculadora", icon: Calculator },
    { href: "/leads", label: "Leads", icon: Target },
    { href: "/clientes", label: "Clientes", icon: UserCircle2 },
    { href: "/projetos", label: "Projetos", icon: Briefcase },
    { href: "/mentoria", label: "Mentoria", icon: GraduationCap },
    { href: "/tarefas", label: "Tarefas", icon: ListChecks },
    { href: "/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/contratos", label: "Contratos", icon: FileSignature },
    { href: "/nfes", label: "NFes", icon: Receipt },
    { href: "/admin/usuarios", label: "Usuários", icon: Users },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ];
};

export function Sidebar({ nome, role }: { nome: string; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = nav(role);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha o menu mobile ao navegar
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Trava o scroll do body enquanto o drawer estiver aberto
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sair = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Conteúdo compartilhado entre o sidebar desktop e o drawer mobile
  const content = (
    <>
      <div className="px-2 pb-4 border-b border-slate-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SIAROM" width={42} height={28} priority unoptimized />
          <div>
            <div className="font-semibold text-slate-800 dark:text-neutral-100 leading-tight">SIAROM CRM</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {role === "admin" ? "Administrador" : "Usuário"}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-2">{nome}</div>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-slate-400 px-2 mt-3 mb-1">Menu</div>
      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                active
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium"
                  : "text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900"
              )}
            >
              <Icon size={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 mt-2">
        <button onClick={sair} className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900 transition">
          <LogOut size={18} /> Sair
        </button>
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <>
      {/* Sidebar fixo (desktop) */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-white dark:bg-neutral-950 border-r border-slate-200 dark:border-neutral-800 flex-col gap-1 h-screen sticky top-0 p-4">
        {content}
      </aside>

      {/* Barra superior (mobile) */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center gap-3 px-4 bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-b border-slate-200 dark:border-neutral-800">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition"
        >
          <Menu size={22} />
        </button>
        <Image src="/logo.png" alt="SIAROM" width={34} height={22} priority unoptimized />
        <span className="font-semibold text-slate-800 dark:text-neutral-100">SIAROM CRM</span>
      </header>

      {/* Drawer + overlay (mobile) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-[fadeIn_.15s_ease-out]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[82%] h-full bg-white dark:bg-neutral-950 border-r border-slate-200 dark:border-neutral-800 flex flex-col gap-1 p-4 shadow-2xl animate-[slideInLeft_.25s_cubic-bezier(.2,.8,.2,1)]">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-900 transition"
            >
              <X size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
