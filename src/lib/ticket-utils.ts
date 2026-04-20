import { Status, Priority, Category } from "@/types/ticket";

export function getStatusColor(status: Status): string {
  switch (status) {
    case "nova_demanda": return "bg-status-neutral/15 text-status-neutral border-status-neutral/30";
    case "em_analise": return "bg-status-info/15 text-status-info border-status-info/30";
    case "aguardando_retorno": return "bg-status-warning/15 text-status-warning border-status-warning/30";
    case "aguardando_xp": return "bg-status-purple/15 text-status-purple border-status-purple/30";
    case "concluida": return "bg-status-success/15 text-status-success border-status-success/30";
    case "cancelada": return "bg-status-neutral/15 text-status-neutral border-status-neutral/30";
  }
}

export function getStatusDot(status: Status): string {
  switch (status) {
    case "nova_demanda": return "bg-status-neutral";
    case "em_analise": return "bg-status-info";
    case "aguardando_retorno": return "bg-status-warning";
    case "aguardando_xp": return "bg-status-purple";
    case "concluida": return "bg-status-success";
    case "cancelada": return "bg-status-neutral";
  }
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case "baixa": return "text-priority-low";
    case "media": return "text-priority-medium";
    case "alta": return "text-priority-high";
    case "urgente": return "text-priority-urgent";
  }
}

export function getPriorityBg(priority: Priority): string {
  switch (priority) {
    case "baixa": return "bg-priority-low/10 text-priority-low border-priority-low/20";
    case "media": return "bg-priority-medium/10 text-priority-medium border-priority-medium/20";
    case "alta": return "bg-priority-high/10 text-priority-high border-priority-high/20";
    case "urgente": return "bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20";
  }
}

export function getCategoryIcon(category: Category): string {
  switch (category) {
    case "abertura_conta": return "UserPlus";
    case "atualizacao_cadastral": return "FileEdit";
    case "portabilidade": return "ArrowLeftRight";
    case "renda_variavel": return "TrendingUp";
    case "renda_fixa": return "Landmark";
    case "seguros": return "Shield";
    case "credito": return "CreditCard";
    case "pj": return "Building2";
    case "problema_tecnico": return "AlertTriangle";
    case "outro": return "MoreHorizontal";
  }
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays}d`;
  return `${Math.floor(diffDays / 30)}m`;
}

export function formatSLA(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

export function formatSLADetailed(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${hours}h ${minutes}min ${seconds}s`;
}

/** SLA limits per status in hours */
const SLA_LIMITS: Partial<Record<Status, number>> = {
  nova_demanda: 2,
  em_analise: 2,
  aguardando_retorno: 24,
  aguardando_xp: 48,
};

/** Get SLA remaining info for a ticket */
export function getSLAInfo(ticket: { status: string; createdAt: Date; updatedAt: Date }) {
  const status = ticket.status as Status;
  const limit = SLA_LIMITS[status];
  if (!limit) return { color: "sla-ok" as const, label: "—", overdue: false, percent: 0 };

  const now = new Date();
  const refDate = ticket.updatedAt || ticket.createdAt;
  const elapsedMs = now.getTime() - refDate.getTime();
  const limitMs = limit * 3600000;
  const remainingMs = limitMs - elapsedMs;
  const percent = Math.min(elapsedMs / limitMs, 1.5);

  if (remainingMs <= 0) {
    const overMs = Math.abs(remainingMs);
    const overMins = Math.floor(overMs / 60000);
    const overHours = Math.floor(overMs / 3600000);
    const label = overHours > 0 ? `+${overHours}h atrasado` : `+${overMins}min atrasado`;
    return { color: "sla-red" as const, label, overdue: true, percent };
  }

  const remMins = Math.floor(remainingMs / 60000);
  const remHours = Math.floor(remainingMs / 3600000);
  const label = remHours > 0 ? `${remHours}h restante` : `${remMins}min restante`;

  let color: "sla-ok" | "sla-yellow" | "sla-orange" | "sla-red";
  if (percent >= 1) color = "sla-red";
  else if (percent >= 0.8) color = "sla-orange";
  else if (percent >= 0.5) color = "sla-yellow";
  else color = "sla-ok";

  return { color, label, overdue: false, percent };
}

export function getSLAColorClass(color: "sla-ok" | "sla-yellow" | "sla-orange" | "sla-red"): string {
  switch (color) {
    case "sla-ok": return "text-status-success";
    case "sla-yellow": return "text-status-warning";
    case "sla-orange": return "text-sla-orange";
    case "sla-red": return "text-status-danger";
  }
}

export function isOverdue(ticket: { status: string; createdAt: Date; updatedAt: Date }): boolean {
  return getSLAInfo(ticket).overdue;
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
