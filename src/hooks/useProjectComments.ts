import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectComment {
  id: string;
  project_id: string;
  parent_id?: string | null;
  conteudo: string;
  mencoes?: string[] | null;
  user_id?: string | null;
  user_name?: string | null;
  created_at: Date;
  updated_at: Date;
  replies?: ProjectComment[];
}

async function fetchProjectComments(projectId: string): Promise<ProjectComment[]> {
  const { data, error } = await supabase
    .from('project_comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const comments = (data || []).map(c => ({
    ...c,
    created_at: new Date(c.created_at),
    updated_at: new Date(c.updated_at),
    replies: [] as ProjectComment[],
  }));

  // Organize replies
  const rootComments: ProjectComment[] = [];
  const commentMap = new Map<string, ProjectComment>();

  comments.forEach(c => commentMap.set(c.id, c));
  comments.forEach(c => {
    if (c.parent_id && commentMap.has(c.parent_id)) {
      commentMap.get(c.parent_id)!.replies!.push(c);
    } else if (!c.parent_id) {
      rootComments.push(c);
    }
  });

  return rootComments;
}

async function createComment(
  projectId: string,
  conteudo: string,
  parentId?: string,
  mencoes?: string[],
  userId?: string,
  userName?: string
): Promise<ProjectComment> {
  const { data, error } = await supabase
    .from('project_comments')
    .insert({
      project_id: projectId,
      parent_id: parentId || null,
      conteudo,
      mencoes: mencoes || [],
      user_id: userId,
      user_name: userName,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
}

async function updateComment(id: string, conteudo: string): Promise<void> {
  const { error } = await supabase
    .from('project_comments')
    .update({ conteudo })
    .eq('id', id);

  if (error) throw error;
}

async function deleteComment(id: string): Promise<void> {
  // Delete replies first
  await supabase.from('project_comments').delete().eq('parent_id', id);
  
  const { error } = await supabase
    .from('project_comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useProjectComments(projectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: comments = [], isLoading, refetch } = useQuery({
    queryKey: ['project-comments', projectId],
    queryFn: () => fetchProjectComments(projectId),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: ({ 
      conteudo, 
      parentId, 
      mencoes 
    }: { 
      conteudo: string; 
      parentId?: string; 
      mencoes?: string[];
    }) => createComment(projectId, conteudo, parentId, mencoes, user?.id, user?.email?.split('@')[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      toast.success('Comentário adicionado!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar comentário: ' + (error as Error).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, conteudo }: { id: string; conteudo: string }) =>
      updateComment(id, conteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      toast.success('Comentário atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar comentário: ' + (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      toast.success('Comentário excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir comentário: ' + (error as Error).message);
    },
  });

  return {
    comments,
    isLoading,
    refetch,
    addComment: createMutation.mutateAsync,
    updateComment: (id: string, conteudo: string) => 
      updateMutation.mutateAsync({ id, conteudo }),
    deleteComment: deleteMutation.mutateAsync,
    isSubmitting: createMutation.isPending,
  };
}
