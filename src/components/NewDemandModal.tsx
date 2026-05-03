import { useState } from "react";
import {
  UserPlus, FileEdit, ArrowLeftRight, TrendingUp, Landmark,
  Shield, CreditCard, Building2, AlertTriangle, MoreHorizontal,
  X, Plus, ChevronRight, ArrowLeft
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Category, CATEGORY_LABELS, Priority, PRIORITY_LABELS } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { useCreateTicket } from "@/hooks/useTickets";
import { currentUser } from "@/data/mockData";

const categoryIcons: Record<Category, React.ElementType> = {
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

const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];

interface NewDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewDemandModal({ isOpen, onClose }: NewDemandModalProps) {
  const [step, setStep] = useState<"category" | "form">("category");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    title: "",
    clientCode: "",
    clientPL: "",
    priority: "media",
    description: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { mutate: createTicket, isPending: isCreating } = useCreateTicket();

  const canSelectPriority = (currentUser.rating ?? 0) > 7;

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setStep("form");
  };

  const handleBack = () => {
    setStep("category");
    setSelectedCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Separating base fields from dynamic ones
    const { title, clientCode, clientPL, priority, description, ...extra_data } = formData;
    
    createTicket({
      title,
      clientCode,
      clientPL,
      priority: priority as Priority,
      description,
      category: selectedCategory!,
      extra_data
    }, {
      onSuccess: () => {
        onClose();
        setTimeout(() => {
          setStep("category");
          setSelectedCategory(null);
          setFormData({ title: "", clientCode: "", clientPL: "", priority: "media", description: "" });
        }, 300);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("transition-all duration-300 sm:max-w-[500px]", step === "category" ? "sm:max-w-[600px]" : "sm:max-w-[500px]")}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            {step === "form" && (
              <button onClick={handleBack} className="p-1 hover:bg-muted rounded-full transition-colors">
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <DialogTitle className="text-lg font-semibold">
              {step === "category" ? "Nova Demanda" : CATEGORY_LABELS[selectedCategory!]}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === "category" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {categories.map(([key, label]) => {
              const Icon = categoryIcons[key];
              return (
                <button
                  key={key}
                  onClick={() => handleCategorySelect(key)}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-soft transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground text-center leading-tight group-hover:text-foreground">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 animate-fade-in">
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Título</label>
                <input
                  required
                  autoFocus
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Descreva brevemente a demanda"
                />
              </div>

              {/* Dynamic fields based on category */}
              {selectedCategory === "abertura_conta" && (
                <div className="animate-slide-up">
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Tipo de Conta</label>
                  <select
                    value={formData.accountType || ""}
                    onChange={(e) => updateField("accountType", e.target.value)}
                    className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Selecione...</option>
                    <option value="pf">Pessoa Física (PF)</option>
                    <option value="pj">Pessoa Jurídica (PJ)</option>
                    <option value="estrangeiro">Estrangeiro</option>
                  </select>
                </div>
              )}

              {(selectedCategory === "renda_fixa" || selectedCategory === "renda_variavel") && (
                <div className="animate-slide-up">
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Ativo / Ticker</label>
                  <input
                    value={formData.asset || ""}
                    onChange={(e) => updateField("asset", e.target.value)}
                    className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Ex: PETR4, CDB Banco X..."
                  />
                </div>
              )}

              {selectedCategory === "seguros" && (
                <div className="animate-slide-up">
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Tipo de Seguro</label>
                  <select
                    value={formData.insuranceType || ""}
                    onChange={(e) => updateField("insuranceType", e.target.value)}
                    className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Selecione...</option>
                    <option value="vida">Vida</option>
                    <option value="auto">Automóvel</option>
                    <option value="residencial">Residencial</option>
                    <option value="saude">Saúde</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Código do Cliente</label>
                  <input
                    required
                    value={formData.clientCode}
                    onChange={(e) => updateField("clientCode", e.target.value)}
                    className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="0000"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">PL do Cliente</label>
                  <input
                    required
                    value={formData.clientPL}
                    onChange={(e) => updateField("clientPL", e.target.value)}
                    className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Prioridade</label>
                {canSelectPriority ? (
                  <select
                    value={formData.priority}
                    onChange={(e) => updateField("priority", e.target.value)}
                    className="w-full h-10 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {(["baixa", "media", "alta", "urgente"] as Priority[]).map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-[12px] text-foreground">Média</span>
                    <span className="text-[10px] text-muted-foreground">(nota ≥ 7 para escolher)</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Descrição</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder="Detalhe a solicitação..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Anexos</label>
                <div className="border border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors cursor-pointer group">
                  <Plus className="h-5 w-5 text-muted-foreground mx-auto mb-1 group-hover:text-primary" />
                  <p className="text-[11px] text-muted-foreground">Arraste arquivos ou clique para anexar</p>
                </div>
              </div>
            </div>
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
                disabled={isCreating}
                className="flex-2 h-10 bg-primary text-primary-foreground rounded-lg text-[13px] font-medium hover:bg-primary/90 transition-colors px-8 disabled:opacity-50"
              >
                {isCreating ? "Criando..." : "Abrir Demanda"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
