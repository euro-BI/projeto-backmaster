import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Send, Paperclip, UserPlus, ArrowRightLeft, History, Link2, Lock, Unlock, Search, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge, CategoryTag } from "@/components/StatusBadge";
import { CATEGORY_LABELS, STATUS_LABELS, Status } from "@/types/ticket";
import { useDemandTypes } from "@/hooks/useDemandTypes";
import { useCreateTicketMessage, useTicketMessages, useTicketStatusHistory, useTickets, useUpdateTicketAssignees, useUpdateTicketAttendants, useUpdateTicketStatus } from "@/hooks/useTickets";
import { useCurrentUser, useProfiles } from "@/hooks/useProfiles";
import { formatTimeAgo, copyToClipboard } from "@/lib/ticket-utils";
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
  const { id: identifier } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [showPanel, setShowPanel] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showAddAttendantDialog, setShowAddAttendantDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { data: tickets = [], isLoading } = useTickets();
  const ticket = tickets.find((t) => t.id === identifier || t.code === identifier);
  const resolvedTicketId = ticket?.id;
  const { data: demandTypes = [] } = useDemandTypes();
  const { data: profiles = [] } = useProfiles();
  const { data: currentUser } = useCurrentUser();
  const { data: statusHistory = [], isLoading: isLoadingHistory } = useTicketStatusHistory(resolvedTicketId);
  const { data: messages = [], isLoading: isLoadingMessages } = useTicketMessages(resolvedTicketId);
  const { mutate: createMessage, isPending: isSendingMessage } = useCreateTicketMessage();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTicketStatus();
  const { mutate: updateAssignees, isPending: isUpdatingAssignees } = useUpdateTicketAssignees();
  const { mutate: updateAttendants, isPending: isUpdatingAttendants } = useUpdateTicketAttendants();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = { ...CATEGORY_LABELS };
    for (const t of demandTypes) map[t.id] = t.label;
    return map;
  }, [demandTypes]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);
  const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Ticket não encontrado.
      </div>
    );
  }

  const displayTicketCode = ticket.code || ticket.id;
  const responsibleId = (ticket.assignees?.[0] || ticket.createdBy) as string;
  const responsibleUser = profilesById.get(responsibleId);
  const responsibleName = ticket.assigneeNames?.[0] || responsibleUser?.name || ticket.createdByName;
  const attendantIds = ticket.attendants || [];
  const attendants = attendantIds.map((uid) => ({
    id: uid,
    name: profilesById.get(uid)?.name || uid,
    avatar: profilesById.get(uid)?.avatar,
  }));
  const demandType = demandTypes.find((t) => t.id === ticket.category);
  const ticketFields = demandType?.fields ?? [];
  const extraData = ticket.extraData ?? {};

  const linkableTickets = tickets.filter((t) => {
    if (t.id === ticket.id) return false;
    const q = linkSearch.toLowerCase();
    const searchableCode = (t.code || t.id).toLowerCase();
    return searchableCode.includes(q) || t.title.toLowerCase().includes(q);
  });

  const handleChangeStatus = (toStatus: Status) => {
    if (toStatus === ticket.status) return;
    updateStatus({ ticketId: ticket.id, fromStatus: ticket.status, toStatus });
  };

  const handleConfirmTransfer = () => {
    if (!selectedUserId) return;
    updateAssignees(
      { ticketId: ticket.id, assignees: [selectedUserId] },
      {
        onSuccess: () => {
          setShowTransferDialog(false);
          setSelectedUserId("");
        },
      }
    );
  };

  const handleConfirmAddAttendant = () => {
    if (!selectedUserId) return;
    const next = Array.from(new Set([...(ticket.attendants || []), selectedUserId]));
    updateAttendants(
      { ticketId: ticket.id, attendants: next },
      {
        onSuccess: () => {
          setShowAddAttendantDialog(false);
          setSelectedUserId("");
        },
      }
    );
  };

  const handleRemoveAttendant = (uid: string) => {
    const next = (ticket.attendants || []).filter((x) => x !== uid);
    updateAttendants({ ticketId: ticket.id, attendants: next });
  };

  const handleSend = () => {
    const content = message.trim();
    if (!content || !ticket?.id || isSendingMessage) return;

    createMessage(
      {
        ticketId: ticket.id,
        content,
        isInternal,
      },
      {
        onSuccess: () => {
          setMessage("");
        },
      }
    );
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
            <span className="text-[11px] text-muted-foreground">{displayTicketCode}</span>
            {ticket.demandType === "socorro" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-danger/20 text-status-danger">SOCORRO</span>}
            {ticket.demandType === "back" && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-warning/20 text-status-warning">BACK!</span>}
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel */}
        {showPanel && (
          <div className="relative w-72 shrink-0 animate-fade-in">
            <aside className="h-full border-r border-border bg-card overflow-auto">
              <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* 1. Ticket + Responsável side by side */}
                <div className="flex items-start gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ticket</p>
                    <button onClick={() => { copyToClipboard(displayTicketCode); toast.success("ID copiado!"); }} className="flex items-center gap-1 text-[13px] font-medium text-foreground hover:text-primary transition-colors">
                      {displayTicketCode} <Copy className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Responsável</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-default">
                          {responsibleUser?.avatar ? (
                            <img
                              src={responsibleUser.avatar}
                              alt={responsibleName}
                              className="h-6 w-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary">
                              {responsibleName?.split(" ").map((n) => n[0]).join("")}
                            </div>
                          )}
                          <span className="text-[12px] font-medium text-foreground">{responsibleName?.split(" ")[0]}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{responsibleName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* 5. Atendente(s) + buttons */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Atendente(s)</p>
                  {attendants.length > 0 ? (
                    <div className="space-y-1.5">
                      {attendants.map((a) => (
                        <Tooltip key={a.id}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-default">
                              {a.avatar ? (
                                <img
                                  src={a.avatar}
                                  alt={a.name}
                                  className="h-6 w-6 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[9px] font-semibold text-accent-foreground">
                                  {a.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                              )}
                              <span className="text-[12px] text-foreground">{a.name.split(" ")[0]}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAttendant(a.id);
                                }}
                                className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{a.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Nenhum atendente</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { setSelectedUserId(""); setShowTransferDialog(true); }}
                      disabled={isUpdatingAssignees}
                      className="flex-1 h-7 flex items-center justify-center gap-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <ArrowRightLeft className="h-3 w-3" /> Transferir
                    </button>
                    <button
                      onClick={() => { setSelectedUserId(""); setShowAddAttendantDialog(true); }}
                      disabled={isUpdatingAttendants}
                      className="flex-1 h-7 flex items-center justify-center gap-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="h-3 w-3" /> Adicionar
                    </button>
                  </div>
                </div>

                {/* 6. Alterar Status */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Alterar Status</p>
                  <select
                    className="w-full h-8 px-2 text-[12px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    value={ticket.status}
                    onChange={(e) => handleChangeStatus(e.target.value as Status)}
                    disabled={isUpdatingStatus}
                  >
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
                      <DialogTitle className="text-sm">Histórico — {displayTicketCode}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                      {isLoadingHistory ? (
                        <div className="py-6 text-center text-[12px] text-muted-foreground">Carregando...</div>
                      ) : statusHistory.length === 0 ? (
                        <div className="py-6 text-center text-[12px] text-muted-foreground">Sem histórico ainda.</div>
                      ) : statusHistory.map((sh, i) => (
                        <div key={sh.id} className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                            {i < statusHistory.length - 1 && <div className="w-px flex-1 bg-border" />}
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
                  <CategoryTag label={categoryLabels[ticket.category] || ticket.category} />
                </div>

                {/* Campos cadastrados */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Campos</p>
                  {ticketFields.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">Nenhum campo cadastrado para este tipo.</p>
                  ) : (
                    <div className="space-y-2">
                      {ticketFields.map((f) => {
                        const raw = extraData[f.key];
                        if (f.fieldType === "attachment") {
                          const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
                          return (
                            <div key={f.id} className="rounded-lg border border-border bg-muted/30 p-2">
                              <p className="text-[11px] font-medium text-foreground">{f.label}</p>
                              {items.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground mt-0.5">—</p>
                              ) : (
                                <div className="mt-1 space-y-1">
                                  {items.map((it: any, idx: number) => (
                                    <a
                                      key={`${f.id}-${idx}`}
                                      href={it?.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block text-[11px] text-primary hover:underline truncate"
                                    >
                                      {it?.name || it?.url}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }

                        const value = raw === null || raw === undefined ? "" : String(raw).trim();
                        return (
                          <div key={f.id} className="rounded-lg border border-border bg-muted/30 p-2">
                            <p className="text-[11px] font-medium text-foreground">{f.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">{value || "—"}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            </aside>

            {/* Collapse button on right edge */}
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 h-9 w-7 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30 shadow-sm"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
            </button>
          </div>
        )}

        {/* Expand button when panel is hidden */}
        {!showPanel && (
          <button
            onClick={() => setShowPanel(true)}
            className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 h-9 w-7 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-30 shadow-sm"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}

        {/* Main content — chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat messages */}
          <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[12px] text-muted-foreground">Carregando mensagens...</p>
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isSelf = msg.userId === currentUser?.id;
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
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((attachment, index) => (
                            <a
                              key={`${msg.id}-attachment-${index}`}
                              href={attachment}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "block text-[11px] underline underline-offset-2 break-all",
                                msgIsInternal
                                  ? "text-foreground"
                                  : isSelf
                                    ? "text-primary-foreground"
                                    : "text-primary"
                              )}
                            >
                              {attachment}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[12px] text-muted-foreground">Nenhuma mensagem ainda. Inicie a conversa abaixo.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
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
              <button
                type="button"
                onClick={() => toast.info("Anexo no chat ainda não foi habilitado.")}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isInternal ? "Mensagem interna..." : "Digite uma mensagem..."}
                className={cn(
                  "flex-1 h-8 px-3 text-[13px] rounded-lg border-0 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                  isInternal ? "bg-status-warning/5 text-foreground ring-status-warning/30" : "bg-muted text-foreground"
                )}
                disabled={isSendingMessage}
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

              <button
                onClick={handleSend}
                disabled={!message.trim() || isSendingMessage}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
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
                  const targetCode = t.code || t.id;
                  const isLinked = !!ticket.linkedTickets?.includes(targetCode) || !!ticket.linkedTickets?.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => { toast.success(`Ticket ${targetCode} vinculado!`); setShowLinkDialog(false); }}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                        isLinked ? "bg-primary/10 border border-primary/20" : "hover:bg-muted border border-transparent"
                      )}
                    >
                      <span className="text-[11px] text-muted-foreground shrink-0">{targetCode}</span>
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

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Transferir responsável</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-9 px-2 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecione...</option>
              {profiles
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowTransferDialog(false)}
                className="h-9 px-3 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={!selectedUserId || isUpdatingAssignees}
                className="h-9 px-3 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Transferir
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddAttendantDialog} onOpenChange={setShowAddAttendantDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Adicionar atendente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-9 px-2 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecione...</option>
              {profiles
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddAttendantDialog(false)}
                className="h-9 px-3 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddAttendant}
                disabled={!selectedUserId || isUpdatingAttendants}
                className="h-9 px-3 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
