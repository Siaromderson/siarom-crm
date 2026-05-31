export type Role = "admin" | "user";

export type KanbanStage =
  // funil de vendas
  | "reuniao_agendada"
  | "geracao_proposta"
  | "proposta_enviada"
  | "geracao_contrato"
  | "contrato_assinado"
  | "pagamento_entrada"
  // funil de pós-venda
  | "kickoff"
  | "implementacao"
  | "finalizado"
  | "fase_testes"
  | "aguardando_pagamento_final"
  | "pagamento_final"
  // descartados
  | "no_show"
  | "desqualificado"
  | "perdido";

export type Funil = "vendas" | "pos_venda";

export const VENDAS_STAGES: { id: KanbanStage; label: string }[] = [
  { id: "reuniao_agendada", label: "Reunião agendada" },
  { id: "geracao_proposta", label: "Geração de proposta" },
  { id: "proposta_enviada", label: "Proposta enviada" },
  { id: "geracao_contrato", label: "Geração de contrato" },
  { id: "contrato_assinado", label: "Contrato assinado" },
  { id: "pagamento_entrada", label: "Pagamento de entrada (50%)" },
  // descartes — fim do funil de vendas
  { id: "no_show",        label: "No-show (não compareceu)" },
  { id: "desqualificado", label: "Lead desqualificado" },
  { id: "perdido",        label: "Lead perdido" },
];

export const POS_VENDA_STAGES: { id: KanbanStage; label: string }[] = [
  { id: "kickoff", label: "Kickoff" },
  { id: "implementacao", label: "Implementação" },
  { id: "finalizado", label: "Finalizado" },
  { id: "fase_testes", label: "Fase de testes" },
  { id: "aguardando_pagamento_final", label: "Aguardando pagamento final" },
  { id: "pagamento_final", label: "Pagamento final recebido" },
];

/** Funil único dos PROJETOS (vai dentro da página /projetos). Sem reunião e sem descartes. */
export const PROJETO_FUNIL_STAGES: { id: KanbanStage; label: string }[] = [
  { id: "geracao_proposta", label: "Geração de proposta" },
  { id: "proposta_enviada", label: "Proposta enviada" },
  { id: "geracao_contrato", label: "Geração de contrato" },
  { id: "contrato_assinado", label: "Contrato assinado" },
  { id: "pagamento_entrada", label: "Pagamento de entrada (50%)" },
  { id: "kickoff", label: "Kickoff" },
  { id: "implementacao", label: "Implementação" },
  { id: "finalizado", label: "Finalizado" },
  { id: "fase_testes", label: "Fase de testes" },
  { id: "aguardando_pagamento_final", label: "Aguardando pagamento final" },
  { id: "pagamento_final", label: "Pagamento final recebido" },
];

/** Funil de LEADS (separado, antes do projeto). */
export const LEAD_STAGES: { id: KanbanStage; label: string }[] = [
  { id: "reuniao_agendada", label: "Reunião agendada" },
  { id: "geracao_proposta", label: "Geração de proposta" },
  { id: "proposta_enviada", label: "Proposta enviada" },
  { id: "geracao_contrato", label: "Geração de contrato" },
  { id: "contrato_assinado", label: "Contrato assinado" },
  { id: "pagamento_entrada", label: "Pagamento de entrada (50%)" },
  { id: "no_show", label: "No-show (não compareceu)" },
  { id: "desqualificado", label: "Lead desqualificado" },
  { id: "perdido", label: "Lead perdido" },
];

/** Mantida só para identificar descartes nos KPIs e cálculo de pipeline. */
export const DESCARTE_IDS: KanbanStage[] = ["no_show", "desqualificado", "perdido"];

export const KANBAN_STAGES = [...VENDAS_STAGES, ...POS_VENDA_STAGES];

export const FUNIL_DE = (s: KanbanStage): Funil =>
  POS_VENDA_STAGES.some((x) => x.id === s) ? "pos_venda" : "vendas";

export const isDescartado = (s: KanbanStage) => DESCARTE_IDS.includes(s);

export const FUNIS: { id: Funil; label: string }[] = [
  { id: "vendas",    label: "Funil de Vendas" },
  { id: "pos_venda", label: "Pós-venda" },
];

export const stagesDoFunil = (f: Funil) => f === "vendas" ? VENDAS_STAGES : POS_VENDA_STAGES;

export type TaskStatus = "a_fazer" | "em_andamento" | "testar" | "validar" | "concluido";
export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "a_fazer", label: "A fazer" },
  { id: "em_andamento", label: "Em andamento" },
  { id: "testar", label: "Testar" },
  { id: "validar", label: "Validar" },
  { id: "concluido", label: "Concluído" },
];

export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export type ItemTipo = "credencial" | "anotacao" | "link" | "arquivo";
export const ITEM_TIPOS: { id: ItemTipo; label: string }[] = [
  { id: "credencial", label: "Credencial" },
  { id: "anotacao", label: "Anotação" },
  { id: "link", label: "Link" },
  { id: "arquivo", label: "Arquivo" },
];

export interface Profile {
  id: string; nome: string; email: string; role: Role; ativo: boolean; created_at: string;
}

export interface Project {
  id: string;
  cliente_nome: string;
  cliente_id: string | null;
  site_url: string | null;
  telefone: string | null;
  descricao_automacao: string | null;
  reuniao_em: string | null;
  testes_iniciado_em: string | null;
  testes_dias_total: number | null;
  valor_total: number;
  taxa_comissao: number;
  taxa_imposto: number;
  valor_comissao: number;
  valor_imposto: number;
  valor_lucro: number;
  kanban_stage: KanbanStage;
  prazo_entrega: string | null;
  owner_id: string;
  created_at: string;
  closed_at: string | null;
}

