import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectFile {
  id: string;
  project_id: string;
  nome: string;
  nome_original: string;
  tipo: string;
  tamanho: number;
  storage_path: string;
  categoria: 'documento' | 'imagem' | 'projeto' | 'contrato' | 'outro';
  uploaded_by?: string | null;
  created_at: Date;
}

async function fetchProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(f => ({
    ...f,
    categoria: f.categoria as ProjectFile['categoria'],
    created_at: new Date(f.created_at),
  }));
}

async function uploadFile(
  projectId: string, 
  file: File, 
  categoria: ProjectFile['categoria'],
  userId?: string
): Promise<ProjectFile> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `${projectId}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(storagePath, file);

  if (uploadError) throw uploadError;

  // Create database record
  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,
      nome: file.name.replace(/\.[^/.]+$/, ''),
      nome_original: file.name,
      tipo: file.type,
      tamanho: file.size,
      storage_path: storagePath,
      categoria,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) {
    // Cleanup storage on db error
    await supabase.storage.from('project-files').remove([storagePath]);
    throw error;
  }

  return {
    ...data,
    categoria: data.categoria as ProjectFile['categoria'],
    created_at: new Date(data.created_at),
  };
}

async function deleteFile(file: ProjectFile): Promise<void> {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('project-files')
    .remove([file.storage_path]);

  if (storageError) throw storageError;

  // Delete from database
  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('id', file.id);

  if (error) throw error;
}

async function getFileUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('project-files')
    .createSignedUrl(storagePath, 60 * 60); // 1 hour

  if (error) throw error;
  return data.signedUrl;
}

export function useProjectFiles(projectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => fetchProjectFiles(projectId),
    enabled: !!projectId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, categoria }: { file: File; categoria: ProjectFile['categoria'] }) =>
      uploadFile(projectId, file, categoria, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success('Arquivo enviado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar arquivo: ' + (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success('Arquivo excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir arquivo: ' + (error as Error).message);
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (tipo: string): string => {
    if (tipo.startsWith('image/')) return '🖼️';
    if (tipo.includes('pdf')) return '📄';
    if (tipo.includes('word') || tipo.includes('document')) return '📝';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return '📊';
    if (tipo.includes('zip') || tipo.includes('rar')) return '📦';
    return '📎';
  };

  return {
    files,
    isLoading,
    refetch,
    uploadFile: uploadMutation.mutateAsync,
    deleteFile: deleteMutation.mutateAsync,
    getFileUrl,
    formatFileSize,
    getFileIcon,
    isUploading: uploadMutation.isPending,
  };
}
