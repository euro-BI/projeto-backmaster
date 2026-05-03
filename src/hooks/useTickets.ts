import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Ticket, Category, Priority } from "@/types/ticket";
import { toast } from "sonner";

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
        title: t.title,
        description: t.description,
        category: t.category_id || t.category, // Assuming category_id or category
        demandType: t.demand_type,
        status: t.status,
        priority: t.priority,
        clientCode: t.client_code,
        clientPL: t.client_pl,
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
      })) as Ticket[];
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
            ...newTicket,
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
