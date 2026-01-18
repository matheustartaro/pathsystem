import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface ProjectActivity {
  id: string;
  project_id: string;
  tipo: 'criacao' | 'atualizacao' | 'status' | 'tarefa' | 'arquivo' | 'comentario' | 'financeiro';
  descricao: string;
  metadata?: Record<string, unknown> | null;
  user_id?: string | null;
  user_name?: string | null;
  created_at: Date;
}

async function fetchProjectActivities(projectId: string): Promise<ProjectActivity[]> {
  const { data, error } = await supabase
    .from('project_activities')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map(a => ({
    ...a,
    tipo: a.tipo as ProjectActivity['tipo'],
    metadata: a.metadata as Record<string, unknown> | null,
    created_at: new Date(a.created_at),
  }));
}

async function createActivity(
  projectId: string,
  tipo: ProjectActivity['tipo'],
  descricao: string,
  metadata?: Record<string, unknown>,
  userId?: string,
  userName?: string
): Promise<ProjectActivity> {
  const { data, error } = await supabase
    .from('project_activities')
    .insert([{
      project_id: projectId,
      tipo,
      descricao,
      metadata: (metadata as Json) || null,
      user_id: userId,
      user_name: userName,
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    tipo: data.tipo as ProjectActivity['tipo'],
    metadata: data.metadata as Record<string, unknown> | null,
    created_at: new Date(data.created_at),
  };
}

export function useProjectActivities(projectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ['project-activities', projectId],
    queryFn: () => fetchProjectActivities(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: ({ 
      tipo, 
      descricao, 
      metadata 
    }: { 
      tipo: ProjectActivity['tipo']; 
      descricao: string; 
      metadata?: Record<string, unknown>;
    }) => createActivity(projectId, tipo, descricao, metadata, user?.id, user?.email?.split('@')[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-activities', projectId] });
    },
  });

  const getActivityIcon = (tipo: ProjectActivity['tipo']): string => {
    switch (tipo) {
      case 'criacao': return '🎉';
      case 'atualizacao': return '✏️';
      case 'status': return '🔄';
      case 'tarefa': return '✅';
      case 'arquivo': return '📎';
      case 'comentario': return '💬';
      case 'financeiro': return '💰';
      default: return '📌';
    }
  };

  const getActivityColor = (tipo: ProjectActivity['tipo']): string => {
    switch (tipo) {
      case 'criacao': return 'text-green-500';
      case 'atualizacao': return 'text-blue-500';
      case 'status': return 'text-yellow-500';
      case 'tarefa': return 'text-purple-500';
      case 'arquivo': return 'text-orange-500';
      case 'comentario': return 'text-cyan-500';
      case 'financeiro': return 'text-emerald-500';
      default: return 'text-muted-foreground';
    }
  };

  return {
    activities,
    isLoading,
    refetch,
    logActivity: createMutation.mutateAsync,
    getActivityIcon,
    getActivityColor,
  };
}
