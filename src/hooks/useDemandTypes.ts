import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DemandField, DemandFieldType, DemandType } from "@/types/demands";

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

export function useDemandTypes() {
  return useQuery({
    queryKey: ["demandTypes"],
    queryFn: async () => {
      const { data: types, error: typesError } = await supabase
        .from("bm_demand_types")
        .select("*")
        .order("label", { ascending: true });

      if (typesError) throw typesError;

      const { data: fields, error: fieldsError } = await supabase
        .from("bm_demand_fields")
        .select("*")
        .order("position", { ascending: true });

      if (fieldsError) throw fieldsError;

      const mappedFields = (fields ?? []) as Array<{
        id: string;
        demand_type_id: string;
        key: string;
        label: string;
        field_type: DemandFieldType;
        required: boolean;
        options: string[] | null;
        position: number | null;
      }>;

      const byTypeId = new Map<string, DemandField[]>();
      for (const f of mappedFields) {
        const arr = byTypeId.get(f.demand_type_id) ?? [];
        arr.push({
          id: f.id,
          demandTypeId: f.demand_type_id,
          key: f.key,
          label: f.label,
          fieldType: f.field_type,
          required: !!f.required,
          options: f.options ?? undefined,
          position: f.position ?? 0,
        });
        byTypeId.set(f.demand_type_id, arr);
      }

      const mappedTypes = (types ?? []) as Array<{
        id: string;
        label: string;
        active: boolean | null;
      }>;

      return mappedTypes.map((t) => ({
        id: t.id,
        label: t.label,
        active: t.active ?? true,
        fields: (byTypeId.get(t.id) ?? []).sort((a, b) => a.position - b.position),
      })) as DemandType[];
    },
  });
}

export function useUpsertDemandType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; label: string; active: boolean }) => {
      const { error } = await supabase
        .from("bm_demand_types")
        .upsert([{ id: payload.id, label: payload.label, active: payload.active }], { onConflict: "id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandTypes"] });
      toast.success("Tipo de demanda salvo.");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao salvar tipo: " + getErrorMessage(error));
    },
  });
}

export function useDeleteDemandType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bm_demand_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandTypes"] });
      toast.success("Tipo de demanda removido.");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao remover tipo: " + getErrorMessage(error));
    },
  });
}

export function useUpsertDemandField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      demandTypeId: string;
      key: string;
      label: string;
      fieldType: DemandFieldType;
      required: boolean;
      options?: string[];
      position: number;
    }) => {
      const row: {
        id?: string;
        demand_type_id: string;
        key: string;
        label: string;
        field_type: DemandFieldType;
        required: boolean;
        options: string[] | null;
        position: number;
      } = {
        demand_type_id: payload.demandTypeId,
        key: payload.key,
        label: payload.label,
        field_type: payload.fieldType,
        required: payload.required,
        options: payload.options ?? null,
        position: payload.position,
      };

      if (payload.id) row.id = payload.id;

      const { error } = await supabase.from("bm_demand_fields").upsert([row], { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandTypes"] });
      toast.success("Campo salvo.");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao salvar campo: " + getErrorMessage(error));
    },
  });
}

export function useDeleteDemandField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bm_demand_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandTypes"] });
      toast.success("Campo removido.");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao remover campo: " + getErrorMessage(error));
    },
  });
}

export function useReorderDemandFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; position: number }>) => {
      await Promise.all(
        updates.map(async (u) => {
          const { error } = await supabase.from("bm_demand_fields").update({ position: u.position }).eq("id", u.id);
          if (error) throw error;
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandTypes"] });
      toast.success("Ordem dos campos atualizada.");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao reordenar campos: " + getErrorMessage(error));
    },
  });
}
