import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export function useAuditLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch audit logs (admin only)
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return data.map(log => ({
        ...log,
        old_data: log.old_data as Record<string, unknown> | null,
        new_data: log.new_data as Record<string, unknown> | null,
      })) as AuditLog[];
    },
    staleTime: 1000 * 60, // 1 minute
  });

  // Log an action
  const logAction = useCallback(async ({
    action,
    tableName,
    recordId,
    oldData,
    newData,
  }: {
    action: string;
    tableName: string;
    recordId?: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
  }) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_name: user?.email?.split('@')[0] || 'Sistema',
        action,
        table_name: tableName,
        record_id: recordId || null,
        old_data: (oldData as Json) || null,
        new_data: (newData as Json) || null,
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }, [user]);

  // Convenience methods for common actions
  const logCreate = useCallback((tableName: string, recordId: string, data: Record<string, unknown>) => {
    return logAction({ action: 'CREATE', tableName, recordId, newData: data });
  }, [logAction]);

  const logUpdate = useCallback((tableName: string, recordId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>) => {
    return logAction({ action: 'UPDATE', tableName, recordId, oldData, newData });
  }, [logAction]);

  const logDelete = useCallback((tableName: string, recordId: string, data: Record<string, unknown>) => {
    return logAction({ action: 'DELETE', tableName, recordId, oldData: data });
  }, [logAction]);

  return {
    logs,
    isLoading,
    logAction,
    logCreate,
    logUpdate,
    logDelete,
  };
}
