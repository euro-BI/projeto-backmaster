import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { User, UserRole, UserCargo } from "@/types/ticket";
import { toast } from "sonner";

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
      
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role as UserRole,
        cargos: p.cargos || [],
        area: p.area,
        rating: p.rating,
        active: p.active ?? true,
        avatar: p.avatar_url,
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
      
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        cargos: data.cargos || [],
        area: data.area,
        rating: data.rating,
        active: data.active ?? true,
        avatar: data.avatar_url,
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

// Hook para criar um perfil (inserir na bm_profiles)
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProfile: { id: string; email: string; name: string; role: string; cargos: string[] }) => {
      const { error } = await supabase
        .from("bm_profiles")
        .insert([{
          id: newProfile.id,
          email: newProfile.email,
          name: newProfile.name,
          role: newProfile.role,
          cargos: newProfile.cargos,
          active: true,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["authUsersWithoutProfile"] });
      toast.success("Perfil criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar perfil: " + error.message);
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
    onError: (error: any) => {
      toast.error("Erro ao atualizar usuário: " + error.message);
    },
  });
}
