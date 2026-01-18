import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from './useUserRole';

export interface TeamMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  // Joined profile data
  profile?: {
    nome: string;
    email: string | null;
    avatar_url: string | null;
  };
}

export function useTeamManagement() {
  const queryClient = useQueryClient();

  // Fetch all team members with their roles
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return [];
      }

      // Fetch profiles separately
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email, avatar_url')
        .in('id', userIds);

      // Combine the data
      return roles.map(r => ({
        ...r,
        role: r.role as AppRole,
        profile: profiles?.find(p => p.id === r.user_id) || null,
      })) as TeamMember[];
    },
  });

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Permissão atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar permissão');
    },
  });

  // Remove user role
  const removeRoleMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Membro removido!');
    },
    onError: () => {
      toast.error('Erro ao remover membro');
    },
  });

  // Get role label
  const getRoleLabel = (role: AppRole): string => {
    const labels: Record<AppRole, string> = {
      admin: 'Administrador',
      funcionario: 'Funcionário',
      visualizador: 'Visualizador',
    };
    return labels[role] || role;
  };

  // Get role description
  const getRoleDescription = (role: AppRole): string => {
    const descriptions: Record<AppRole, string> = {
      admin: 'Acesso total ao sistema, incluindo configurações e gestão de usuários',
      funcionario: 'Gerenciar projetos, orçamentos e relatórios',
      visualizador: 'Visualizar informações sem poder editar',
    };
    return descriptions[role] || '';
  };

  return {
    members,
    isLoading,
    updateRole: updateRoleMutation.mutateAsync,
    removeRole: removeRoleMutation.mutateAsync,
    getRoleLabel,
    getRoleDescription,
  };
}
