import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Ticket, Category, Priority, Status, StatusChange, TicketMessage } from "@/types/ticket";
import { toast } from "sonner";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error) {
    const e = error as { message?: unknown; details?: unknown; hint?: unknown };
    const parts = [e.message, e.details, e.hint].filter((p) => typeof p === "string" && p.trim().length > 0) as string[];
    if (parts.length > 0) return parts.join(" — ");
  }
  if (typeof error === "string") return error;
  return "Erro desconhecido";
}

function isMissingRelation(error: unknown) {
  const e = error as { code?: unknown; message?: unknown };
  if (typeof e?.code === "string" && e.code === "42P01") return true;
  if (typeof e?.message === "string" && e.message.toLowerCase().includes("does not exist")) return true;
  return false;
}

function isMissingColumn(error: unknown) {
  const e = error as { code?: unknown; message?: unknown };
  if (typeof e?.code === "string" && e.code === "42703") return true;
  if (typeof e?.message === "string" && e.message.toLowerCase().includes("column") && e.message.toLowerCase().includes("does not exist")) return true;
  return false;
}

function isRlsError(error: unknown) {
  const e = error as { code?: unknown; message?: unknown };
  if (typeof e?.code === "string" && e.code === "42501") return true;
  if (typeof e?.message === "string" && e.message.toLowerCase().includes("row-level security policy")) return true;
  return false;
}

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      // Fazendo o join com bm_profiles para pegar os nomes
      const { data, error } = await supabase
        .from("bm_tickets")
        .select(`
          *,
          creator:bm_profiles!bm_tickets_created_by_fkey(name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        throw error;
      }
      
      return data.map((t: any) => ({
        ...t,
        id: t.id,
        code: t.ticket_code ?? t.bm_code ?? t.code ?? undefined,
        title: t.title,
        description: t.description,
        category: t.category_id || t.category, // Assuming category_id or category
        demandType: t.demand_type,
        status: t.status,
        priority: t.priority,
        clientCode: t.client_code,
        clientPL: t.client_pl,
        extraData: t.extra_data ?? {},
        createdBy: t.created_by,
        assignees: t.assignees || [],
        attendants: t.attendants || [],
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
        closedAt: t.closed_at ? new Date(t.closed_at) : undefined,
        createdByName: t.creator?.name || "Desconhecido",
        assigneeNames: t.assignee_names || [],
        attendantNames: t.attendant_names || [],
        rating: t.rating,
        pendingRating: t.pending_rating || false,
        messages: [],
        statusHistory: [],
        linkedTickets: [],
      })) as Ticket[];
    },
  });
}

export function useTicketStatusHistory(ticketId?: string) {
  return useQuery({
    queryKey: ["ticketStatusHistory", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const base = supabase
        .from("bm_ticket_status_history")
        .select(`
          *,
          changer:bm_profiles!bm_ticket_status_history_changed_by_fkey(name)
        `)
        .eq("ticket_id", ticketId);

      let data: any[] | null = null;
      let error: any = null;

      const primary = await base.order("created_at", { ascending: true });
      data = primary.data as any[] | null;
      error = primary.error;

      if (error && isMissingColumn(error)) {
        const fallback = await base.order("changed_at", { ascending: true });
        data = fallback.data as any[] | null;
        error = fallback.error;
      }

      if (error) {
        if (isMissingRelation(error)) return [] as StatusChange[];
        throw error;
      }

      return (data ?? []).map((r: any) => ({
        id: r.id,
        ticketId: r.ticket_id,
        fromStatus: r.from_status,
        toStatus: r.to_status,
        changedBy: r.changed_by,
        changedByName: r.changer?.name ?? undefined,
        changedAt: new Date(r.created_at ?? r.changed_at ?? new Date().toISOString()),
      })) as StatusChange[];
    },
  });
}

export function useTicketMessages(ticketId?: string) {
  return useQuery({
    queryKey: ["ticketMessages", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bm_ticket_messages")
        .select(`
          *,
          sender:bm_profiles!bm_ticket_messages_user_id_fkey(name)
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) {
        if (isMissingRelation(error)) return [] as TicketMessage[];
        throw error;
      }

      return (data ?? []).map((row: any) => ({
        id: row.id,
        ticketId: row.ticket_id,
        userId: row.user_id,
        userName: row.sender?.name ?? "Usuário",
        content: row.content ?? "",
        attachments: Array.isArray(row.attachments) ? row.attachments : [],
        isInternal: !!row.is_internal,
        createdAt: new Date(row.created_at ?? new Date().toISOString()),
      })) as TicketMessage[];
    },
  });
}