export type TaskTipo = "manual" | "followup";

export interface Task {
  id: string;
  project_id: string | null;
  cliente_id: string | null;
  titulo: string;
  descricao: string | null;
  status: TaskStatus;
  prioridade: Prioridade;
  tipo: TaskTipo;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  site: string | null;
  descricao: string | null;
  valor_estimado: number;
  kanban_stage: KanbanStage;
  reuniao_em: string | null;
  origem: string | null;
  observacoes: string | null;
  owner_id: string;
  cliente_id: string | null;
  convertido_em: string | null;
  proximo_followup_em: string | null;
  ultima_interacao_em: string | null;
  created_at: string;
}

export type ClienteTipo = "siaromai" | "mentorado";

export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  site: string | null;
  observacoes: string | null;
  tipo: ClienteTipo;
  proximo_followup_em: string | null;
  ultima_interacao_em: string | null;
  owner_id: string;
  created_at: string;
}

export interface Mentoria {
  id: string;
  mentorado_id: string | null;
  mentorado_nome: string;
  plano: string | null;
  valor_total: number;
  taxa_imposto: number;
  horas_contratadas: number;
  observacoes: string | null;
  owner_id: string;
  created_at: string;
}

export interface MentoriaAula {
  id: string;
  mentoria_id: string;
  data: string;
  duracao_horas: number;
  descricao: string | null;
  created_at: string;
}

export type ChecklistKey =
  | "contrato_assinado"
  | "entrada_50_recebida"
  | "nf_entrada_emitida"
  | "acesso_credenciais_recebidas"
  | "kickoff_realizado"
  | "entrega_homologacao"
  | "nf_final_emitida"
  | "pagamento_final_recebido";

export const CHECKLIST_KEYS: { id: ChecklistKey; label: string; short: string }[] = [
  { id: "contrato_assinado",            label: "Contrato assinado",            short: "Contrato" },
  { id: "entrada_50_recebida",          label: "Entrada 50% recebida",         short: "Entrada" },
  { id: "nf_entrada_emitida",           label: "NF da entrada emitida",        short: "NF entrada" },
  { id: "acesso_credenciais_recebidas", label: "Acessos/credenciais recebidos", short: "Credenciais" },
  { id: "kickoff_realizado",            label: "Kickoff realizado",            short: "Kickoff" },
  { id: "entrega_homologacao",          label: "Entrega em homologação",       short: "Entrega" },
  { id: "nf_final_emitida",             label: "NF final emitida",             short: "NF final" },
  { id: "pagamento_final_recebido",     label: "Pagamento final recebido",     short: "Pagto final" },
];

export interface ChecklistItem {
  project_id: string;
  key: ChecklistKey;
  done: boolean;
  done_at: string;
  done_by: string | null;
}

export type FileOwnerType = "projeto" | "cliente" | "tarefa";
export type FileCategoria = "contrato" | "nfe" | "proposta" | "outro";

export const FILE_CATEGORIAS: { id: FileCategoria; label: string }[] = [
  { id: "contrato", label: "Contrato" },
  { id: "nfe",      label: "Nota Fiscal" },
  { id: "proposta", label: "Proposta" },
  { id: "outro",    label: "Outro" },
];

export interface ProjectFile {
  id: string;
  owner_type: FileOwnerType;
  owner_id: string;
  categoria: FileCategoria;
  nome: string;
  mime: string | null;
  size_bytes: number | null;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface ProjectItem {
  id: string;
  project_id: string;
  tipo: ItemTipo;
  titulo: string;        // nome da ferramenta (credencial) ou título genérico
  conteudo: string | null;
  email: string | null;
  senha: string | null;
  link: string | null;
  created_at: string;
}

export interface AppDefaults { comissao: number; imposto: number; }

export type AgendaEventoTipo = "reuniao" | "tarefa" | "lembrete" | "outro";
export const AGENDA_EVENTO_TIPOS: { id: AgendaEventoTipo; label: string }[] = [
  { id: "reuniao",  label: "Reunião" },
  { id: "tarefa",   label: "Tarefa" },
  { id: "lembrete", label: "Lembrete" },
  { id: "outro",    label: "Outro" },
];

export type AgendaRecorrencia = "none" | "daily" | "weekly" | "monthly" | "yearly";
export const AGENDA_RECORRENCIAS: { id: AgendaRecorrencia; label: string }[] = [
  { id: "none",    label: "Não se repete" },
  { id: "daily",   label: "Todos os dias" },
  { id: "weekly",  label: "Semanalmente" },
  { id: "monthly", label: "Mensalmente" },
  { id: "yearly",  label: "Anualmente" },
];

export const DIAS_SEMANA: { id: number; label: string; short: string }[] = [
  { id: 0, label: "Domingo",       short: "D" },
  { id: 1, label: "Segunda-feira", short: "S" },
  { id: 2, label: "Terça-feira",   short: "T" },
  { id: 3, label: "Quarta-feira",  short: "Q" },
  { id: 4, label: "Quinta-feira",  short: "Q" },
  { id: 5, label: "Sexta-feira",   short: "S" },
  { id: 6, label: "Sábado",        short: "S" },
];

export interface AgendaEventDb {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: AgendaEventoTipo;
  data: string;        // "yyyy-mm-dd"
  hora: string | null; // "HH:mm:ss" ou null
  recorrencia: AgendaRecorrencia;
  recorrencia_dias_semana: number[] | null;
  recorrencia_ate: string | null; // "yyyy-mm-dd"
  owner_id: string;
  created_at: string;
}
