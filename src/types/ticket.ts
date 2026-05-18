export type Priority = "baixa" | "media" | "alta" | "urgente";
export type Status = "nova_demanda" | "em_analise" | "aguardando_retorno" | "aguardando_xp" | "concluida" | "cancelada";
export type UserRole = "assessor" | "atendente" | "gestor";

export type UserCargo =
  | "gestor"
  | "atendente_senior"
  | "atendente_pleno"
  | "atendente_junior"
  | "atendente_treinamento"
  | "mesa_rv"
  | "mesa_rf"
  | "assessor";

export type Category = string;

export type DemandType = "normal" | "socorro" | "back";

export type Area = "backoffice" | "rv" | "rf" | "seguros" | "credito" | "pj";

export interface UserRatingEntry {
  ticketId: string;
  score: number;
  comment: string;
  ratedBy: string;
  ratedByName: string;
  date: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cargos: UserCargo[];
  xpCode?: string;
  area?: Area;
  rating?: number;
  avatar?: string;
  ratingsReceived?: UserRatingEntry[];
  active: boolean;
  birthDate?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  content: string;
  attachments?: string[];
  isInternal?: boolean;
  createdAt: Date;
}

export interface StatusChange {
  id: string;
  ticketId: string;
  fromStatus: Status | null;
  toStatus: Status;
  changedBy: string;
  changedByName?: string;
  changedAt: Date;
}

export interface TicketNotification {
  id: string;
  ticketId: string;
  ticketTitle: string;
  type: "status_change" | "new_comment" | "assigned" | "rating_change" | "goal_reached" | "mia_message";
  message: string;
  createdAt: Date;
  read: boolean;
}

export interface Ticket {
  id: string;
  code?: string;
  title: string;
  description: string;
  category: Category;
  demandType: DemandType;
  status: Status;
  priority: Priority;
  clientCode: string;
  clientPL: string;
  extraData?: Record<string, any>;
  createdBy: string;
  createdByName: string;
  assignees: string[];
  assigneeNames: string[];
  attendants?: string[];
  attendantNames?: string[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  linkedTickets?: string[];
  messages: TicketMessage[];
  statusHistory: StatusChange[];
  rating?: number;
  ratingJustification?: string;
  hasUnreadUpdate?: boolean;
  pendingRating?: boolean;
}

export const STATUS_LABELS: Record<Status, string> = {
  nova_demanda: "Nova Demanda",
  em_analise: "Em Análise",
  aguardando_retorno: "Aguardando Retorno",
  aguardando_xp: "Aguardando XP",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const CATEGORY_LABELS: Record<string, string> = {
  abertura_conta: "Abertura de Conta",
  atualizacao_cadastral: "Atualização Cadastral",
  portabilidade: "Portabilidade de Investimentos",
  renda_variavel: "Renda Variável",
  renda_fixa: "Renda Fixa",
  seguros: "Seguros",
  credito: "Crédito",
  pj: "PJ",
  problema_tecnico: "Problema Técnico",
  outro: "Outro",
};

export const CARGO_LABELS: Record<UserCargo, string> = {
  gestor: "Gestor",
  atendente_senior: "Atendente Sênior",
  atendente_pleno: "Atendente Pleno",
  atendente_junior: "Atendente Júnior",
  atendente_treinamento: "Atendente Treinamento",
  mesa_rv: "Mesa RV",
  mesa_rf: "Mesa RF",
  assessor: "Assessor",
};
