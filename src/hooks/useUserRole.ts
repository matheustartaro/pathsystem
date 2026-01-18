import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'funcionario' | 'visualizador';

interface UserRole {
  role: AppRole;
  user_id: string;
}

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole('visualizador'); // Default role
      } else {
        setRole(data?.role as AppRole || 'visualizador');
      }
      setIsLoading(false);
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isManager = role === 'admin' || role === 'funcionario';
  const isViewer = role === 'visualizador';

  const hasPermission = useCallback((requiredRole: AppRole): boolean => {
    if (!role) return false;
    
    const roleHierarchy: Record<AppRole, number> = {
      admin: 3,
      funcionario: 2,
      visualizador: 1,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  }, [role]);

  const canManageProjects = isManager;
  const canManageFinances = isAdmin;
  const canManageUsers = isAdmin;
  const canViewReports = isManager;

  return {
    role,
    isLoading,
    isAdmin,
    isManager,
    isViewer,
    hasPermission,
    canManageProjects,
    canManageFinances,
    canManageUsers,
    canViewReports,
  };
}
