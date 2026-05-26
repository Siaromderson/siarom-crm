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
  { id: "implementacao", label: "Implementação" },
  { id: "finalizado", label: "Finalizado" },
  { id: "fase_testes", label: "Fase de testes (7 dias)" },
  { id: "aguardando_pagamento_final", label: "Aguardando pagamento final" },
  { id: "pagamento_final", label: "Pagamento final recebido" },
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
  site_url: string | null;
  telefone: string | null;
  descricao_automacao: string | null;
  reuniao_em: string | null;
  valor_total: number;
  taxa_comissao: number;
  taxa_imposto: number;
  valor_comissao: number;
  valor_imposto: number;
  valor_lucro: number;
  kanban_stage: KanbanStage;
  owner_id: string;
  created_at: string;
  closed_at: string | null;
}

export interface Task {
  id: string;
  project_id: string | null;
  titulo: string;
  descricao: string | null;
  status: TaskStatus;
  prioridade: Prioridade;
  assignee_id: string | null;
  due_date: string | null;
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
