import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Clock, AlertTriangle, Filter, MessageSquare, CheckCircle2, X, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, PriorityBadge, CategoryTag } from "@/components/StatusBadge";
import { mockUsers } from "@/data/mockData";
import { useTickets } from "@/hooks/useTickets";
import { Status, Priority, Category, CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from "@/types/ticket";
import { getSLAInfo, getSLAColorClass, formatSLADetailed, isOverdue, copyToClipboard } from "@/lib/ticket-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NewDemandModal } from "@/components/NewDemandModal";

const statusFilters: Status[] = ["nova_demanda", "em_analise", "aguardando_retorno", "aguardando_xp", "concluida"];
const priorityFilters: Priority[] = ["urgente", "alta", "media", "baixa"];
const categoryFilters: Category[] = ["abertura_conta", "atualizacao_cadastral", "portabilidade", "renda_variavel", "renda_fixa", "seguros", "credito", "pj", "problema_tecnico", "outro"];

function PersonCell({ name, userId }: { name: string; userId: string }) {
  const user = mockUsers.find((u) => u.id === userId);
  const score = user?.rating;
  const firstName = name?.split(" ")[0] || "N/A";
  const initials = name?.split(" ").map((n) => n[0]).join("") || "??";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary shrink-0">
            {initials}
          </div>
          <span className="text-[12px] text-foreground truncate max-w-[70px]">{firstName}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">
        <p className="font-medium">{name}</p>
        {score && (
          <p className={cn("font-semibold", score >= 8 ? "text-status-success" : score >= 6 ? "text-status-warning" : "text-status-danger")}>
            Nota: {score.toFixed(1)}/10
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function AttendantCell({ names, ids }: { names: string[]; ids: string[] }) {
  if (!names || names.length === 0) return <span className="text-[11px] text-muted-foreground">—</span>;
  const firstName = names[0].split(" ")[0];
  const initials = names[0].split(" ").map((n) => n[0]).join("");
  const user = mockUsers.find((u) => u.id === ids[0]);
  const score = user?.rating;
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[9px] font-semibold text-accent-foreground shrink-0">
              {initials}
            </div>
            <span className="text-[12px] text-foreground truncate max-w-[70px]">{firstName}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[11px]">
          <p className="font-medium">{names[0]}</p>
          {score && <p className={cn("font-semibold", score >= 8 ? "text-status-success" : score >= 6 ? "text-status-warning" : "text-status-danger")}>Nota: {score.toFixed(1)}/10</p>}
        </TooltipContent>
      </Tooltip>
      {names.length > 1 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-[10px] text-muted-foreground">+{names.length - 1}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[11px]">{names.slice(1).join(", ")}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

type SortField = "priority" | "sla" | "status" | "pl";
type SortDir = "asc" | "desc" | null;

const statusOrder: Record<string, number> = {
  nova_demanda: 0, em_analise: 1, aguardando_retorno: 2, aguardando_xp: 3, concluida: 4, cancelada: 5,
};
const priorityOrder: Record<string, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };

function SortButton({ field, activeField, dir, onToggle }: { field: SortField; activeField: SortField | null; dir: SortDir; onToggle: (f: SortField) => void }) {
  const isActive = activeField === field;
  return (
    <button onClick={() => onToggle(field)} className="ml-1 inline-flex text-muted-foreground hover:text-foreground transition-colors">
      {isActive && dir === "asc" ? <ArrowUp className="h-3 w-3" /> : isActive && dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

export default function DemandsPage() {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState<Status | null>(null);
  const [activePriority, setActivePriority] = useState<Priority | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeResponsavel, setActiveResponsavel] = useState<string | null>(null);
  const [showOverdue, setShowOverdue] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: tickets = [], isLoading, error } = useTickets();

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === "desc") setSortDir("asc");
      else if (sortDir === "asc") { setSortField(null); setSortDir(null); }
      else setSortDir("desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const responsaveis = useMemo(() => {
    const ids = new Set(tickets.flatMap((t) => t.assignees || []));
    return mockUsers.filter((u) => ids.has(u.id));
  }, [tickets]);

  const sortedTickets = useMemo(() => {
    let filtered = [...tickets];
    if (activeStatus) {
      filtered = filtered.filter((t) => t.status === activeStatus);
    } else {
      filtered = filtered.filter((t) => t.status !== "concluida" && t.status !== "cancelada");
    }
    if (activePriority) filtered = filtered.filter((t) => t.priority === activePriority);
    if (activeCategory) filtered = filtered.filter((t) => t.category === activeCategory);
    if (activeResponsavel) filtered = filtered.filter((t) => (t.assignees || []).includes(activeResponsavel));
    if (showOverdue) filtered = filtered.filter((t) => isOverdue(t));

    return filtered.sort((a, b) => {
      if (sortField && sortDir) {
        let cmp = 0;
        if (sortField === "priority") cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
        else if (sortField === "status") cmp = statusOrder[a.status] - statusOrder[b.status];
        else if (sortField === "pl") cmp = parseFloat(a.clientPL.replace(/[^\d.]/g, "")) - parseFloat(b.clientPL.replace(/[^\d.]/g, ""));
        else if (sortField === "sla") cmp = (a.updatedAt || a.createdAt).getTime() - (b.updatedAt || b.createdAt).getTime();
        if (cmp !== 0) return sortDir === "asc" ? cmp : -cmp;
      }
      const aOv = isOverdue(a) ? 0 : 1;
      const bOv = isOverdue(b) ? 0 : 1;
      if (aOv !== bOv) return aOv - bOv;
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [tickets, activeStatus, activePriority, activeCategory, activeResponsavel, showOverdue, sortField, sortDir]);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => !["concluida", "cancelada"].includes(t.status));
    return {
      em_analise: open.filter((t) => t.status === "em_analise").length,
      aguardando_retorno: open.filter((t) => t.status === "aguardando_retorno").length,
      aguardando_xp: open.filter((t) => t.status === "aguardando_xp").length,
      overdue: open.filter((t) => isOverdue(t)).length,
    };
  }, [tickets]);

  const isShowingCompleted = activeStatus === "concluida";
  const hasActiveFilters = activePriority || activeCategory || activeResponsavel;

  const columns = isShowingCompleted
    ? ["", "Ticket", "Responsável", "Categoria", "Resumo", "Cliente", "PL", "Prioridade", "Status", "Avaliação"]
    : ["", "Ticket", "Responsável", "Atendente", "Categoria", "Resumo", "Cliente", "PL", "Prioridade", "SLA", "Status"];

  const sortableColumns: Record<string, SortField> = { Prioridade: "priority", SLA: "sla", Status: "status", PL: "pl" };

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Demandas" />

      <div className="flex-1 overflow-auto">
        <div className="p-5 space-y-4">
          {/* Pill buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {([
              { key: "em_analise" as Status, label: "Em Análise", count: stats.em_analise },
              { key: "aguardando_retorno" as Status, label: "Aguardando Retorno", count: stats.aguardando_retorno },
              { key: "aguardando_xp" as Status, label: "Aguardando XP", count: stats.aguardando_xp },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveStatus(activeStatus === s.key ? null : s.key)}
                className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-medium transition-all border",
                  activeStatus === s.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-foreground hover:border-primary/40"
                )}
              >
                {s.label} <span className="ml-1 font-bold">{s.count}</span>
              </button>
            ))}

            <button
              onClick={() => setShowOverdue(!showOverdue)}
              className={cn(
                "px-4 py-2 rounded-full text-[12px] font-medium transition-all border",
                showOverdue
                  ? "bg-status-danger text-status-danger-foreground border-status-danger"
                  : "bg-card border-border text-foreground hover:border-status-danger/40"
              )}
            >
              Demandas Atrasadas <span className="ml-1 font-bold">{stats.overdue}</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2 rounded-full text-[12px] font-medium transition-all border flex items-center gap-1.5",
                showFilters || hasActiveFilters
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:border-primary/40"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {hasActiveFilters && (
                <span className="h-4 w-4 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[9px]">
                  {[activePriority, activeCategory, activeResponsavel].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Inline filters */}
          <div className={cn("overflow-hidden transition-all duration-300 ease-out", showFilters ? "max-h-40 opacity-100" : "max-h-0 opacity-0")}>
            <div className="flex items-center gap-3 flex-wrap bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Responsável</span>
                <select value={activeResponsavel ?? ""} onChange={(e) => setActiveResponsavel(e.target.value || null)} className="h-7 px-2 text-[11px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Todos</option>
                  {responsaveis.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Prioridade</span>
                <div className="flex gap-1">
                  {priorityFilters.map((p) => (
                    <button key={p} onClick={() => setActivePriority(activePriority === p ? null : p)} className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border", activePriority === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:border-border")}>
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Categoria</span>
                <select value={activeCategory ?? ""} onChange={(e) => setActiveCategory((e.target.value || null) as Category | null)} className="h-7 px-2 text-[11px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Todas</option>
                  {categoryFilters.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Status</span>
                <div className="flex gap-1">
                  {statusFilters.map((s) => (
                    <button key={s} onClick={() => setActiveStatus(activeStatus === s ? null : s)} className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border", activeStatus === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:border-border")}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <>
                  <div className="w-px h-5 bg-border" />
                  <button onClick={() => { setActivePriority(null); setActiveCategory(null); setActiveResponsavel(null); }} className="flex items-center gap-1 text-[11px] text-status-danger hover:underline">
                    <X className="h-3 w-3" /> Limpar
                  </button>
                </>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
              Carregando demandas...
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-20 text-status-danger bg-status-danger/5 rounded-xl border border-status-danger/20">
              Erro ao carregar demandas: {(error as any).message}
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && (
            <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {columns.map((h, i) => (
                      <th key={`${h}-${i}`} className={cn("px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", h === "" && "w-4")}>
                        <span className="inline-flex items-center">
                          {h}
                          {sortableColumns[h] && !isShowingCompleted && (
                            <SortButton field={sortableColumns[h]} activeField={sortField} dir={sortDir} onToggle={toggleSort} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTickets.map((ticket) => {
                    const overdue = isOverdue(ticket);
                    const sla = getSLAInfo(ticket);
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => navigate(`/ticket/${ticket.id}`)}
                        className={cn(
                          "border-b border-border last:border-0 cursor-pointer transition-colors",
                          overdue ? "bg-status-danger/[0.03] hover:bg-status-danger/[0.06]" : "hover:bg-muted/50"
                        )}
                      >
                        <td className="px-1 py-2.5 text-center">
                          {overdue && <div className="h-2 w-2 rounded-full bg-status-danger mx-auto animate-pulse-soft" />}
                        </td>
                        <td className="px-3 py-2.5">
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(ticket.id); toast.success("ID copiado!"); }} className="flex items-center gap-1 text-[12px] font-medium text-foreground hover:text-primary transition-colors">
                            {ticket.id.substring(0, 8)}...<Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <PersonCell name={ticket.assigneeNames?.[0] || ticket.createdByName} userId={ticket.assignees?.[0] || ticket.createdBy} />
                        </td>
                        {!isShowingCompleted && (
                          <td className="px-3 py-2.5">
                            <AttendantCell names={ticket.attendantNames || []} ids={ticket.attendants || []} />
                          </td>
                        )}
                        <td className="px-3 py-2.5"><CategoryTag label={CATEGORY_LABELS[ticket.category]} /></td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {ticket.demandType === "socorro" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-danger/20 text-status-danger">SOCORRO</span>}
                            {ticket.demandType === "back" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-warning/20 text-status-warning">BACK!</span>}
                            <span className="font-medium text-foreground truncate">{ticket.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(ticket.clientCode); toast.success("Código copiado!"); }} className="inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors">
                            {ticket.clientCode}<Copy className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{ticket.clientPL}</td>
                        <td className="px-3 py-2.5"><PriorityBadge priority={ticket.priority} /></td>
                        {isShowingCompleted ? (
                          <>
                            <td className="px-3 py-2.5"><StatusBadge status={ticket.status} /></td>
                            <td className="px-3 py-2.5">
                              {ticket.rating ? (
                                <div className="flex items-center gap-1 text-[12px]">
                                  <CheckCircle2 className="h-3 w-3 text-status-success" />
                                  <span className="font-medium text-status-success">{ticket.rating}/10</span>
                                </div>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); const phone = "5511999999999"; const msg = encodeURIComponent(`Olá! A demanda ${ticket.id} foi concluída e está pendente de avaliação.`); window.open(`https://wa.me/${phone}?text=${msg}`, "_blank"); }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-status-warning/10 text-status-warning border border-status-warning/20 hover:bg-status-warning/20 transition-colors">
                                  <MessageSquare className="h-3 w-3" />Lembrar
                                </button>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={cn("flex items-center gap-1 text-[12px] font-medium", getSLAColorClass(sla.color))}>
                                    <Clock className="h-3 w-3" />{sla.label}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[11px]">{formatSLADetailed(ticket.updatedAt || ticket.createdAt)}</TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="px-3 py-2.5"><StatusBadge status={ticket.status} /></td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  {sortedTickets.length === 0 && (
                    <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-[13px] text-muted-foreground">Nenhuma demanda encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-50 group"
        title="Nova Demanda"
      >
        <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <NewDemandModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
