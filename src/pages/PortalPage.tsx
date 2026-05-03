import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, FileEdit, ArrowLeftRight, TrendingUp, Landmark,
  Shield, CreditCard, Building2, AlertTriangle, MoreHorizontal,
  Clock, Plus, Star, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { mockUsers } from "@/data/mockData";
import { useTickets, useCreateTicket } from "@/hooks/useTickets";
import { Category, CATEGORY_LABELS, Priority, PRIORITY_LABELS, Ticket } from "@/types/ticket";
import { formatTimeAgo, isOverdue } from "@/lib/ticket-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RatingModal } from "@/components/RatingModal";
import { MIAjudaChat } from "@/components/MIAjudaChat";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryIcons: Record<Category, React.ElementType> = {
  abertura_conta: UserPlus, atualizacao_cadastral: FileEdit, portabilidade: ArrowLeftRight,
  renda_variavel: TrendingUp, renda_fixa: Landmark, seguros: Shield,
  credito: CreditCard, pj: Building2, problema_tecnico: AlertTriangle, outro: MoreHorizontal,
};
const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];
const portalUser = mockUsers.find(u => u.role === "assessor")!;

const aiInsights = [
  "✅ Suas demandas estão mais completas — continue assim!",
  "⏱️ Responder mais rápido pode melhorar sua nota média.",
  "📋 Adicionar mais detalhes na descrição facilita o atendimento.",
  "🌟 Sua nota está acima da média. Parabéns!",
];

