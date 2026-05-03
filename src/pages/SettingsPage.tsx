import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useProfiles, useUpdateProfileStatus, useAuthUsersWithoutProfile, useCreateProfile } from "@/hooks/useProfiles";
import { CATEGORY_LABELS, Category, CARGO_LABELS, UserCargo, User, UserRole } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { Users, FileText, Plus, Edit2, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Tab = "users" | "demands";

interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  required: boolean;
}

const defaultFields: FormField[] = [
  { id: "title", label: "Título", type: "text", required: true },
  { id: "clientCode", label: "Código do Cliente", type: "text", required: true },
  { id: "clientPL", label: "PL do Cliente", type: "text", required: true },
  { id: "description", label: "Descrição", type: "textarea", required: true },
];

const allCargos: UserCargo[] = ["gestor", "atendente_senior", "atendente_pleno", "atendente_junior", "atendente_treinamento", "mesa_rv", "mesa_rf", "assessor"];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ authId: "", email: "", name: "", role: "assessor" as UserRole, cargos: [] as UserCargo[] });

  const tabs = [
    { key: "users" as Tab, label: "Usuários", icon: Users },
    { key: "demands" as Tab, label: "Demandas", icon: FileText },
  ];

  const { data: profiles = [], isLoading } = useProfiles();
  const { mutate: updateStatus } = useUpdateProfileStatus();
  const { data: authUsers = [], isLoading: isLoadingAuthUsers } = useAuthUsersWithoutProfile();
  const { mutate: createProfile, isPending: isCreating } = useCreateProfile();

  const gestores = profiles.filter(u => u.role === "gestor" && u.active);
  const atendentes = profiles.filter(u => u.role === "atendente" && u.active);
  const assessores = profiles.filter(u => u.role === "assessor" && u.active);
  const excluidos = profiles.filter(u => !u.active);

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    setFields([...fields, { id: `field_${Date.now()}`, label: newFieldLabel.trim(), type: "text", required: false }]);
    setNewFieldLabel("");
    toast.success("Campo adicionado");
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    toast.success("Campo removido");
  };

  const toggleRequired = (id: string) => {
    setFields(fields.map((f) => f.id === id ? { ...f, required: !f.required } : f));
  };

  const updateFieldType = (id: string, type: FormField["type"]) => {
    setFields(fields.map((f) => f.id === id ? { ...f, type } : f));
  };

  const toggleCargo = (cargo: UserCargo) => {
    setNewUser(prev => ({
      ...prev,
      cargos: prev.cargos.includes(cargo) ? prev.cargos.filter(c => c !== cargo) : [...prev.cargos, cargo]
    }));
  };

  const handleCreateUser = () => {
    if (!newUser.authId || !newUser.name.trim() || !newUser.role || newUser.cargos.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    createProfile({
      id: newUser.authId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      cargos: newUser.cargos,
    }, {
      onSuccess: () => {
        setShowNewUserModal(false);
        setNewUser({ authId: "", email: "", name: "", role: "assessor", cargos: [] });
      }
    });
  };

  const handleDeleteUser = () => {
    if (deleteUser) {
      updateStatus({ id: deleteUser.id, active: false }, {
        onSuccess: () => {
          setDeleteUser(null);
        }
      });
    }
  };

  const UserBlock = ({ title, users, maxVisible = 5 }: { title: string; users: User[]; maxVisible?: number }) => {
    if (users.length === 0) return null;
    return (
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[12px] font-semibold text-foreground">{title} ({users.length})</h3>
        </div>
        <ScrollArea className={users.length > maxVisible ? "h-[280px]" : ""}>
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {user.cargos.map(c => (
                      <span key={c} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-primary/10 text-primary">
                        {CARGO_LABELS[c]}
                      </span>
                    ))}
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", user.active ? "bg-status-success/10 text-status-success" : "bg-status-danger/10 text-status-danger")}>
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toast.info("Editar usuário — em breve")} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteUser(user)} className="p-1.5 rounded-lg hover:bg-status-danger/10 transition-colors text-muted-foreground hover:text-status-danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Configurações" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">

          {/* Tab switcher — centered */}
          <div className="flex items-center justify-center gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-medium transition-all border flex items-center gap-1.5",
                  tab === t.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/40"
                )}
              >
                <t.icon className="h-3.5 w-3.5" />{t.label}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground animate-pulse">
              Carregando dados...
            </div>
          )}

          {/* Users tab */}
          {!isLoading && tab === "users" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowNewUserModal(true)} className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
                  <Plus className="h-3 w-3" />Novo Usuário
                </button>
              </div>
              <UserBlock title="Gestores" users={gestores} />
              <UserBlock title="Atendentes" users={atendentes} />
              <UserBlock title="Assessores" users={assessores} />
              <UserBlock title="Excluídos" users={excluidos} />
            </div>
          )}

          {/* Demands tab */}
          {!isLoading && tab === "demands" && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
                <h2 className="text-[13px] font-semibold text-foreground mb-3">Tipos de Demanda</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                      className={cn(
                        "p-3 rounded-xl text-[11px] font-medium text-center transition-all border",
                        selectedCategory === key ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-foreground hover:border-primary/40"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <button onClick={() => toast.info("Criar tipo — em breve")} className="p-3 rounded-xl text-[11px] font-medium text-center transition-all border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground flex items-center justify-center gap-1">
                    <Plus className="h-3 w-3" />Novo Tipo
                  </button>
                </div>
              </div>

              {selectedCategory && (
                <div className="bg-card rounded-xl border border-border p-4 shadow-soft animate-fade-in">
                  <h3 className="text-[13px] font-semibold text-foreground mb-4">
                    Campos — {CATEGORY_LABELS[selectedCategory]}
                  </h3>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div key={field.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                        <div className="flex-1">
                          <p className="text-[12px] font-medium text-foreground">{field.label}</p>
                        </div>
                        <select
                          value={field.type}
                          onChange={(e) => updateFieldType(field.id, e.target.value as FormField["type"])}
                          className="h-7 px-2 text-[11px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="select">Seleção</option>
                          <option value="textarea">Texto longo</option>
                        </select>
                        <button onClick={() => toggleRequired(field.id)} className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors", field.required ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-transparent")}>
                          {field.required ? "Obrigatório" : "Opcional"}
                        </button>
                        <button onClick={() => removeField(field.id)} className="p-1 rounded-lg hover:bg-status-danger/10 text-muted-foreground hover:text-status-danger transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addField()}
                      placeholder="Nome do novo campo"
                      className="flex-1 h-8 px-3 text-[12px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button onClick={addField} className="h-8 px-3 rounded-lg text-[12px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1">
                      <Plus className="h-3 w-3" />Adicionar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New User Modal */}
      <Dialog open={showNewUserModal} onOpenChange={setShowNewUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">E-mail (Auth) *</label>
              {isLoadingAuthUsers ? (
                <div className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg flex items-center text-muted-foreground">Carregando e-mails...</div>
              ) : authUsers.length === 0 ? (
                <div className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg flex items-center text-muted-foreground border border-status-warning/30">Nenhum usuário sem perfil encontrado.</div>
              ) : (
                <select 
                  value={newUser.authId} 
                  onChange={(e) => {
                    const selected = authUsers.find(u => u.id === e.target.value);
                    setNewUser({...newUser, authId: e.target.value, email: selected?.email || ""});
                  }} 
                  className="w-full h-9 px-2 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="" disabled>Selecione um e-mail cadastrado no Auth</option>
                  {authUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nome Completo *</label>
              <input value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Nome" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Função (Role) *</label>
              <select 
                value={newUser.role} 
                onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})} 
                className="w-full h-9 px-2 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="assessor">Assessor</option>
                <option value="atendente">Atendente</option>
                <option value="gestor">Gestor</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Cargos/Especialidades *</label>
              <div className="flex flex-wrap gap-1.5">
                {allCargos.map(c => (
                  <button key={c} type="button" onClick={() => toggleCargo(c)} className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors", newUser.cargos.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:border-border")}>
                    {CARGO_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowNewUserModal(false)} className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={handleCreateUser} disabled={isCreating || !newUser.authId} className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isCreating ? "Criando..." : "Criar Perfil"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-[13px] text-foreground">
              Tem certeza que deseja remover <strong>{deleteUser?.name}</strong>? O usuário será desativado (soft delete).
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteUser(null)} className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button onClick={handleDeleteUser} className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-status-danger text-status-danger-foreground hover:bg-status-danger/90 transition-colors">
                Remover
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
