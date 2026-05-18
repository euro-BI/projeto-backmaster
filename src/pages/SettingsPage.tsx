import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { useProfiles, useUpdateProfileStatus, useAuthUsersWithoutProfile, useCreateProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { CARGO_LABELS, UserCargo, User, UserRole } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { Users, FileText, Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDemandTypes, useDeleteDemandField, useDeleteDemandType, useReorderDemandFields, useUpsertDemandField, useUpsertDemandType } from "@/hooks/useDemandTypes";
import { DemandFieldType, DemandType } from "@/types/demands";

type Tab = "users" | "demands";

const allCargos: UserCargo[] = ["gestor", "atendente_senior", "atendente_pleno", "atendente_junior", "atendente_treinamento", "mesa_rv", "mesa_rf", "assessor"];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ authId: "", email: "", name: "", role: "assessor" as UserRole, cargos: [] as UserCargo[], xpCode: "" });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", role: "assessor" as UserRole, cargos: [] as UserCargo[], xpCode: "" });
  const [selectedDemandType, setSelectedDemandType] = useState<DemandType | null>(null);
  const [demandTypeModal, setDemandTypeModal] = useState<{ open: boolean; mode: "create" | "edit"; id: string; label: string; active: boolean }>({
    open: false,
    mode: "create",
    id: "",
    label: "",
    active: true,
  });
  const [deleteDemandType, setDeleteDemandType] = useState<DemandType | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [localFieldsOrder, setLocalFieldsOrder] = useState<string[] | null>(null);
  const [fieldModal, setFieldModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    id?: string;
    demandTypeId: string;
    key: string;
    label: string;
    fieldType: DemandFieldType;
    required: boolean;
    optionsText: string;
  }>({
    open: false,
    mode: "create",
    demandTypeId: "",
    key: "",
    label: "",
    fieldType: "text",
    required: false,
    optionsText: "",
  });
  const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

  const tabs = [
    { key: "users" as Tab, label: "Usuários", icon: Users },
    { key: "demands" as Tab, label: "Demandas", icon: FileText },
  ];

  const { data: profiles = [], isLoading } = useProfiles();
  const { mutate: updateStatus } = useUpdateProfileStatus();
  const { data: authUsers = [], isLoading: isLoadingAuthUsers } = useAuthUsersWithoutProfile();
  const { mutate: createProfile, isPending: isCreating } = useCreateProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { data: demandTypes = [], isLoading: isLoadingDemandTypes } = useDemandTypes();
  const { mutate: upsertDemandType, isPending: isSavingDemandType } = useUpsertDemandType();
  const { mutate: deleteDemandTypeMut, isPending: isDeletingDemandType } = useDeleteDemandType();
  const { mutate: upsertField, isPending: isSavingField } = useUpsertDemandField();
  const { mutate: deleteFieldMut, isPending: isDeletingField } = useDeleteDemandField();
  const { mutate: reorderFields, isPending: isReorderingFields } = useReorderDemandFields();

  const gestores = profiles.filter(u => u.role === "gestor" && u.active);
  const atendentes = profiles.filter(u => u.role === "atendente" && u.active);
  const assessores = profiles.filter(u => u.role === "assessor" && u.active);
  const excluidos = profiles.filter(u => !u.active);

  const normalizeXpCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const isValidXpCode = (value: string) => /^[A-Z0-9]{1,6}$/.test(value);

  const slugify = (value: string) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

  const toggleCargo = (cargo: UserCargo) => {
    setNewUser(prev => ({
      ...prev,
      cargos: prev.cargos.includes(cargo) ? prev.cargos.filter(c => c !== cargo) : [...prev.cargos, cargo]
    }));
  };

  const toggleEditCargo = (cargo: UserCargo) => {
    setEditUserForm(prev => ({
      ...prev,
      cargos: prev.cargos.includes(cargo) ? prev.cargos.filter(c => c !== cargo) : [...prev.cargos, cargo]
    }));
  };

  const handleCreateUser = () => {
    if (!newUser.authId || !newUser.name.trim() || !newUser.role || newUser.cargos.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const xpCode = newUser.xpCode.trim();
    if (newUser.role === "assessor") {
      if (!xpCode) {
        toast.error("Informe o Código XP do assessor");
        return;
      }
      if (!isValidXpCode(xpCode)) {
        toast.error("Código XP inválido (até 6 caracteres, A-Z/0-9, uppercase)");
        return;
      }
    } else if (xpCode && !isValidXpCode(xpCode)) {
      toast.error("Código XP inválido (até 6 caracteres, A-Z/0-9, uppercase)");
      return;
    }
    
    createProfile({
      id: newUser.authId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      cargos: newUser.cargos,
      xpCode: xpCode || undefined,
    }, {
      onSuccess: () => {
        setShowNewUserModal(false);
        setNewUser({ authId: "", email: "", name: "", role: "assessor", cargos: [], xpCode: "" });
      }
    });
  };

  const handleOpenEditUser = (user: User) => {
    setEditUser(user);
    setEditUserForm({ name: user.name, role: user.role, cargos: user.cargos, xpCode: user.xpCode || "" });
  };

  const handleUpdateUser = () => {
    if (!editUser || !editUserForm.name.trim() || !editUserForm.role || editUserForm.cargos.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const xpCode = editUserForm.xpCode.trim();
    if (editUserForm.role === "assessor") {
      if (!xpCode) {
        toast.error("Informe o Código XP do assessor");
        return;
      }
      if (!isValidXpCode(xpCode)) {
        toast.error("Código XP inválido (até 6 caracteres, A-Z/0-9, uppercase)");
        return;
      }
    } else if (xpCode && !isValidXpCode(xpCode)) {
      toast.error("Código XP inválido (até 6 caracteres, A-Z/0-9, uppercase)");
      return;
    }

    updateProfile(
      { id: editUser.id, name: editUserForm.name, role: editUserForm.role, cargos: editUserForm.cargos, xpCode: xpCode || undefined },
      {
        onSuccess: () => {
          setEditUser(null);
        },
      }
    );
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

  const openCreateDemandType = () => {
    setDemandTypeModal({ open: true, mode: "create", id: "", label: "", active: true });
  };

  const openEditDemandType = (t: DemandType) => {
    setDemandTypeModal({ open: true, mode: "edit", id: t.id, label: t.label, active: t.active });
  };

  const handleSaveDemandType = () => {
    const id = demandTypeModal.mode === "edit" ? demandTypeModal.id : slugify(demandTypeModal.label);
    const label = demandTypeModal.label.trim();
    if (!id || !label) {
      toast.error("Preencha ID e Nome do tipo");
      return;
    }
    upsertDemandType(
      { id, label, active: demandTypeModal.active },
      {
        onSuccess: () => {
          setDemandTypeModal((p) => ({ ...p, open: false }));
          const next = demandTypes.find((t) => t.id === id) ?? { id, label, active: demandTypeModal.active, fields: [] };
          setSelectedDemandType(next);
          setLocalFieldsOrder(null);
        },
      }
    );
  };

  const handleDeleteDemandType = () => {
    if (!deleteDemandType) return;
    deleteDemandTypeMut(deleteDemandType.id, {
      onSuccess: () => {
        if (selectedDemandType?.id === deleteDemandType.id) setSelectedDemandType(null);
        setLocalFieldsOrder(null);
        setDeleteDemandType(null);
      },
    });
  };

  const openCreateField = (demandTypeId: string) => {
    setFieldModal({
      open: true,
      mode: "create",
      demandTypeId,
      key: "",
      label: "",
      fieldType: "text",
      required: false,
      optionsText: "",
    });
  };

  const openEditField = (demandTypeId: string, field: { id: string; key: string; label: string; fieldType: DemandFieldType; required: boolean; options?: string[] }) => {
    setFieldModal({
      open: true,
      mode: "edit",
      id: field.id,
      demandTypeId,
      key: field.key,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      optionsText: (field.options ?? []).join("\n"),
    });
  };

  const handleSaveField = () => {
    const demandTypeId = fieldModal.demandTypeId;
    const key = fieldModal.mode === "edit" ? fieldModal.key : slugify(fieldModal.label);
    const label = fieldModal.label.trim();
    if (!demandTypeId || !key || !label) {
      toast.error("Preencha chave e nome do campo");
      return;
    }

    const options = fieldModal.fieldType === "select"
      ? fieldModal.optionsText.split("\n").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const currentFields = demandTypes.find((t) => t.id === demandTypeId)?.fields ?? [];
    const nextPosition = fieldModal.mode === "create" ? (currentFields.reduce((m, f) => Math.max(m, f.position), 0) + 1) : (currentFields.find((f) => f.id === fieldModal.id)?.position ?? 0);

    upsertField(
      {
        id: fieldModal.id,
        demandTypeId,
        key,
        label,
        fieldType: fieldModal.fieldType,
        required: fieldModal.required,
        options,
        position: nextPosition,
      },
      {
        onSuccess: () => {
          setFieldModal((p) => ({ ...p, open: false }));
        },
      }
    );
  };

  const handleDeleteField = () => {
    if (!deleteFieldId) return;
    deleteFieldMut(deleteFieldId, { onSuccess: () => setDeleteFieldId(null) });
  };

  const moveInArray = (arr: string[], from: number, to: number) => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const handleDropField = (targetId: string) => {
    if (!selectedDemandTypeResolved || !draggingFieldId) return;
    const baseOrder = localFieldsOrder ?? selectedDemandTypeResolved.fields.map((f) => f.id);
    const fromIndex = baseOrder.indexOf(draggingFieldId);
    const toIndex = baseOrder.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggingFieldId(null);
      return;
    }

    const nextOrder = moveInArray(baseOrder, fromIndex, toIndex);
    setLocalFieldsOrder(nextOrder);
    setDraggingFieldId(null);

    reorderFields(
      nextOrder.map((id, idx) => ({ id, position: idx + 1 })),
      {
        onSuccess: () => setLocalFieldsOrder(null),
      }
    );
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
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                    {user.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                )}
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
                    <button onClick={() => handleOpenEditUser(user)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
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

  const selectedDemandTypeResolved = selectedDemandType ? (demandTypes.find((t) => t.id === selectedDemandType.id) ?? selectedDemandType) : null;
  const displayDemandFields = useMemo(() => {
    if (!selectedDemandTypeResolved) return [];
    const fields = selectedDemandTypeResolved.fields;
    if (!localFieldsOrder) return fields;
    const byId = new Map(fields.map((f) => [f.id, f]));
    return localFieldsOrder.map((id) => byId.get(id)).filter(Boolean) as typeof fields;
  }, [localFieldsOrder, selectedDemandTypeResolved]);

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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[13px] font-semibold text-foreground">Tipos de Demanda</h2>
                  <button
                    onClick={openCreateDemandType}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />Novo Tipo
                  </button>
                </div>

                {isLoadingDemandTypes ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground animate-pulse">
                    Carregando tipos...
                  </div>
                ) : demandTypes.length === 0 ? (
                  <div className="py-8 text-center text-[12px] text-muted-foreground">
                    Nenhum tipo cadastrado.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {demandTypes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedDemandType(selectedDemandTypeResolved?.id === t.id ? null : t);
                          setLocalFieldsOrder(null);
                        }}
                        className={cn(
                          "p-3 rounded-xl text-[11px] font-medium text-center transition-all border",
                          selectedDemandTypeResolved?.id === t.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-border text-foreground hover:border-primary/40",
                          !t.active && "opacity-70"
                        )}
                      >
                        <div className="leading-tight">{t.label}</div>
                        <div className={cn("text-[10px] mt-1", selectedDemandTypeResolved?.id === t.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {t.id}
                        </div>
                        {!t.active && (
                          <div className={cn("text-[10px] mt-1", selectedDemandTypeResolved?.id === t.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                            Inativo
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedDemandTypeResolved && (
                <div className="bg-card rounded-xl border border-border p-4 shadow-soft animate-fade-in">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-[13px] font-semibold text-foreground">
                        Campos — {selectedDemandTypeResolved.label}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{selectedDemandTypeResolved.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditDemandType(selectedDemandTypeResolved)}
                        className="h-8 px-3 rounded-lg text-[12px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
                      >
                        Editar Tipo
                      </button>
                      <button
                        onClick={() => setDeleteDemandType(selectedDemandTypeResolved)}
                        className="h-8 px-3 rounded-lg text-[12px] font-medium bg-status-danger text-status-danger-foreground hover:bg-status-danger/90 transition-colors"
                      >
                        Excluir Tipo
                      </button>
                      <button
                        onClick={() => openCreateField(selectedDemandTypeResolved.id)}
                        className="h-8 px-3 rounded-lg text-[12px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />Novo Campo
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {displayDemandFields.length === 0 ? (
                      <div className="py-6 text-center text-[12px] text-muted-foreground border border-dashed border-border rounded-lg">
                        Nenhum campo cadastrado.
                      </div>
                    ) : (
                      displayDemandFields.map((f) => (
                        <div
                          key={f.id}
                          draggable={!isReorderingFields}
                          onDragStart={() => setDraggingFieldId(f.id)}
                          onDragEnd={() => setDraggingFieldId(null)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropField(f.id)}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg border border-border transition-colors",
                            isReorderingFields ? "opacity-70" : "hover:bg-muted/30",
                            draggingFieldId === f.id && "bg-muted/40"
                          )}
                        >
                          <div className="text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-foreground truncate">{f.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{f.key} • {f.fieldType}{f.required ? " • obrigatório" : ""}</p>
                          </div>
                          <button
                            onClick={() => openEditField(selectedDemandTypeResolved.id, f)}
                            className="h-7 px-2 rounded-lg text-[11px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteFieldId(f.id)}
                            className="p-1 rounded-lg hover:bg-status-danger/10 text-muted-foreground hover:text-status-danger transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
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
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Código XP{newUser.role === "assessor" ? " *" : ""}</label>
              <input
                value={newUser.xpCode}
                onChange={(e) => setNewUser({ ...newUser, xpCode: normalizeXpCode(e.target.value) })}
                maxLength={6}
                className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Ex: ABC123"
              />
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

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">E-mail</label>
              <div className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg flex items-center text-muted-foreground">
                {editUser?.email || "-"}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nome Completo *</label>
              <input
                value={editUserForm.name}
                onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Função (Role) *</label>
              <select
                value={editUserForm.role}
                onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                className="w-full h-9 px-2 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="assessor">Assessor</option>
                <option value="atendente">Atendente</option>
                <option value="gestor">Gestor</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Código XP{editUserForm.role === "assessor" ? " *" : ""}</label>
              <input
                value={editUserForm.xpCode}
                onChange={(e) => setEditUserForm({ ...editUserForm, xpCode: normalizeXpCode(e.target.value) })}
                maxLength={6}
                className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Ex: ABC123"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Cargos/Especialidades *</label>
              <div className="flex flex-wrap gap-1.5">
                {allCargos.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleEditCargo(c)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors",
                      editUserForm.cargos.includes(c)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-transparent hover:border-border"
                    )}
                  >
                    {CARGO_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Salvando..." : "Salvar"}
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

      <Dialog open={demandTypeModal.open} onOpenChange={(open) => setDemandTypeModal((p) => ({ ...p, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{demandTypeModal.mode === "create" ? "Novo Tipo de Demanda" : "Editar Tipo de Demanda"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nome *</label>
              <input
                value={demandTypeModal.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setDemandTypeModal((p) => ({
                    ...p,
                    label,
                    id: p.mode === "create" ? slugify(label) : p.id,
                  }));
                }}
                className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Ex: Abertura de Conta"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">ID (slug) *</label>
              <input
                value={demandTypeModal.id}
                disabled
                className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
                placeholder="ex: abertura_conta"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-[12px] font-medium text-foreground">Ativo</p>
                <p className="text-[10px] text-muted-foreground">Se desativado, não aparece para abrir demanda</p>
              </div>
              <button
                type="button"
                onClick={() => setDemandTypeModal((p) => ({ ...p, active: !p.active }))}
                className={cn(
                  "h-7 px-3 rounded-full text-[11px] font-medium border transition-colors",
                  demandTypeModal.active ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-transparent"
                )}
              >
                {demandTypeModal.active ? "Ativo" : "Inativo"}
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDemandTypeModal((p) => ({ ...p, open: false }))}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDemandType}
                disabled={isSavingDemandType}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSavingDemandType ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteDemandType} onOpenChange={() => setDeleteDemandType(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Excluir Tipo de Demanda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-[13px] text-foreground">
              Tem certeza que deseja excluir <strong>{deleteDemandType?.label}</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteDemandType(null)} className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleDeleteDemandType}
                disabled={isDeletingDemandType}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-status-danger text-status-danger-foreground hover:bg-status-danger/90 transition-colors disabled:opacity-50"
              >
                {isDeletingDemandType ? "Removendo..." : "Excluir"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={fieldModal.open} onOpenChange={(open) => setFieldModal((p) => ({ ...p, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{fieldModal.mode === "create" ? "Novo Campo" : "Editar Campo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nome *</label>
              <input
                value={fieldModal.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setFieldModal((p) => ({
                    ...p,
                    label,
                    key: p.mode === "create" ? slugify(label) : p.key,
                  }));
                }}
                className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Ex: Tipo de Conta"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Chave *</label>
              <input
                value={fieldModal.key}
                disabled
                className="w-full h-9 px-3 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
                placeholder="ex: account_type"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Tipo *</label>
              <select
                value={fieldModal.fieldType}
                onChange={(e) => setFieldModal((p) => ({ ...p, fieldType: e.target.value as DemandFieldType }))}
                className="w-full h-9 px-2 text-[13px] bg-muted rounded-lg border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="select">Seleção</option>
                <option value="textarea">Texto longo</option>
                <option value="date">Data</option>
                <option value="attachment">Anexo</option>
              </select>
            </div>
            {fieldModal.fieldType === "select" && (
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">Opções (1 por linha)</label>
                <textarea
                  value={fieldModal.optionsText}
                  onChange={(e) => setFieldModal((p) => ({ ...p, optionsText: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 text-[13px] bg-muted rounded-lg border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  placeholder={"Ex:\nPessoa Física\nPessoa Jurídica\nEstrangeiro"}
                />
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-[12px] font-medium text-foreground">Obrigatório</p>
                <p className="text-[10px] text-muted-foreground">Bloqueia abertura se não preencher</p>
              </div>
              <button
                type="button"
                onClick={() => setFieldModal((p) => ({ ...p, required: !p.required }))}
                className={cn(
                  "h-7 px-3 rounded-full text-[11px] font-medium border transition-colors",
                  fieldModal.required ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-transparent"
                )}
              >
                {fieldModal.required ? "Sim" : "Não"}
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFieldModal((p) => ({ ...p, open: false }))}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveField}
                disabled={isSavingField}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSavingField ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteFieldId} onOpenChange={() => setDeleteFieldId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Excluir Campo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-[13px] text-foreground">
              Tem certeza que deseja excluir este campo?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteFieldId(null)} className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-muted text-muted-foreground hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleDeleteField}
                disabled={isDeletingField}
                className="flex-1 h-9 rounded-lg text-[13px] font-medium bg-status-danger text-status-danger-foreground hover:bg-status-danger/90 transition-colors disabled:opacity-50"
              >
                {isDeletingField ? "Removendo..." : "Excluir"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
