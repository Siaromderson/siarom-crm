import { createClient } from "@/lib/supabase/server";
import type { AgendaEventDb, Cliente, Lead, Project, Task } from "@/types/database";
import { parseEventoDate, type AgendaEvento, type AgendaTone } from "@/lib/agenda-types";
import { getCategoriaCores } from "@/lib/actions/settings";

const EVENTO_TONE: Record<AgendaEventDb["tipo"], AgendaTone> = {
  reuniao: "purple",
  tarefa: "blue",
  lembrete: "amber",
  outro: "slate",
};

export async function getAgendaEventos(opts: { roleAdmin: boolean; userId: string }): Promise<AgendaEvento[]> {
  const supabase = createClient();
  const out: AgendaEvento[] = [];
  const categoriaCores = await getCategoriaCores();

  let taskQ = supabase
    .from("siarom_crm_tasks")
    .select("*")
    .not("due_date", "is", null)
    .neq("status", "concluido");
  if (!opts.roleAdmin) taskQ = taskQ.eq("assignee_id", opts.userId);
  const { data: tasks } = await taskQ;

  const { data: projetos } = await supabase.from("siarom_crm_projects").select("*");
  const projMap = new Map<string, string>(
    (projetos ?? []).map((p) => [p.id as string, p.cliente_nome as string])
  );

  for (const t of (tasks ?? []) as Task[]) {
    if (!t.due_date) continue;
    out.push({
      id: `tarefa:${t.id}`,
      tipo: "tarefa",
      data: t.due_date,
      hasTime: t.due_date.includes("T"),
      titulo: t.titulo,
      contexto: t.project_id ? projMap.get(t.project_id) ?? null : null,
      tone: t.prioridade === "urgente" ? "red" : t.prioridade === "alta" ? "amber" : "blue",
      colorTone: categoriaCores[t.categoria] ?? undefined,
      href: "/tarefas",
      prioridade: t.prioridade,
      status: t.status,
    });
  }

  for (const p of (projetos ?? []) as Project[]) {
    if (p.prazo_entrega) {
      out.push({
        id: `entrega:${p.id}`,
        tipo: "entrega",
        data: p.prazo_entrega,
        hasTime: p.prazo_entrega.includes("T"),
        titulo: `Entrega: ${p.cliente_nome}`,
        contexto: p.descricao_automacao,
        tone: "red",
        href: `/projetos?open=${p.id}`,
      });
    }
    if (p.kanban_stage === "fase_testes" && p.testes_iniciado_em && p.testes_dias_total) {
      const start = parseEventoDate(p.testes_iniciado_em);
      const end = new Date(start);
      end.setDate(end.getDate() + p.testes_dias_total);
      const yyyy = end.getFullYear();
      const mm = String(end.getMonth() + 1).padStart(2, "0");
      const dd = String(end.getDate()).padStart(2, "0");
      out.push({
        id: `testes:${p.id}`,
        tipo: "testes_fim",
        data: `${yyyy}-${mm}-${dd}`,
        hasTime: false,
        titulo: `Fim dos testes: ${p.cliente_nome}`,
        contexto: null,
        tone: "amber",
        href: `/projetos?open=${p.id}`,
      });
    }
    if (p.reuniao_em) {
      out.push({
        id: `reuniao-proj:${p.id}`,
        tipo: "reuniao",
        data: p.reuniao_em,
        hasTime: true,
        titulo: `Reunião: ${p.cliente_nome}`,
        contexto: p.descricao_automacao,
        tone: "purple",
        href: `/projetos?open=${p.id}`,
      });
    }
  }

  const { data: clientes } = await supabase
    .from("siarom_crm_clientes")
    .select("*")
    .not("proximo_followup_em", "is", null);
  for (const c of (clientes ?? []) as Cliente[]) {
    if (!c.proximo_followup_em) continue;
    out.push({
      id: `followup-cli:${c.id}`,
      tipo: "followup",
      data: c.proximo_followup_em,
      hasTime: true,
      titulo: `Follow-up: ${c.nome}`,
      contexto: null,
      tone: "amber",
      href: "/clientes",
    });
  }

  const { data: leads } = await supabase.from("siarom_crm_leads").select("*");
  for (const l of (leads ?? []) as Lead[]) {
    if (l.proximo_followup_em) {
      out.push({
        id: `followup-lead:${l.id}`,
        tipo: "followup",
        data: l.proximo_followup_em,
        hasTime: true,
        titulo: `Follow-up lead: ${l.nome}`,
        contexto: null,
        tone: "green",
        href: "/leads",
      });
    }
    if (l.reuniao_em) {
      out.push({
        id: `reuniao-lead:${l.id}`,
        tipo: "reuniao",
        data: l.reuniao_em,
        hasTime: true,
        titulo: `Reunião lead: ${l.nome}`,
        contexto: null,
        tone: "purple",
        href: "/leads",
      });
    }
  }

  let evQ = supabase.from("siarom_crm_agenda_events").select("*");
  if (!opts.roleAdmin) evQ = evQ.eq("owner_id", opts.userId);
  const { data: eventos } = await evQ;

  const hoje = new Date();
  const janelaInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
  const janelaFim = new Date(hoje.getFullYear() + 1, hoje.getMonth() + 1, 0);

  for (const ev of (eventos ?? []) as AgendaEventDb[]) {
    const datas = expandirOcorrencias(ev, janelaInicio, janelaFim);
    const hasTime = !!ev.hora;
    for (const d of datas) {
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dataIso = hasTime ? `${isoDate}T${ev.hora}` : isoDate;
      out.push({
        id: `evento:${ev.id}:${isoDate}`,
        tipo: "evento",
        data: dataIso,
        hasTime,
        titulo: ev.titulo,
        contexto: ev.descricao,
        tone: EVENTO_TONE[ev.tipo],
        href: null,
        editavel: true,
        eventoDbId: ev.id,
        descricao: ev.descricao,
        eventoTipo: ev.tipo,
        recorrencia: ev.recorrencia,
        diasSemana: ev.recorrencia_dias_semana,
        recorrenciaAte: ev.recorrencia_ate,
      });
    }
  }

  return out.sort((a, b) => a.data.localeCompare(b.data));
}

function expandirOcorrencias(ev: AgendaEventDb, janelaInicio: Date, janelaFim: Date): Date[] {
  const anchor = parseEventoDate(ev.data);
  const limite = ev.recorrencia_ate ? parseEventoDate(ev.recorrencia_ate) : janelaFim;
  const fim = limite < janelaFim ? limite : janelaFim;
  const inicio = anchor > janelaInicio ? anchor : janelaInicio;
  const out: Date[] = [];

  if (ev.recorrencia === "none" || !ev.recorrencia) {
    if (anchor >= janelaInicio && anchor <= fim) out.push(anchor);
    return out;
  }

  if (ev.recorrencia === "daily") {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    while (d <= fim) { out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  }

  if (ev.recorrencia === "weekly") {
    const dias = ev.recorrencia_dias_semana && ev.recorrencia_dias_semana.length
      ? new Set(ev.recorrencia_dias_semana)
      : new Set([anchor.getDay()]);
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    while (d <= fim) {
      if (d >= anchor && dias.has(d.getDay())) out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  if (ev.recorrencia === "monthly") {
    const d = new Date(anchor);
    while (d <= fim) {
      if (d >= janelaInicio) out.push(new Date(d));
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }

  if (ev.recorrencia === "yearly") {
    const d = new Date(anchor);
    while (d <= fim) {
      if (d >= janelaInicio) out.push(new Date(d));
      d.setFullYear(d.getFullYear() + 1);
    }
    return out;
  }

  return out;
}
