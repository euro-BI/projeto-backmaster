import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, FileEdit, ArrowLeftRight, TrendingUp, Landmark,
  Shield, CreditCard, Building2, AlertTriangle, MoreHorizontal,
  Clock, Plus, Star, Calendar as CalendarIcon,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { mockUsers } from "@/data/mockData";
import { useTickets, useCreateTicket } from "@/hooks/useTickets";
import { Category, CATEGORY_LABELS, Priority, Ticket } from "@/types/ticket";
import { formatTimeAgo, isOverdue } from "@/lib/ticket-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RatingModal } from "@/components/RatingModal";
import { MIAjudaChat } from "@/components/MIAjudaChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDemandTypes } from "@/hooks/useDemandTypes";
import { DemandField } from "@/types/demands";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";

const categoryIcons: Record<string, React.ElementType> = {
  abertura_conta: UserPlus, atualizacao_cadastral: FileEdit, portabilidade: ArrowLeftRight,
  renda_variavel: TrendingUp, renda_fixa: Landmark, seguros: Shield,
  credito: CreditCard, pj: Building2, problema_tecnico: AlertTriangle, outro: MoreHorizontal,
};

export default function PortalPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [attachmentsByKey, setAttachmentsByKey] = useState<Record<string, File[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [ratingTicket, setRatingTicket] = useState<Ticket | null>(null);

  const { data: myTickets = [], isLoading } = useTickets();
  const { mutate: createTicket, isPending: isCreating } = useCreateTicket();
  const { data: demandTypes = [] } = useDemandTypes();

  const categories = useMemo(() => {
    return demandTypes.filter((t) => t.active && t.fields.length > 0).map((t) => [t.id, t.label] as [Category, string]);
  }, [demandTypes]);

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = { ...CATEGORY_LABELS };
    for (const t of demandTypes) map[t.id] = t.label;
    return map;
  }, [demandTypes]);

  const selectedDemandType = useMemo(() => {
    if (!selectedCategory) return undefined;
    return demandTypes.find((t) => t.id === selectedCategory);
  }, [demandTypes, selectedCategory]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateDynamicFields = () => {
    if (!selectedDemandType) return true;
    for (const f of selectedDemandType.fields) {
      if (!f.required) continue;
      if (f.fieldType === "attachment") {
        const files = attachmentsByKey[f.key] ?? [];
        if (files.length === 0) {
          toast.error(`Anexe o(s) arquivo(s) em: ${f.label}`);
          return false;
        }
      } else {
        const v = String(formData[f.key] ?? "").trim();
        if (!v) {
          toast.error(`Preencha o campo: ${f.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const renderDynamicField = (f: DemandField) => {
    if (f.fieldType === "textarea") {
      return (
        <div key={f.id}>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
          <textarea
            value={String(formData[f.key] ?? "")}
            onChange={(e) => updateField(f.key, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>
      );
    }

    if (f.fieldType === "select") {
      const options = f.options ?? (["prioridade", "priority"].includes(f.key) ? (["baixa", "media", "alta", "urgente"] as string[]) : []);
      return (
        <div key={f.id}>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
          <select
            value={String(formData[f.key] ?? "")}
            onChange={(e) => updateField(f.key, e.target.value)}
            className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Selecione...</option>
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      );
    }

    if (f.fieldType === "date") {
      const value = String(formData[f.key] ?? "").trim();
      const selected = value ? parseISO(value) : undefined;
      const label = selected ? format(selected, "dd/MM/yyyy") : "Selecionar data";
      return (
        <div key={f.id}>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className={cn(!selected && "text-muted-foreground")}>{label}</span>
                </span>
                {selected && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      updateField(f.key, "");
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={(d) => updateField(f.key, d ? format(d, "yyyy-MM-dd") : "")}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    if (f.fieldType === "attachment") {
      const count = (attachmentsByKey[f.key] ?? []).length;
      return (
        <div key={f.id}>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              setAttachmentsByKey((p) => ({ ...p, [f.key]: files }));
            }}
            className="w-full h-9 px-3 py-2 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {count > 0 && <p className="text-[10px] text-muted-foreground mt-1">{count} arquivo(s) selecionado(s)</p>}
        </div>
      );
    }

    return (
      <div key={f.id}>
        <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
        <input
          value={String(formData[f.key] ?? "")}
          onChange={(e) => updateField(f.key, e.target.value)}
          className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    );
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDynamicFields()) return;
    
    const pick = (keys: string[]) => {
      for (const k of keys) {
        const v = String(formData[k] ?? "").trim();
        if (v) return v;
      }
      return "";
    };

    const title = pick(["title", "titulo"]) || selectedDemandType?.label || "Demanda";
    const clientCode = pick(["clientCode", "client_code", "codigo_do_cliente", "codigo_cliente"]) || "-";
    const clientPL = pick(["clientPL", "client_pl", "pl_do_cliente", "pl_cliente"]) || "-";
    const priority = (pick(["priority", "prioridade"]) || "media") as Priority;

    const summaryLines = (selectedDemandType?.fields ?? [])
      .filter((f) => f.fieldType !== "attachment")
      .map((f) => {
        const raw = formData[f.key];
        const value = raw === null || raw === undefined ? "" : String(raw);
        if (!value.trim()) return null;
        if (f.fieldType === "date") {
          const d = value ? parseISO(value) : null;
          const formatted = d ? format(d, "dd/MM/yyyy") : value;
          return `${f.label}: ${formatted}`;
        }
        return `${f.label}: ${value}`;
      })
      .filter(Boolean) as string[];

    const description = pick(["description", "descricao"]) || (summaryLines.length > 0 ? summaryLines.join("\n") : "-");

    const extra_data: Record<string, any> = { ...formData };
    const filesEntries = Object.entries(attachmentsByKey).filter(([, files]) => files.length > 0);

    if (filesEntries.length > 0) {
      setIsUploading(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setIsUploading(false);
        toast.error("Usuário não autenticado");
        return;
      }

      const safeName = (name: string) => name.replace(/[^\w.\-]+/g, "_");
      const randomId = () => {
        const c = globalThis.crypto as Crypto | undefined;
        if (c?.randomUUID) return c.randomUUID();
        return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      };

      for (const [fieldKey, files] of filesEntries) {
        const uploaded: Array<{ url: string; name: string; size: number; type: string }> = [];
        for (const file of files) {
          const path = `demands/${selectedCategory}/${fieldKey}/${userId}/${randomId()}_${safeName(file.name)}`;
          const up = await supabase.storage.from("backmaster").upload(path, file, {
            upsert: false,
            contentType: file.type || undefined,
          });
          if (up.error) {
            setIsUploading(false);
            toast.error(`Erro ao enviar anexo (${file.name}): ${up.error.message}`);
            return;
          }
          const pub = supabase.storage.from("backmaster").getPublicUrl(path);
          uploaded.push({ url: pub.data.publicUrl, name: file.name, size: file.size, type: file.type });
        }
        extra_data[fieldKey] = uploaded;
      }
    }

    createTicket(
      {
        title,
        clientCode,
        clientPL,
        priority,
        description,
        category: selectedCategory!,
        extra_data,
      },
      {
        onSuccess: () => {
          setSelectedCategory(null);
          setFormData({});
          setAttachmentsByKey({});
          setIsUploading(false);
        },
        onError: () => {
          setIsUploading(false);
        },
      }
    );
  };
  const handleRatingSubmit = (ticketId: string, rating: number, justification: string) => {
    console.log("Rating submitted:", { ticketId, rating, justification });
  };

  const renderTicketCard = (ticket: Ticket) => {
    const overdue = isOverdue(ticket);
    const displayTicketCode = ticket.code || ticket.id;
    return (
      <div
        key={ticket.id}
        onClick={() => navigate(`/ticket/${displayTicketCode}`)}
        className={cn(
          "flex items-center justify-between p-3 rounded-xl bg-card border cursor-pointer transition-all hover:shadow-soft",
          overdue ? "border-status-danger/30 bg-status-danger/[0.03] hover:border-status-danger/50" : "border-border hover:border-primary/30"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {ticket.hasUnreadUpdate && <div className="h-2 w-2 rounded-full bg-status-warning shrink-0" title="Atualização não lida" />}
            <span className="text-[11px] text-muted-foreground">{displayTicketCode}</span>
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
              {/* Nova Demanda section with overlay */}
              <div className="relative">
                <h2 className="text-sm font-semibold text-foreground mb-3">Nova Demanda</h2>
                {categories.length === 0 ? (
                  <div className="bg-card rounded-xl border border-border p-6 text-center text-[12px] text-muted-foreground">
                    Nenhum tipo de demanda cadastrado.
                  </div>
                ) : (
                  <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 transition-all", hasPendingRatings && "blur-[2px] opacity-40")}>
                    {categories.map(([key, label]) => {
                      const Icon = categoryIcons[key] ?? MoreHorizontal;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            if (hasPendingRatings) return;
                            setSelectedCategory(key);
                            setFormData({});
                            setAttachmentsByKey({});
                          }}
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
                )}

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
                              <span className="text-[11px] text-muted-foreground shrink-0">{ticket.code || ticket.id}</span>
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
                <h2 className="text-sm font-semibold text-foreground mb-4">{categoryLabels[selectedCategory] || selectedCategory}</h2>
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {selectedDemandType?.fields.map(renderDynamicField)}
                  <button type="submit" disabled={isCreating || isUploading} className="w-full h-9 bg-primary text-primary-foreground rounded-lg text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {isUploading ? "Enviando anexos..." : isCreating ? "Criando..." : "Abrir Demanda"}
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
