import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Area, User, UserRole, UserCargo } from "@/types/ticket";
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

function isMissingRpcFunction(error: unknown) {
  const e = error as { code?: unknown; message?: unknown };
  if (typeof e?.code === "string" && e.code === "PGRST202") return true;
  if (typeof e?.message === "string" && e.message.toLowerCase().includes("could not find the function")) return true;
  return false;
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bm_profiles")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching profiles:", error);
        throw error;
      }
      
      const rows = (data ?? []) as Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        cargos: UserCargo[] | null;
        xp_code: string | null;
        area: Area | null;
        rating: number | null;
        active: boolean | null;
        avatar_url: string | null;
      }>;

      const xpCodes = Array.from(
        new Set(
          rows
            .map((p) => (p.xp_code ?? "").trim().toUpperCase())
            .filter((value) => value.length > 0)
        )
      );

      const avatarByXpCode = new Map<string, string>();
      if (xpCodes.length > 0) {
        const { data: colaboradores, error: colError } = await supabase
          .from("dados_colaboradores")
          .select("cod_assessor,foto_url")
          .in("cod_assessor", xpCodes);

        if (!colError) {
          for (const row of colaboradores ?? []) {
            const code = String((row as { cod_assessor?: string | null }).cod_assessor ?? "").trim().toUpperCase();
            const photo = (row as { foto_url?: string | null }).foto_url ?? "";
            if (code && photo) avatarByXpCode.set(code, photo);
          }
        }
      }

      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role as UserRole,
        cargos: p.cargos || [],
        xpCode: p.xp_code ?? undefined,
        area: p.area ?? undefined,
        rating: p.rating ?? undefined,
        active: p.active ?? true,
        avatar: avatarByXpCode.get((p.xp_code ?? "").trim().toUpperCase()) ?? p.avatar_url ?? undefined,
      })) as User[];
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("bm_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching current user profile:", error);
        return null;
      }

      let avatarFromColaboradores: string | null = null;
      if (data.xp_code && String(data.xp_code).trim().length > 0) {
        const { data: colaboradores, error: colError } = await supabase
          .from("dados_colaboradores")
          .select("foto_url")
          .ilike("cod_assessor", data.xp_code)
          .limit(1);

        if (!colError && Array.isArray(colaboradores) && colaboradores.length > 0) {
          avatarFromColaboradores = colaboradores[0]?.foto_url ?? null;
        }
      }
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        cargos: data.cargos || [],
        xpCode: data.xp_code ?? undefined,
        area: data.area,
        rating: data.rating,
        active: data.active ?? true,
        avatar: avatarFromColaboradores ?? data.avatar_url,
      } as User;
    },
  });
}

// Nota: A exclusão real (soft delete) ou criação de usuários 
// geralmente envolve a tabela auth.users. 
// Estas mutations são exemplos para a tabela bm_profiles.

// Hook para buscar usuários do Auth que ainda não têm perfil
export function useAuthUsersWithoutProfile() {
  return useQuery({
    queryKey: ["authUsersWithoutProfile"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_auth_users_without_profile");
      if (error) {
        console.error("Error fetching auth users:", error);
        throw error;
      }
      
      const users = data as { id: string; email: string }[];
      return users.sort((a, b) => a.email.localeCompare(b.email));
    },
  });
}

// Hook para criar um perfil via RPC (contorna o RLS usando SECURITY DEFINER)
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProfile: { id: string; email: string; name: string; role: UserRole; cargos: UserCargo[]; xpCode?: string }) => {
      const { error } = await supabase.rpc("create_bm_profile", {
        p_id: newProfile.id,
        p_email: newProfile.email,
        p_name: newProfile.name,
        p_role: newProfile.role,
        p_cargos: newProfile.cargos,
      });

      if (error) throw error;

      if (newProfile.xpCode && newProfile.xpCode.trim().length > 0) {
        const rpc = await supabase.rpc("update_bm_profile", {
          p_id: newProfile.id,
          p_name: newProfile.name,
          p_role: newProfile.role,
          p_cargos: newProfile.cargos,
          p_xp_code: newProfile.xpCode,
        });

        if (rpc.error) throw rpc.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["authUsersWithoutProfile"] });
      toast.success("Perfil criado com sucesso!");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao criar perfil: " + getErrorMessage(error));
    },
  });
}

export function useUpdateProfileStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("bm_profiles")
        .update({ active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Status do usuário atualizado.");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao atualizar usuário: " + getErrorMessage(error));
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, role, cargos, xpCode }: { id: string; name: string; role: UserRole; cargos: UserCargo[]; xpCode?: string }) => {
      const rpcPayload = {
        p_id: id,
        p_name: name,
        p_role: role,
        p_cargos: cargos,
        p_xp_code: xpCode && xpCode.trim().length > 0 ? xpCode : null,
      };

      const rpc = await supabase.rpc("update_bm_profile", rpcPayload);

      if (rpc.error) {
        if (!isMissingRpcFunction(rpc.error)) throw rpc.error;

        const { error } = await supabase
          .from("bm_profiles")
          .update({ name, role, cargos, xp_code: rpcPayload.p_xp_code })
          .eq("id", id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error: unknown) => {
      toast.error("Erro ao atualizar usuário: " + getErrorMessage(error));
    },
  });
}