export default function PortalPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ title: "", clientCode: "", clientPL: "", priority: "media" as Priority, description: "" });
  const [ratingTicket, setRatingTicket] = useState<Ticket | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(true);

  const { data: myTickets = [], isLoading } = useTickets();
  const { mutate: createTicket, isPending: isCreating } = useCreateTicket();

  const pendingRatingTickets = myTickets.filter((t) => t.status === "concluida" && t.pendingRating);
  const hasPendingRatings = pendingRatingTickets.length > 0;

  const overdueTickets = useMemo(() => myTickets.filter((t) => !["concluida", "cancelada"].includes(t.status) && isOverdue(t)), [myTickets]);
  const openTickets = useMemo(() => {
    const statusOrder: Record<string, number> = { aguardando_retorno: 0, aguardando_xp: 1, em_analise: 2, nova_demanda: 3 };
    return myTickets
      .filter((t) => !["concluida", "cancelada"].includes(t.status) && !isOverdue(t))
      .sort((a, b) => {
        const aUn = a.pendingRating ? 0 : 1;
        const bUn = b.pendingRating ? 0 : 1;
        if (aUn !== bUn) return aUn - bUn;
        return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      });
  }, [myTickets]);
  const completedTickets = useMemo(() => {
    return myTickets.filter((t) => t.status === "concluida").sort((a, b) => {
      const aUn = a.pendingRating ? 0 : 1;
      const bUn = b.pendingRating ? 0 : 1;
      return aUn - bUn;
    });
  }, [myTickets]);

  const canSelectPriority = (portalUser.rating ?? 0) > 7;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createTicket({
      title: formData.title,
      clientCode: formData.clientCode,
      clientPL: formData.clientPL,
      priority: formData.priority,
      description: formData.description,
      category: selectedCategory!,
    }, {
      onSuccess: () => {
        setSelectedCategory(null);
        setFormData({ title: "", clientCode: "", clientPL: "", priority: "media", description: "" });
      }
    });
  };
  const handleRatingSubmit = (ticketId: string, rating: number, justification: string) => {
    console.log("Rating submitted:", { ticketId, rating, justification });
  };

  const renderTicketCard = (ticket: Ticket) => {
    const overdue = isOverdue(ticket);
    return (
      <div
        key={ticket.id}
        onClick={() => navigate(`/ticket/${ticket.id}`)}
        className={cn(
          "flex items-center justify-between p-3 rounded-xl bg-card border cursor-pointer transition-all hover:shadow-soft",
          overdue ? "border-status-danger/30 bg-status-danger/[0.03] hover:border-status-danger/50" : "border-border hover:border-primary/30"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {ticket.hasUnreadUpdate && <div className="h-2 w-2 rounded-full bg-status-warning shrink-0" title="Atualização não lida" />}
            <span className="text-[11px] text-muted-foreground">{ticket.id}</span>
            <span className="text-[13px] font-medium text-foreground truncate">{ticket.title}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {overdue && <span className="text-[10px] font-medium text-status-danger">⚠ SLA vencido</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {ticket.status === "concluida" && ticket.pendingRating && (
            <button onClick={(e) => { e.stopPropagation(); setRatingTicket(ticket); }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-status-warning/10 text-status-warning text-[10px] font-medium hover:bg-status-warning/20 transition-colors">
              <Star className="h-3 w-3" />Avaliar
            </button>
          )}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />{formatTimeAgo(ticket.createdAt)}
          </div>
        </div>
      </div>
    );
  };

  const TicketBlock = ({ title, tickets, icon, color, maxVisible = 5 }: { title: string; tickets: Ticket[]; icon: React.ReactNode; color: string; maxVisible?: number }) => {
    if (tickets.length === 0) return null;
    return (
      <div>
        <h2 className={cn("text-sm font-semibold mb-3 flex items-center gap-1.5", color)}>
          {icon} {title} ({tickets.length})
        </h2>
        <ScrollArea className={tickets.length > maxVisible ? "h-[320px]" : ""}>
          <div className="space-y-2 pr-2">
            {tickets.map(renderTicketCard)}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Portal do Assessor" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
              Carregando portal...
            </div>
          )}
          {!isLoading && !selectedCategory ? (
            <>
              {/* Insights Diário — collapsible, at top */}
              <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                <button
                  onClick={() => setInsightsOpen(!insightsOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h2 className="text-[13px] font-semibold text-foreground">Insights Diário</h2>
                  </div>
                  {insightsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {insightsOpen && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {aiInsights.map((s, i) => (
                        <div key={i} className="bg-muted/30 rounded-lg p-3 text-[12px] text-foreground leading-relaxed border border-border">{s}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Nova Demanda section with overlay */}
              <div className="relative">
                <h2 className="text-sm font-semibold text-foreground mb-3">Nova Demanda</h2>
                <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 transition-all", hasPendingRatings && "blur-[2px] opacity-40")}>
                  {categories.map(([key, label]) => {
                    const Icon = categoryIcons[key];
                    return (
                      <button
                        key={key}
                        onClick={() => !hasPendingRatings && setSelectedCategory(key)}
                        disabled={hasPendingRatings}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border transition-all",
                          !hasPendingRatings && "hover:border-primary/40 hover:shadow-soft group cursor-pointer",
                          hasPendingRatings && "cursor-not-allowed"
                        )}
                      >
                        <div className={cn("h-9 w-9 rounded-lg bg-muted flex items-center justify-center", !hasPendingRatings && "group-hover:bg-primary/10 transition-colors")}>
                          <Icon className={cn("h-4 w-4 text-muted-foreground", !hasPendingRatings && "group-hover:text-primary transition-colors")} />
                        </div>
                        <span className={cn("text-[11px] font-medium text-muted-foreground text-center leading-tight", !hasPendingRatings && "group-hover:text-foreground")}>{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Overlay de bloqueio */}
                {hasPendingRatings && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-card/95 backdrop-blur-sm border border-status-warning/30 rounded-2xl p-6 max-w-lg mx-4 shadow-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-status-warning/10 flex items-center justify-center shrink-0">
                          <Star className="h-5 w-5 text-status-warning" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-foreground mb-1">
                            {pendingRatingTickets.length} {pendingRatingTickets.length === 1 ? "avaliação pendente" : "avaliações pendentes"}
                          </p>
                          <p className="text-[12px] text-muted-foreground leading-relaxed">
                            Você só poderá abrir uma nova demanda após concluir todas as avaliações pendentes. 
                            Seus elogios e críticas construtivas são fundamentais para melhorar continuamente a qualidade do atendimento.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {pendingRatingTickets.slice(0, 5).map((ticket) => (
                          <div key={ticket.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[11px] text-muted-foreground shrink-0">{ticket.id}</span>
                              <span className="text-[12px] font-medium text-foreground truncate">{ticket.title}</span>
                            </div>
                            <button onClick={() => setRatingTicket(ticket)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-status-warning/10 text-status-warning text-[10px] font-semibold hover:bg-status-warning/20 transition-colors shrink-0 ml-2">
                              <Star className="h-3 w-3" />Avaliar
                            </button>
                          </div>
                        ))}
                        {pendingRatingTickets.length > 5 && (
                          <p className="text-[11px] text-muted-foreground text-center pt-1">
                            e mais {pendingRatingTickets.length - 5} avaliação(ões)...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 blocks */}
              <TicketBlock title="SLA Vencido" tickets={overdueTickets} icon={<AlertTriangle className="h-3.5 w-3.5" />} color="text-status-danger" />
              <TicketBlock title="Em Aberto" tickets={openTickets} icon={<Clock className="h-3.5 w-3.5" />} color="text-foreground" />
              <TicketBlock title="Concluídas" tickets={completedTickets} icon={<Star className="h-3.5 w-3.5" />} color="text-muted-foreground" />
            </>
          ) : !isLoading && selectedCategory ? (
            <div className="animate-fade-in">
              <button onClick={() => setSelectedCategory(null)} className="text-[13px] text-muted-foreground hover:text-foreground mb-3 transition-colors">← Voltar</button>
              <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                <h2 className="text-sm font-semibold text-foreground mb-4">{CATEGORY_LABELS[selectedCategory]}</h2>
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Título</label>
                    <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Descreva brevemente a demanda" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Código do Cliente</label>
                      <input required value={formData.clientCode} onChange={(e) => setFormData({ ...formData, clientCode: e.target.value })} className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="0000" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">PL do Cliente</label>
                      <input required value={formData.clientPL} onChange={(e) => setFormData({ ...formData, clientPL: e.target.value })} className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="R$ 0,00" />
                    </div>
                  </div>
                  {canSelectPriority ? (
                    <div>
                      <label className="block text-[11px] font-medium text-muted-foreground mb-1">Prioridade</label>
                      <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })} className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                        {(["baixa", "media", "alta", "urgente"] as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[11px] text-muted-foreground">Prioridade: <span className="font-medium text-foreground">Média</span><span className="ml-1 text-[10px]">(nota ≥ 7 para selecionar)</span></p>
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Descrição</label>
                    <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-3 py-2 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Detalhe a solicitação..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Anexos</label>
                    <div className="border border-dashed border-border rounded-lg p-4 text-center">
                      <Plus className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-[11px] text-muted-foreground">Arraste arquivos ou clique para anexar</p>
                    </div>
                  </div>
                  <button type="submit" disabled={isCreating} className="w-full h-9 bg-primary text-primary-foreground rounded-lg text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {isCreating ? "Criando..." : "Abrir Demanda"}
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <MIAjudaChat />
      {ratingTicket && <RatingModal ticket={ratingTicket} onClose={() => setRatingTicket(null)} onSubmit={handleRatingSubmit} />}
    </div>
  );
}