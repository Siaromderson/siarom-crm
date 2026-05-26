"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calculator, Briefcase, KanbanSquare, ListChecks, Users, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/format";
import type { Role } from "@/types/database";

const nav = (role: Role) => {
  const base = [
    { href: "/calculadora", label: "Calculadora", icon: Calculator },
    { href: "/projetos", label: "Projetos", icon: Briefcase },
    { href: "/kanban", label: "Kanban", icon: KanbanSquare },
    { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  ];
  if (role === "admin") {
    return [
      { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
      ...base,
      { href: "/admin/usuarios", label: "Usuários", icon: Users },
      { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
    ];
  }
  return base;
};

export function Sidebar({ nome, role }: { nome: string; role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = nav(role);

  const sair = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col gap-1 h-screen sticky top-0 p-4">
      <div className="px-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SIAROM" width={42} height={28} priority />
          <div>
            <div className="font-semibold text-slate-800 leading-tight">SIAROM CRM</div>
            <div className="text-[11px] text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {role === "admin" ? "Administrador" : "Usuário"}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">{nome}</div>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-slate-400 px-2 mt-3 mb-1">Menu</div>
      <nav className="flex-1 flex flex-col gap-0.5">
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
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon size={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <button onClick={sair} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition">
        <LogOut size={18} /> Sair
      </button>
    </aside>
  );
}
