import { createClient } from "@/lib/supabase/server";
import type { Task, Cliente, Project, Lead } from "@/types/database";

export interface TarefaDoDia {
  id: string;
  tipo: "task" | "followup" | "reuniao";
  titulo: string;
  contexto: string | null; // ex: "Cliente: X" ou "Projeto: Y"
  cliente_id: string | null;
  project_id: string | null;
  due_at: string; // ISO
  status?: string;
}

const isHoje = (d: Date) => {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const isAteHoje = (d: Date) => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return d <= end;
};

/**
 * Agrega tarefas + follow-ups + reuniões cujo "vencimento" cai hoje (ou antes, se ainda não feito).
 */
export async function getTarefasDoDia(): Promise<TarefaDoDia[]> {
  const supabase = createClient();
  const out: TarefaDoDia[] = [];

  // 1) Tasks com due_date <= hoje e status != concluido
  const { data: tasks } = await supabase
    .from("siarom_crm_tasks")
    .select("*")
    .neq("status", "concluido")
    .not("due_date", "is", null);
  for (const t of (tasks ?? []) as Task[]) {
    if (!t.due_date) continue;
    const d = new Date(t.due_date);
    if (!isAteHoje(d)) continue;
    out.push({
      id: `task:${t.id}`,
      tipo: "task",
      titulo: t.titulo,
      contexto: t.descricao,
      cliente_id: t.cliente_id,
      project_id: t.project_id,
      due_at: t.due_date,
      status: t.status,
    });
  }

  // 2a) Follow-ups: clientes com proximo_followup_em <= hoje
  const { data: clientes } = await supabase
    .from("siarom_crm_clientes")
    .select("*")
    .not("proximo_followup_em", "is", null);
  for (const c of (clientes ?? []) as Cliente[]) {
    if (!c.proximo_followup_em) continue;
    const d = new Date(c.proximo_followup_em);
    if (!isAteHoje(d)) continue;
    out.push({
      id: `followup:${c.id}`,
      tipo: "followup",
      titulo: `Follow-up com ${c.nome}`,
      contexto: c.observacoes,
      cliente_id: c.id,
      project_id: null,
      due_at: c.proximo_followup_em,
    });
  }

  // 2b) Follow-ups: leads com proximo_followup_em <= hoje
  const { data: leads } = await supabase
    .from("siarom_crm_leads")
    .select("*")
    .not("proximo_followup_em", "is", null);
  for (const l of (leads ?? []) as Lead[]) {
    if (!l.proximo_followup_em) continue;
    const d = new Date(l.proximo_followup_em);
    if (!isAteHoje(d)) continue;
    out.push({
      id: `followup-lead:${l.id}`,
      tipo: "followup",
      titulo: `Follow-up com lead ${l.nome}`,
      contexto: l.observacoes,
      cliente_id: null,
      project_id: null,
      due_at: l.proximo_followup_em,
    });
  }

  // 3) Reuniões: projetos com reuniao_em hoje
  const { data: projetos } = await supabase
    .from("siarom_crm_projects")
    .select("*")
    .not("reuniao_em", "is", null);
  for (const p of (projetos ?? []) as Project[]) {
    if (!p.reuniao_em) continue;
    const d = new Date(p.reuniao_em);
    if (!isHoje(d)) continue;
    out.push({
      id: `reuniao:${p.id}`,
      tipo: "reuniao",
      titulo: `Reunião — ${p.cliente_nome}`,
      contexto: p.descricao_automacao,
      cliente_id: p.cliente_id,
      project_id: p.id,
      due_at: p.reuniao_em,
    });
  }

  return out.sort((a, b) => a.due_at.localeCompare(b.due_at));
}
