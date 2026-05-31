"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { AgendaEventoTipo, AgendaRecorrencia } from "@/types/database";

const TIPOS_VALIDOS: AgendaEventoTipo[] = ["reuniao", "tarefa", "lembrete", "outro"];
const RECORRENCIAS_VALIDAS: AgendaRecorrencia[] = ["none", "daily", "weekly", "monthly", "yearly"];

function parsePayload(formData: FormData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const tipoRaw = String(formData.get("tipo") || "outro") as AgendaEventoTipo;
  const tipo: AgendaEventoTipo = TIPOS_VALIDOS.includes(tipoRaw) ? tipoRaw : "outro";
  const data = String(formData.get("data") || "").trim();              // "yyyy-mm-dd"
  const horaRaw = String(formData.get("hora") || "").trim();           // "" ou "HH:mm"
  const hora = horaRaw ? `${horaRaw}:00` : null;

  const recRaw = String(formData.get("recorrencia") || "none") as AgendaRecorrencia;
  const recorrencia: AgendaRecorrencia = RECORRENCIAS_VALIDAS.includes(recRaw) ? recRaw : "none";
  const ateRaw = String(formData.get("recorrencia_ate") || "").trim();
  const recorrencia_ate = ateRaw || null;
  let recorrencia_dias_semana: number[] | null = null;
  if (recorrencia === "weekly") {
    const dias = formData.getAll("recorrencia_dias_semana")
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    recorrencia_dias_semana = dias.length ? Array.from(new Set(dias)).sort() : null;
  }
  return { titulo, descricao, tipo, data, hora, recorrencia, recorrencia_dias_semana, recorrencia_ate };
}

export async function criarEvento(formData: FormData) {
  const { profile } = await requireSession();
  const payload = parsePayload(formData);
  if (!payload.titulo) return { error: "Título obrigatório." };
  if (!payload.data) return { error: "Data obrigatória." };
  const supabase = createClient();
  const { error } = await supabase
    .from("siarom_crm_agenda_events")
    .insert({ ...payload, owner_id: profile.id });
  if (error) return { error: error.message };
  revalidatePath("/agenda");
  return { ok: true };
}

export async function atualizarEvento(id: string, formData: FormData) {
  await requireSession();
  const payload = parsePayload(formData);
  if (!payload.titulo) return { error: "Título obrigatório." };
  if (!payload.data) return { error: "Data obrigatória." };
  const supabase = createClient();
  const { error } = await supabase
    .from("siarom_crm_agenda_events")
    .update(payload)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/agenda");
  return { ok: true };
}

export async function deletarEvento(id: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase.from("siarom_crm_agenda_events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/agenda");
  return { ok: true };
}