export function useCreateTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      ticketId: string;
      content: string;
      attachments?: string[];
      isInternal?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("bm_ticket_messages")
        .insert([
          {
            ticket_id: payload.ticketId,
            user_id: user.id,
            content: payload.content,
            attachments: payload.attachments ?? [],
            is_internal: !!payload.isInternal,
          },
        ])
        .select("id")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ticketMessages", vars.ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: unknown) => {
      toast.error("Erro ao enviar mensagem: " + getErrorMessage(error));
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: async ({ ticketId, toStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["tickets"] });
      const previousTickets = queryClient.getQueryData<Ticket[]>(["tickets"]);

      queryClient.setQueryData<Ticket[]>(["tickets"], (current = []) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: toStatus,
                updatedAt: new Date(),
              }
            : ticket
        )
      );

      return { previousTickets };
    },
    mutationFn: async ({ ticketId, fromStatus, toStatus }: { ticketId: string; fromStatus: Status | null; toStatus: Status }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: updatedTicket, error: updateError } = await supabase
        .from("bm_tickets")
        .update({ status: toStatus, updated_at: new Date().toISOString() })
        .eq("id", ticketId)
        .select("id,status")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!updatedTicket) throw new Error("O status não foi atualizado no banco. Verifique a RLS da tabela bm_tickets.");

      const { error: historyError } = await supabase
        .from("bm_ticket_status_history")
        .insert([
          {
            ticket_id: ticketId,
            from_status: fromStatus,
            to_status: toStatus,
            changed_by: user.id,
          },
        ]);

      if (historyError && !isMissingRelation(historyError)) {
        if (isRlsError(historyError)) {
          return { historyWarning: true as const };
        }
        throw historyError;
      }

      return { historyWarning: false as const };
    },
    onSuccess: (data, vars) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (current = []) =>
        current.map((ticket) =>
          ticket.id === vars.ticketId
            ? {
                ...ticket,
                status: vars.toStatus,
                updatedAt: new Date(),
              }
            : ticket
        )
      );
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticketStatusHistory", vars.ticketId] });
      if (data?.historyWarning) {
        toast.warning("Status atualizado, mas o histórico não foi salvo por causa do RLS.");
      } else {
        toast.success("Status atualizado.");
      }
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(["tickets"], context.previousTickets);
      }
      toast.error("Erro ao atualizar status: " + getErrorMessage(error));
    },
  });
}

export function useUpdateTicketAssignees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, assignees }: { ticketId: string; assignees: string[] }) => {
      const { error } = await supabase.from("bm_tickets").update({ assignees, updated_at: new Date().toISOString() }).eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Responsável atualizado.");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao atualizar responsável: " + getErrorMessage(error));
    },
  });
}

export function useUpdateTicketAttendants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, attendants }: { ticketId: string; attendants: string[] }) => {
      const { error } = await supabase.from("bm_tickets").update({ attendants, updated_at: new Date().toISOString() }).eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Atendentes atualizados.");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao atualizar atendentes: " + getErrorMessage(error));
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTicket: {
      title: string;
      description: string;
      category: Category;
      clientCode: string;
      clientPL: string;
      priority: Priority;
      extra_data?: any;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("bm_tickets")
        .insert([
          {
            title: newTicket.title,
            description: newTicket.description,
            category_id: newTicket.category,
            client_code: newTicket.clientCode,
            client_pl: newTicket.clientPL,
            priority: newTicket.priority,
            extra_data: newTicket.extra_data ?? {},
            created_by: user.id,
            status: "nova_demanda",
            demand_type: "normal",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Demanda criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar demanda: " + error.message);
    },
  });
}
