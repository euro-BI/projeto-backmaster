import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Clock, Send, Paperclip, UserPlus, ArrowRightLeft, History, Link2, Lock, Unlock, Search, ChevronRight } from "lucide-react";
import { useState } from "react";
import { mockTickets, mockUsers } from "@/data/mockData";
import { StatusBadge, PriorityBadge, CategoryTag } from "@/components/StatusBadge";
import { CATEGORY_LABELS, STATUS_LABELS, Status } from "@/types/ticket";
import { formatTimeAgo, getSLAInfo, getSLAColorClass, formatSLADetailed, copyToClipboard } from "@/lib/ticket-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [showPanel, setShowPanel] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");

  const ticket = mockTickets.find((t) => t.id === id);
  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Ticket não encontrado.
      </div>
    );
  }

  const sla = getSLAInfo(ticket);
  const responsavel = mockUsers.find((u) => u.id === ticket.assignees[0]);
  const attendantUsers = (ticket.attendants || []).map((id) => mockUsers.find((u) => u.id === id)).filter(Boolean);

  const linkableTickets = mockTickets.filter(t => t.id !== ticket.id && t.id.toLowerCase().includes(linkSearch.toLowerCase()) || t.title.toLowerCase().includes(linkSearch.toLowerCase()));

  const handleSend = () => {
    if (!message.trim()) return;
    toast.success(isInternal ? "Mensagem interna enviada!" : "Mensagem enviada!");
    setMessage("");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-card flex items-center px-5 gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{ticket.id}</span>
            {ticket.demandType === "socorro" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-danger/20 text-status-danger">SOCORRO</span>}
            {ticket.demandType === "back" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-warning/20 text-status-warning">BACK!</span>}
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        {showPanel && (
          <aside className="w-72 border-r border-border bg-card overflow-auto shrink-0 animate-fade-in relative">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* 1. Ticket + Responsável side by side */}
                <div className="flex items-start gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ticket</p>
                    <button onClick={() => { copyToClipboard(ticket.id); toast.success("ID copiado!"); }} className="flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-primary transition-colors">
                      {ticket.id} <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Responsável</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-default">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary">
                            {ticket.assigneeNames[0]?.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-[12px] font-medium text-foreground">{ticket.assigneeNames[0]?.split(" ")[0]}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{ticket.assigneeNames[0]}</p>
                        {responsavel?.rating && <p className="text-[11px]">Nota: {responsavel.rating.toFixed(1)}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* 2. Título */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Título</p>
                  <p className="text-[12px] text-foreground leading-relaxed">{ticket.title}</p>
                </div>

                {/* 3. Descrição */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descrição</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{ticket.description}</p>
                </div>

                {/* 4. PL + Prioridade side by side */}
                <div className="flex gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">PL</p>
                    <p className="text-[12px] text-foreground">{ticket.clientPL}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Prioridade</p>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>

                {/* SLA */}
                <div className={cn("rounded-lg p-2.5 border", sla.overdue ? "bg-status-danger/5 border-status-danger/20" : "bg-muted/50 border-border")}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">SLA</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn("flex items-center gap-1 text-[13px] font-semibold", getSLAColorClass(sla.color))}>
                        <Clock className="h-3.5 w-3.5" />
                        {sla.label}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{formatSLADetailed(ticket.updatedAt || ticket.createdAt)}</TooltipContent>
                  </Tooltip>
                </div>

                {/* 5. Atendente(s) + buttons */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Atendente(s)</p>
                  {attendantUsers.length > 0 ? (
                    <div className="space-y-1.5">
                      {attendantUsers.map((u) => u && (
                        <Tooltip key={u.id}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-default">
                              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[9px] font-semibold text-accent-foreground">
                                {u.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <span className="text-[12px] text-foreground">{u.name.split(" ")[0]}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{u.name}</p>
                            {u.rating && <p className="text-[11px]">Nota: {u.rating.toFixed(1)}</p>}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Nenhum atendente</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => toast.info("Funcionalidade de transferência em breve")} className="flex-1 h-7 flex items-center justify-center gap-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors">
                      <ArrowRightLeft className="h-3 w-3" /> Transferir
                    </button>
                    <button onClick={() => toast.info("Funcionalidade de colaboração em breve")} className="flex-1 h-7 flex items-center justify-center gap-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors">
                      <UserPlus className="h-3 w-3" /> Adicionar
                    </button>
                  </div>
                </div>

                {/* 6. Alterar Status */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Alterar Status</p>
                  <select className="w-full h-8 px-2 text-[12px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring" defaultValue={ticket.status}>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* 7. Histórico */}
                <Dialog open={showHistory} onOpenChange={setShowHistory}>
                  <DialogTrigger asChild>
                    <button className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border border-border text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors">
                      <History className="h-3 w-3" /> Ver Histórico Completo
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-sm">Histórico — {ticket.id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                      {ticket.statusHistory.map((sh, i) => (
                        <div key={sh.id} className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                            {i < ticket.statusHistory.length - 1 && <div className="w-px flex-1 bg-border" />}
                          </div>
                          <div className="pb-2">
                            <p className="text-[12px] font-medium text-foreground">{STATUS_LABELS[sh.toStatus]}</p>
                            {sh.changedByName && <p className="text-[10px] text-muted-foreground">por {sh.changedByName}</p>}
                            <p className="text-[10px] text-muted-foreground">{formatTimeAgo(sh.changedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* 8. Categoria */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Categoria</p>
                  <CategoryTag label={CATEGORY_LABELS[ticket.category]} />
                </div>

                {/* Cliente */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
                  <button onClick={() => { copyToClipboard(ticket.clientCode); toast.success("Copiado!"); }} className="flex items-center gap-1 text-[12px] text-foreground hover:text-primary transition-colors">
                    {ticket.clientCode} <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>

                {/* Linked tickets */}
                {ticket.linkedTickets && ticket.linkedTickets.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tickets Vinculados</p>
                    <div className="space-y-1">
                      {ticket.linkedTickets.map(lt => (
                        <button key={lt} onClick={() => navigate(`/ticket/${lt}`)} className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                          <Link2 className="h-3 w-3" />{lt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating */}
                {ticket.rating && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avaliação</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-status-success">{ticket.rating}</span>
                      <span className="text-[11px] text-muted-foreground">/10</span>
                    </div>
                    {ticket.ratingJustification && (
                      <p className="text-[11px] text-muted-foreground mt-1">"{ticket.ratingJustification}"</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Collapse button on right edge */}
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-1/2 -right-3 -translate-y-1/2 h-8 w-6 bg-card border border-border rounded-r-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30 shadow-sm"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
            </button>
          </aside>
        )}

        {/* Expand button when panel is hidden */}
        {!showPanel && (
          <button
            onClick={() => setShowPanel(true)}
            className="absolute top-1/2 left-0 -translate-y-1/2 h-8 w-6 bg-card border border-border rounded-r-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30 shadow-sm"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}

        {/* Main content — chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat messages */}
          <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
            {ticket.messages.length > 0 ? (
              ticket.messages.map((msg) => {
                const isSelf = msg.userId === "a1";
                const msgIsInternal = msg.isInternal;
                return (
                  <div key={msg.id} className={cn("flex", isSelf ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-3.5 py-2.5",
                      msgIsInternal
                        ? "bg-status-warning/10 border border-status-warning/20 rounded-br-md"
                        : isSelf
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border rounded-bl-md"
                    )}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {msgIsInternal && (
                          <span className="text-[9px] font-bold text-status-warning bg-status-warning/10 px-1.5 py-0.5 rounded">INTERNO</span>
                        )}
                        <span className={cn("text-[11px] font-semibold", msgIsInternal ? "text-foreground" : isSelf ? "text-primary-foreground/80" : "text-foreground")}>
                          {msg.userName}
                        </span>
                        <span className={cn("text-[10px]", msgIsInternal ? "text-muted-foreground" : isSelf ? "text-primary-foreground/50" : "text-muted-foreground")}>
                          {formatTimeAgo(msg.createdAt)}
                        </span>
                      </div>
                      <p className={cn("text-[13px] leading-relaxed", msgIsInternal ? "text-foreground" : isSelf ? "text-primary-foreground" : "text-foreground")}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[12px] text-muted-foreground">Nenhuma mensagem ainda. Inicie a conversa abaixo.</p>
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="px-5 py-3 border-t border-border bg-card">
            {isInternal && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Lock className="h-3 w-3 text-status-warning" />
                <span className="text-[10px] font-medium text-status-warning">Mensagem interna — visível apenas para a equipe</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isInternal ? "Mensagem interna..." : "Digite uma mensagem..."}
                className={cn(
                  "flex-1 h-8 px-3 text-[13px] rounded-lg border-0 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                  isInternal ? "bg-status-warning/5 text-foreground ring-status-warning/30" : "bg-muted text-foreground"
                )}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setIsInternal(!isInternal)}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                      isInternal ? "bg-status-warning/10 text-status-warning" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {isInternal ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isInternal ? "Modo interno (equipe)" : "Modo público (assessor vê)"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowLinkDialog(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Vincular ticket</TooltipContent>
              </Tooltip>

              <button onClick={handleSend} className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Link tickets dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Vincular Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                placeholder="Buscar por ID ou título..."
                className="w-full h-8 pl-9 pr-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <ScrollArea className="h-[280px]">
              <div className="space-y-1.5 pr-2">
                {linkableTickets.slice(0, 20).map(t => {
                  const isLinked = ticket.linkedTickets?.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => { toast.success(`Ticket ${t.id} vinculado!`); setShowLinkDialog(false); }}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                        isLinked ? "bg-primary/10 border border-primary/20" : "hover:bg-muted border border-transparent"
                      )}
                    >
                      <span className="text-[11px] text-muted-foreground shrink-0">{t.id}</span>
                      <span className="text-[12px] text-foreground truncate flex-1">{t.title}</span>
                      <StatusBadge status={t.status} />
                      {isLinked && <span className="text-[9px] text-primary font-semibold">Vinculado</span>}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}