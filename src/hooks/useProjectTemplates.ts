import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TemplateTask {
  id: string;
  template_id: string;
  nome: string;
  descricao: string | null;
  dias_offset_inicio: number;
  dias_offset_fim: number;
  ordem: number;
  created_at: string;
}

export interface TemplateItem {
  id: string;
  template_id: string;
  item_type: 'service' | 'product';
  service_id: string | null;
  product_id: string | null;
  nome: string | null;
  quantidade: number;
  is_manual: boolean;
  created_at: string;
  // Joined data
  service?: { nome: string; preco_venda: number } | null;
  product?: { nome: string; preco_venda: number } | null;
}

export interface ProjectTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  duracao_dias: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Related data
  tasks?: TemplateTask[];
  items?: TemplateItem[];
}

export function useProjectTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['project-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_templates')
        .select(`
          *,
          tasks:template_tasks(*),
          items:template_items(
            *,
            service:services(nome, preco_venda),
            product:products(nome, preco_venda)
          )
        `)
        .order('nome');

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }

      return data.map(t => ({
        ...t,
        tasks: t.tasks?.sort((a: TemplateTask, b: TemplateTask) => a.ordem - b.ordem) || [],
        items: t.items?.map((item: Record<string, unknown>) => ({
          ...item,
          item_type: item.item_type as 'service' | 'product',
        })) || [],
      })) as ProjectTemplate[];
    },
  });

  // Create template
  const createMutation = useMutation({
    mutationFn: async (template: Omit<ProjectTemplate, 'id' | 'created_at' | 'updated_at' | 'tasks' | 'items'>) => {
      const { data, error } = await supabase
        .from('project_templates')
        .insert({
          ...template,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar template');
    },
  });

  // Update template
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('project_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast.success('Template atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar template');
    },
  });

  // Delete template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
      toast.success('Template excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir template');
    },
  });

  // Add task to template
  const addTaskMutation = useMutation({
    mutationFn: async (task: Omit<TemplateTask, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('template_tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
    },
  });

  // Delete task from template
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('template_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
    },
  });

  // Add item to template
  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<TemplateItem, 'id' | 'created_at' | 'service' | 'product'>) => {
      const { data, error } = await supabase
        .from('template_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
    },
  });

  // Delete item from template
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('template_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    addTask: addTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    addItem: addItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    getTemplateById: (id: string) => templates.find(t => t.id === id),
  };
}
