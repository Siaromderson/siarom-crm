"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ListChecks, Truck, Beaker, Calendar, Phone, Star, Plus, Repeat } from "lucide-react";
import { GlassCard, GlassButton, GlassInput, GlassSelect, GlassTextarea, Label, Modal, Badge } from "@/components/ui/glass";
import { parseEventoDate, type AgendaEvento, type AgendaTipo, type AgendaTone } from "@/lib/agenda-types";
import { toneChip } from "@/lib/palette";
import { criarEvento, atualizarEvento, deletarEvento } from "@/lib/actions/agenda";
import { AGENDA_EVENTO_TIPOS, AGENDA_RECORRENCIAS, DIAS_SEMANA, type AgendaRecorrencia } from "@/types/database";

type Vista = "dia" | "semana" | "mes";

const MES_NOMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const startOfWeek = (d: Date) => addDays(startOfDay(d), -d.getDay());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function monthGrid(cursor: Date): Date[] {
  const first = startOfMonth(cursor);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const iconByTipo: Record<AgendaTipo, typeof ListChecks> = {
  tarefa: ListChecks,
  entrega: Truck,
  testes_fim: Beaker,
  reuniao: Calendar,
  followup: Phone,
  evento: Star,
};

const toneClass: Record<AgendaTone, string> = {
  blue:   "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  amber:  "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  red:    "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
  green:  "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900",
  slate:  "bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800",
};

const dotClass: Record<AgendaTone, string> = {
  blue: "bg-blue-500", amber: "bg-amber-500", red: "bg-red-500",
  green: "bg-emerald-500", purple: "bg-purple-500", slate: "bg-slate-400",
};

type ModalMode =
  | { kind: "create"; data: string }
  | { kind: "edit"; ev: AgendaEvento };

export function AgendaClient({ eventos }: { eventos: AgendaEvento[] }) {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("mes");
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()));
  const [modal, setModal] = useState<ModalMode | null>(null);

  const porDia = useMemo(() => {
    const map = new Map<string, AgendaEvento[]>();
    for (const ev of eventos) {
      const d = parseEventoDate(ev.data);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.data.localeCompare(b.data));
    return map;
  }, [eventos]);

  const eventosNoDia = (d: Date) => porDia.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];

  const irHoje = () => setCursor(startOfDay(new Date()));
  const nav = (delta: number) => {
    if (vista === "dia") setCursor(addDays(cursor, delta));
    else if (vista === "semana") setCursor(addDays(cursor, delta * 7));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  const abrirCreate = (d: Date) => setModal({ kind: "create", data: toIsoDate(d) });
  const abrirEdit = (ev: AgendaEvento) => setModal({ kind: "edit", ev });

  const tituloPeriodo = (() => {
    if (vista === "mes") return `${MES_NOMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (vista === "semana") {
      const ini = startOfWeek(cursor);
      const fim = addDays(ini, 6);
      const mesmoMes = ini.getMonth() === fim.getMonth();
      const mIni = MES_NOMES[ini.getMonth()].slice(0, 3);
      const mFim = MES_NOMES[fim.getMonth()].slice(0, 3);
      return mesmoMes
        ? `${ini.getDate()}–${fim.getDate()} de ${MES_NOMES[ini.getMonth()]}`
        : `${ini.getDate()} ${mIni} – ${fim.getDate()} ${mFim} ${fim.getFullYear()}`;
    }
    return cursor.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  })();

  const onChipClick = (ev: AgendaEvento) => {
    if (ev.editavel) abrirEdit(ev);
  };

  return (
    <>
      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <GlassButton variant="ghost" onClick={() => nav(-1)} aria-label="Anterior">
              <ChevronLeft size={16} />
            </GlassButton>
            <GlassButton variant="outline" onClick={irHoje}>Hoje</GlassButton>
            <GlassButton variant="ghost" onClick={() => nav(1)} aria-label="Próximo">
              <ChevronRight size={16} />
            </GlassButton>
            <div className="ml-2 text-base font-semibold text-slate-800 dark:text-neutral-100 capitalize">
              {tituloPeriodo}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlassButton onClick={() => abrirCreate(cursor)}>
              <Plus size={14} /> Novo evento
            </GlassButton>
            <div className="flex gap-1 bg-slate-100 dark:bg-neutral-900 rounded-lg p-1">
              {(["dia", "semana", "mes"] as Vista[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVista(v)}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    vista === v
                      ? "bg-white dark:bg-neutral-800 text-emerald-700 dark:text-emerald-300 font-medium shadow-sm"
                      : "text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
                  }`}
                >
                  {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {vista === "mes" && (
          <VistaMes
            cursor={cursor}
            eventosNoDia={eventosNoDia}
            onDayClick={abrirCreate}
            onDayNumberClick={(d) => { setCursor(d); setVista("dia"); }}
            onChipClick={onChipClick}
          />
        )}
        {vista === "semana" && (
          <VistaSemana cursor={cursor} eventosNoDia={eventosNoDia} onHeaderClick={abrirCreate} onChipClick={onChipClick} />
        )}
        {vista === "dia" && <VistaDia eventos={eventosNoDia(cursor)} onChipClick={onChipClick} />}
      </GlassCard>

      <EventoModal
        mode={modal}
        onClose={() => setModal(null)}
        onSaved={() => { setModal(null); router.refresh(); }}
      />
    </>
  );
}

function VistaMes({
  cursor, eventosNoDia, onDayClick, onDayNumberClick, onChipClick,
}: {
  cursor: Date;
  eventosNoDia: (d: Date) => AgendaEvento[];
  onDayClick: (d: Date) => void;
  onDayNumberClick: (d: Date) => void;
  onChipClick: (ev: AgendaEvento) => void;
}) {
  const dias = monthGrid(cursor);
  const hoje = startOfDay(new Date());
  return (
    <div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {DIAS_CURTO.map((d) => (
          <div key={d} className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        {dias.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isHoje = sameDay(d, hoje);
          const evs = eventosNoDia(d);
          const visiveis = evs.slice(0, 3);
          const resto = evs.length - visiveis.length;
          return (
            <div
              key={i}
              onClick={() => onDayClick(d)}
              className={`text-left min-h-[96px] p-1.5 bg-white dark:bg-neutral-950 transition hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 cursor-pointer ${
                inMonth ? "" : "opacity-40"
              }`}
              title="Clique para criar um evento neste dia"
            >
              <div className="flex items-center justify-between mb-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDayNumberClick(d); }}
                  className={`text-xs font-medium hover:opacity-80 ${
                    isHoje ? "bg-emerald-500 text-white rounded-full w-6 h-6 inline-flex items-center justify-center" :
                    "text-slate-700 dark:text-neutral-300 px-1"
                  }`}
                  title="Abrir visão de Dia"
                >
                  {d.getDate()}
                </button>
                {evs.length > 0 && (
                  <span className="text-[10px] text-slate-400">{evs.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {visiveis.map((ev) => (
                  <ChipMini key={ev.id} ev={ev} onClick={onChipClick} />
                ))}
                {resto > 0 && (
                  <div className="text-[10px] text-slate-500 dark:text-neutral-400 px-1">+ {resto} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChipMini({ ev, onClick }: { ev: AgendaEvento; onClick: (ev: AgendaEvento) => void }) {
  const repetindo = ev.recorrencia && ev.recorrencia !== "none";
  const cls = ev.colorTone ? toneChip[ev.colorTone] : toneClass[ev.tone];
  const inner = (
    <div className={`text-[11px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${cls}`}>
      {ev.hasTime && <span className="font-mono opacity-80">{fmtHora(ev.data)}</span>}
      {repetindo && <Repeat size={9} className="opacity-70 shrink-0" />}
      <span className="truncate">{ev.titulo}</span>
    </div>
  );
  if (ev.editavel) {
    return (
      <button type="button" className="w-full text-left" onClick={(e) => { e.stopPropagation(); onClick(ev); }}>
        {inner}
      </button>
    );
  }
  if (ev.href) {
    return (
      <Link href={ev.href} onClick={(e) => e.stopPropagation()}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function VistaSemana({
  cursor, eventosNoDia, onHeaderClick, onChipClick,
}: {
  cursor: Date;
  eventosNoDia: (d: Date) => AgendaEvento[];
  onHeaderClick: (d: Date) => void;
  onChipClick: (ev: AgendaEvento) => void;
}) {
  const ini = startOfWeek(cursor);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(ini, i));
  const hoje = startOfDay(new Date());
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {dias.map((d) => {
        const evs = eventosNoDia(d);
        const isHoje = sameDay(d, hoje);
        return (
          <div key={d.toISOString()} className={`rounded-lg border p-2 min-h-[180px] ${
            isHoje
              ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20"
              : "border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
          }`}>
            <button
              type="button"
              onClick={() => onHeaderClick(d)}
              className="w-full flex items-baseline justify-between mb-2 pb-1 border-b border-slate-100 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900 rounded px-1"
              title="Clique para criar um evento"
            >
              <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400">{DIAS_CURTO[d.getDay()]}</div>
              <div className={`text-sm font-semibold ${isHoje ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-neutral-200"}`}>
                {d.getDate()}/{String(d.getMonth() + 1).padStart(2, "0")}
              </div>
            </button>
            <div className="space-y-1.5">
              {evs.length === 0 && (
                <div className="text-[11px] text-slate-300 dark:text-neutral-600 text-center py-3">—</div>
              )}
              {evs.map((ev) => <EventoChip key={ev.id} ev={ev} compacto onClick={onChipClick} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VistaDia({ eventos, onChipClick }: { eventos: AgendaEvento[]; onChipClick: (ev: AgendaEvento) => void }) {
  const allDay = eventos.filter((e) => !e.hasTime);
  const timed = eventos.filter((e) => e.hasTime);
  return (
    <div className="space-y-3">
      {allDay.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">Dia todo</div>
          <div className="space-y-1.5">
            {allDay.map((ev) => <EventoChip key={ev.id} ev={ev} onClick={onChipClick} />)}
          </div>
        </div>
      )}
      {timed.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">Agendado</div>
          <div className="space-y-1.5">
            {timed.map((ev) => <EventoChip key={ev.id} ev={ev} onClick={onChipClick} />)}
          </div>
        </div>
      )}
      {eventos.length === 0 && (
        <div className="text-sm text-slate-400 text-center py-10 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
          Nenhum evento neste dia.
        </div>
      )}
    </div>
  );
}

function EventoChip({ ev, compacto = false, onClick }: {
  ev: AgendaEvento; compacto?: boolean; onClick: (ev: AgendaEvento) => void;
}) {
  const Icon = iconByTipo[ev.tipo];
  const repetindo = ev.recorrencia && ev.recorrencia !== "none";
  const cls = ev.colorTone ? toneChip[ev.colorTone] : toneClass[ev.tone];
  const inner = (
    <div className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 transition hover:shadow-sm ${cls}`}>
      <Icon size={compacto ? 12 : 14} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className={`${compacto ? "text-[11px]" : "text-sm"} font-medium truncate flex items-center gap-1`}>
          <span className="truncate">{ev.titulo}</span>
          {repetindo && <Repeat size={compacto ? 9 : 11} className="opacity-70 shrink-0" />}
        </div>
        <div className={`flex items-center gap-2 ${compacto ? "text-[10px]" : "text-xs"} opacity-80 mt-0.5`}>
          {ev.hasTime && <span className="font-mono">{fmtHora(ev.data)}</span>}
          {ev.contexto && <span className="truncate">· {ev.contexto}</span>}
          {ev.prioridade && !compacto && <Badge tone={ev.tone === "red" ? "red" : ev.tone === "amber" ? "amber" : "blue"}>{ev.prioridade}</Badge>}
        </div>
      </div>
      <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${dotClass[ev.tone]}`} />
    </div>
  );
  if (ev.editavel) {
    return (
      <button type="button" className="w-full text-left" onClick={() => onClick(ev)}>
        {inner}
      </button>
    );
  }
  if (ev.href) return <Link href={ev.href}>{inner}</Link>;
  return inner;
}

function EventoModal({ mode, onClose, onSaved }: {
  mode: ModalMode | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [recorrencia, setRecorrencia] = useState<AgendaRecorrencia>("none");
  const [diasSemana, setDiasSemana] = useState<Set<number>>(new Set());

  const isEdit = mode?.kind === "edit";
  const ev = mode?.kind === "edit" ? mode.ev : null;
  const dataInicial = mode?.kind === "create" ? mode.data : ev ? ev.data.slice(0, 10) : "";
  const horaInicial = ev?.hasTime ? fmtHora(ev.data) : "";
  const tipoInicial = ev?.eventoTipo ?? "outro";
  const ateInicial = ev?.recorrenciaAte ?? "";

  useEffect(() => {
    if (!mode) return;
    if (mode.kind === "edit") {
      setRecorrencia(mode.ev.recorrencia ?? "none");
      setDiasSemana(new Set(mode.ev.diasSemana ?? []));
    } else {
      setRecorrencia("none");
      setDiasSemana(new Set());
    }
    setErro(null);
  }, [mode]);

  const toggleDia = (id: number) => {
    setDiasSemana((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = isEdit && ev?.eventoDbId
        ? await atualizarEvento(ev.eventoDbId, fd)
        : await criarEvento(fd);
      if (r?.error) { setErro(r.error); return; }
      onSaved();
    });
  };

  const excluir = () => {
    if (!ev?.eventoDbId) return;
    if (!confirm("Excluir este evento?")) return;
    start(async () => {
      const r = await deletarEvento(ev.eventoDbId!);
      if (r?.error) { setErro(r.error); return; }
      onSaved();
    });
  };

  const titulo = isEdit ? "Editar evento" : "Novo evento";

  return (
    <Modal open={!!mode} onClose={onClose} title={titulo} size="md">
      {mode && (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <GlassInput id="titulo" name="titulo" defaultValue={ev?.titulo ?? ""} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <GlassSelect id="tipo" name="tipo" defaultValue={tipoInicial}>
                {AGENDA_EVENTO_TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </GlassSelect>
            </div>
            <div>
              <Label htmlFor="data">Data</Label>
              <GlassInput id="data" name="data" type="date" defaultValue={dataInicial} required />
            </div>
          </div>
          <div>
            <Label htmlFor="hora">Hora (opcional — vazio = dia todo)</Label>
            <GlassInput id="hora" name="hora" type="time" defaultValue={horaInicial} />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <GlassTextarea id="descricao" name="descricao" defaultValue={ev?.descricao ?? ""} rows={3} />
          </div>

          <div className="border-t border-slate-100 dark:border-neutral-800 pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="recorrencia">Repetir</Label>
                <GlassSelect
                  id="recorrencia"
                  name="recorrencia"
                  value={recorrencia}
                  onChange={(e) => setRecorrencia(e.target.value as AgendaRecorrencia)}
                >
                  {AGENDA_RECORRENCIAS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </GlassSelect>
              </div>
              {recorrencia !== "none" && (
                <div>
                  <Label htmlFor="recorrencia_ate">Termina em (opcional)</Label>
                  <GlassInput id="recorrencia_ate" name="recorrencia_ate" type="date" defaultValue={ateInicial} />
                </div>
              )}
            </div>
            {recorrencia === "weekly" && (
              <div>
                <Label>Dias da semana</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {DIAS_SEMANA.map((d) => {
                    const ativo = diasSemana.has(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleDia(d.id)}
                        className={`w-9 h-9 rounded-full border text-xs font-medium transition ${
                          ativo
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-emerald-300"
                        }`}
                        title={d.label}
                      >
                        {d.short}
                      </button>
                    );
                  })}
                </div>
                {Array.from(diasSemana).map((id) => (
                  <input key={id} type="hidden" name="recorrencia_dias_semana" value={id} />
                ))}
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Vazio = usa o dia da semana da data inicial.
                </p>
              </div>
            )}
          </div>

          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}

          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <GlassButton type="submit" disabled={pending}>
              {pending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </GlassButton>
            <GlassButton type="button" variant="ghost" onClick={onClose}>Cancelar</GlassButton>
            <div className="flex-1" />
            {isEdit && (
              <GlassButton type="button" variant="danger" onClick={excluir} disabled={pending}>
                Excluir
              </GlassButton>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
