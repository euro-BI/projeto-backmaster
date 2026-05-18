import { useState } from "react";
import {
  UserPlus, FileEdit, ArrowLeftRight, TrendingUp, Landmark,
  Shield, CreditCard, Building2, AlertTriangle, MoreHorizontal,
  X, Plus, ChevronRight, ArrowLeft, Calendar as CalendarIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Category, CATEGORY_LABELS, Priority } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { useCreateTicket } from "@/hooks/useTickets";
import { useDemandTypes } from "@/hooks/useDemandTypes";
import { DemandField } from "@/types/demands";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryIcons: Record<string, React.ElementType> = {
  abertura_conta: UserPlus,
  atualizacao_cadastral: FileEdit,
  portabilidade: ArrowLeftRight,
  renda_variavel: TrendingUp,
  renda_fixa: Landmark,
  seguros: Shield,
  credito: CreditCard,
  pj: Building2,
  problema_tecnico: AlertTriangle,
  outro: MoreHorizontal,
};

interface NewDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewDemandModal({ isOpen, onClose }: NewDemandModalProps) {
  const [step, setStep] = useState<"category" | "form">("category");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
  });
  const [attachmentsByKey, setAttachmentsByKey] = useState<Record<string, File[]>>({});
  const [isUploading, setIsUploading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { mutate: createTicket, isPending: isCreating } = useCreateTicket();
  const { data: demandTypes = [] } = useDemandTypes();
  const activeDemandTypes = demandTypes.filter((t) => t.active && t.fields.length > 0);
  const demandTypeById = new Map(demandTypes.map((t) => [t.id, t]));
  const selectedDemandType = selectedCategory ? demandTypeById.get(selectedCategory) : undefined;

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setStep("form");
    setFormData({});
    setAttachmentsByKey({});
  };

  const handleBack = () => {
    setStep("category");
    setSelectedCategory(null);
  };

  const resetState = () => {
    setStep("category");
    setSelectedCategory(null);
    setFormData({});
    setAttachmentsByKey({});
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
          const url = pub.data.publicUrl;
          uploaded.push({ url, name: file.name, size: file.size, type: file.type });
        }
        extra_data[fieldKey] = uploaded;
      }
    }
    
    createTicket({
      title,
      clientCode,
      clientPL,
      priority,
      description,
      category: selectedCategory!,
      extra_data
    }, {
      onSuccess: () => {
        onClose();
        setTimeout(() => resetState(), 300);
        setIsUploading(false);
      },
      onError: () => {
        setIsUploading(false);
      }
    });
  };

  const renderDynamicField = (f: DemandField) => {
    if (f.fieldType === "textarea") {
      return (
        <div key={f.id} className="animate-slide-up">
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
        <div key={f.id} className="animate-slide-up">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
          <select
            value={String(formData[f.key] ?? "")}
            onChange={(e) => updateField(f.key, e.target.value)}
            className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
        <div key={f.id} className="animate-slide-up">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring flex items-center justify-between"
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
        <div key={f.id} className="animate-slide-up">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              setAttachmentsByKey((p) => ({ ...p, [f.key]: files }));
            }}
            className="w-full h-10 px-3 py-2 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {count > 0 && <p className="text-[10px] text-muted-foreground mt-1">{count} arquivo(s) selecionado(s)</p>}
        </div>
      );
    }

    return (
      <div key={f.id} className="animate-slide-up">
        <label className="block text-[11px] font-medium text-muted-foreground mb-1">{f.label}{f.required ? " *" : ""}</label>
        <input
          value={String(formData[f.key] ?? "")}
          onChange={(e) => updateField(f.key, e.target.value)}
          className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "transition-all duration-300 max-h-[85vh] overflow-hidden sm:max-w-[500px]",
          step === "category" ? "sm:max-w-[600px]" : "sm:max-w-[500px]"
        )}
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {step === "form" && (
              <button onClick={handleBack} className="p-1 hover:bg-muted rounded-full transition-colors">
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <DialogTitle className="text-lg font-semibold">
              {step === "category" ? "Nova Demanda" : (selectedDemandType?.label || CATEGORY_LABELS[selectedCategory! as string] || selectedCategory)}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === "category" ? (
          activeDemandTypes.length === 0 ? (
            <div className="py-10 text-center text-[12px] text-muted-foreground">
              Nenhum tipo de demanda cadastrado.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {activeDemandTypes.map((t) => {
                const Icon = categoryIcons[t.id] ?? MoreHorizontal;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleCategorySelect(t.id)}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-soft transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-[12px] font-medium text-muted-foreground text-center leading-tight group-hover:text-foreground">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 animate-fade-in">
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="space-y-3.5">
                {(selectedDemandType?.fields ?? []).map(renderDynamicField)}
              </div>
            </ScrollArea>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 text-[13px] font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating || isUploading}
                className="flex-2 h-10 bg-primary text-primary-foreground rounded-lg text-[13px] font-medium hover:bg-primary/90 transition-colors px-8 disabled:opacity-50"
              >
                {isUploading ? "Enviando anexos..." : isCreating ? "Criando..." : "Abrir Demanda"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
