import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, ProjectStatus, Task, DEFAULT_TASKS, TASK_ORDER } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mockProjects } from '@/data/mockProjects';

const STORAGE_KEY = 'projetos-jm-data';

interface DbProject {
  id: string;
  nome: string;
  descricao: string | null;
  cliente: string;
  valor: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  progresso: number;
  prioridade: string;
  created_at: string;
  updated_at: string;
}

interface DbTask {
  id: string;
  project_id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  concluida: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch projects from Supabase or localStorage
async function fetchProjects(): Promise<Project[]> {
  try {
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*');

    if (tasksError) throw tasksError;

    return (projectsData as DbProject[]).map(p => ({
      id: p.id,
      nome: p.nome,
      cliente: p.cliente,
      descricao: p.descricao || '',
      dataInicio: new Date(p.data_inicio + 'T12:00:00'),
      dataFim: new Date(p.data_fim + 'T12:00:00'),
      producaoInicio: (p as any).producao_inicio ? new Date((p as any).producao_inicio + 'T12:00:00') : null,
      producaoFim: (p as any).producao_fim ? new Date((p as any).producao_fim + 'T12:00:00') : null,
      entregaInicio: (p as any).entrega_inicio ? new Date((p as any).entrega_inicio + 'T12:00:00') : null,
      entregaFim: (p as any).entrega_fim ? new Date((p as any).entrega_fim + 'T12:00:00') : null,
      cor: 'hsl(220, 15%, 55%)',
      status: p.status as ProjectStatus,
      progresso: p.progresso,
      responsavelId: (p as any).responsavel_id || null,
      valor: p.valor || 0,
      tarefas: (tasksData as DbTask[])
        .filter(t => t.project_id === p.id)
        .map(t => ({
          id: t.id,
          nome: t.nome,
          dataInicio: t.data_inicio ? new Date(t.data_inicio + 'T12:00:00') : undefined,
          dataFim: t.data_fim ? new Date(t.data_fim + 'T12:00:00') : undefined,
          responsavel: '',
          concluida: t.concluida,
        }))
        // Sort tasks by fixed order
        .sort((a, b) => (TASK_ORDER[a.nome] || 99) - (TASK_ORDER[b.nome] || 99)),
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
    }));
  } catch (error) {
    console.error('Supabase error, falling back to localStorage:', error);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored, (key, value) => {
          if (['dataInicio', 'dataFim', 'createdAt', 'updatedAt'].includes(key) && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
      } catch {
        return mockProjects;
      }
    }
    return mockProjects;
  }
}

// Add project to Supabase
async function addProjectToDb(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const defaultTasks: Task[] = DEFAULT_TASKS.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    dataInicio: project.dataInicio,
    dataFim: project.dataFim,
  }));

  const { data, error } = await supabase
    .from('projects')
    .insert({
      nome: project.nome,
      descricao: project.descricao,
      cliente: project.cliente,
      valor: project.valor || 0,
      data_inicio: project.dataInicio instanceof Date 
        ? project.dataInicio.toISOString().split('T')[0]
        : project.dataInicio,
      data_fim: project.dataFim instanceof Date 
        ? project.dataFim.toISOString().split('T')[0]
        : project.dataFim,
      status: project.status,
      progresso: project.progresso,
      prioridade: 'media',
      responsavel_id: project.responsavelId || null,
    } as any)
    .select()
    .single();

  if (error) throw error;

  // Insert default tasks
  for (const task of defaultTasks) {
    await supabase.from('tasks').insert({
      id: task.id,
      project_id: data.id,
      nome: task.nome,
      descricao: '',
      data_inicio: project.dataInicio instanceof Date 
        ? project.dataInicio.toISOString().split('T')[0]
        : project.dataInicio,
      data_fim: project.dataFim instanceof Date 
        ? project.dataFim.toISOString().split('T')[0]
        : project.dataFim,
      concluida: false,
    });
  }

  return {
    id: data.id,
    nome: data.nome,
    cliente: data.cliente,
    descricao: data.descricao || '',
    dataInicio: new Date(data.data_inicio + 'T12:00:00'),
    dataFim: new Date(data.data_fim + 'T12:00:00'),
    cor: project.cor,
    status: data.status as ProjectStatus,
    progresso: data.progresso,
    responsavelId: (data as any).responsavel_id || null,
    tarefas: defaultTasks,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Process automatic stock deduction for completed projects
async function processProjectStockDeduction(projectId: string): Promise<void> {
  try {
    // Check if stock was already deducted for this project
    const { data: existingMovements } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('project_id', projectId)
      .limit(1);

    if (existingMovements && existingMovements.length > 0) {
      console.log('Stock already deducted for project:', projectId);
      return;
    }

    // Get order items for the project
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantidade')
      .eq('project_id', projectId)
      .not('product_id', 'is', null);

    if (!orderItems?.length) {
      console.log('No products to deduct for project:', projectId);
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create stock movements for each product
    for (const item of orderItems) {
      if (!item.product_id) continue;

      await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        project_id: projectId,
        tipo: 'saida',
        quantidade: item.quantidade,
        motivo: 'Baixa automática - Pedido concluído',
        created_by: user?.id,
      });

      // Update product stock
      const { data: product } = await supabase
        .from('products')
        .select('estoque_atual')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const newStock = Math.max(0, product.estoque_atual - item.quantidade);
        await supabase
          .from('products')
          .update({ estoque_atual: newStock })
          .eq('id', item.product_id);
      }
    }

    toast.success('Estoque baixado automaticamente');
  } catch (error) {
    console.error('Error processing stock deduction:', error);
  }
}

// Update project in Supabase
async function updateProjectInDb(id: string, updates: Partial<Project>, currentProjects: Project[]): Promise<{ shouldDeductStock: boolean }> {
  const currentProject = currentProjects.find(p => p.id === id);
  const shouldDeductStock = updates.status !== undefined && 
    ['concluido', 'entregue'].includes(updates.status) &&
    currentProject && 
    !['concluido', 'entregue'].includes(currentProject.status);
  const projectUpdates: Record<string, unknown> = {};
  if (updates.nome !== undefined) projectUpdates.nome = updates.nome;
  if (updates.descricao !== undefined) projectUpdates.descricao = updates.descricao;
  if (updates.cliente !== undefined) projectUpdates.cliente = updates.cliente;
  if (updates.valor !== undefined) projectUpdates.valor = updates.valor;
  if (updates.status !== undefined) projectUpdates.status = updates.status;
  if (updates.progresso !== undefined) projectUpdates.progresso = updates.progresso;
  if (updates.responsavelId !== undefined) projectUpdates.responsavel_id = updates.responsavelId;
  if (updates.dataInicio !== undefined) {
    projectUpdates.data_inicio = updates.dataInicio instanceof Date 
      ? updates.dataInicio.toISOString().split('T')[0]
      : updates.dataInicio;
  }
  if (updates.dataFim !== undefined) {
    projectUpdates.data_fim = updates.dataFim instanceof Date 
      ? updates.dataFim.toISOString().split('T')[0]
      : updates.dataFim;
  }
  if (updates.producaoInicio !== undefined) {
    projectUpdates.producao_inicio = updates.producaoInicio instanceof Date 
      ? updates.producaoInicio.toISOString().split('T')[0]
      : updates.producaoInicio;
  }
  if (updates.producaoFim !== undefined) {
    projectUpdates.producao_fim = updates.producaoFim instanceof Date 
      ? updates.producaoFim.toISOString().split('T')[0]
      : updates.producaoFim;
  }
  if (updates.entregaInicio !== undefined) {
    projectUpdates.entrega_inicio = updates.entregaInicio instanceof Date 
      ? updates.entregaInicio.toISOString().split('T')[0]
      : updates.entregaInicio;
  }
  if (updates.entregaFim !== undefined) {
    projectUpdates.entrega_fim = updates.entregaFim instanceof Date 
      ? updates.entregaFim.toISOString().split('T')[0]
      : updates.entregaFim;
  }

  if (Object.keys(projectUpdates).length > 0) {
    const { error } = await supabase
      .from('projects')
      .update(projectUpdates)
      .eq('id', id);

    if (error) throw error;
  }

  // Handle tasks updates
  if (updates.tarefas !== undefined) {
    const project = currentProjects.find(p => p.id === id);
    if (project) {
      const existingTaskIds = project.tarefas.map(t => t.id);
      const newTaskIds = updates.tarefas.map(t => t.id);

      // Delete removed tasks
      const tasksToDelete = existingTaskIds.filter(tid => !newTaskIds.includes(tid));
      for (const taskId of tasksToDelete) {
        await supabase.from('tasks').delete().eq('id', taskId);
      }

      // Update or insert tasks
      for (const task of updates.tarefas) {
        let dataInicio: string;
        if (task.dataInicio) {
          dataInicio = task.dataInicio instanceof Date 
            ? task.dataInicio.toISOString().split('T')[0]
            : new Date(task.dataInicio).toISOString().split('T')[0];
        } else {
          dataInicio = new Date().toISOString().split('T')[0];
        }

        let dataFim: string;
        if (task.dataFim) {
          dataFim = task.dataFim instanceof Date 
            ? task.dataFim.toISOString().split('T')[0]
            : new Date(task.dataFim).toISOString().split('T')[0];
        } else {
          dataFim = new Date().toISOString().split('T')[0];
        }

        const taskData = {
          project_id: id,
          nome: task.nome,
          descricao: '',
          data_inicio: dataInicio,
          data_fim: dataFim,
          concluida: task.concluida,
        };

        if (existingTaskIds.includes(task.id)) {
          await supabase.from('tasks').update(taskData).eq('id', task.id);
        } else {
          await supabase.from('tasks').insert({ ...taskData, id: task.id });
        }
      }
    }
  }

  return { shouldDeductStock };
}

// Delete project from Supabase
async function deleteProjectFromDb(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useProjects() {
  const queryClient = useQueryClient();

  // Query for fetching projects
  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 1000 * 60, // Keep data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Avoid refetch flash on navigation
  });

  // Mutation for adding project
  const addMutation = useMutation({
    mutationFn: addProjectToDb,
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(['projects'], (old = []) => [newProject, ...old]);
    },
  });

  // Mutation for updating project - optimistic update
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const result = await updateProjectInDb(id, updates, projects);
      return { id, ...result };
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);

      // Optimistically update to the new value
      queryClient.setQueryData<Project[]>(['projects'], (old = []) =>
        old.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)
      );

      return { previousProjects };
    },
    onSuccess: async (result) => {
      // Process stock deduction if project was just completed
      if (result.shouldDeductStock) {
        await processProjectStockDeduction(result.id);
        queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Mutation for deleting project
  const deleteMutation = useMutation({
    mutationFn: deleteProjectFromDb,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);
      queryClient.setQueryData<Project[]>(['projects'], (old = []) =>
        old.filter(p => p.id !== id)
      );
      return { previousProjects };
    },
    onError: (_err, _id, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addMutation.mutateAsync(project);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    return updateMutation.mutateAsync({ id, updates });
  };

  const deleteProject = async (id: string) => {
    return deleteMutation.mutateAsync(id);
  };

  const getProjectById = (id: string) => projects.find(p => p.id === id);

  const getProjectsByStatus = (status: ProjectStatus) => projects.filter(p => p.status === status);

  const getStats = () => {
    const total = projects.length;
    // Active projects = all except concluido, pausado, cancelado, aguardando_pagamento
    const inactiveStatuses = ['concluido', 'pausado', 'cancelado', 'aguardando_pagamento'];
    const emAndamento = projects.filter(p => !inactiveStatuses.includes(p.status)).length;
    const concluidos = projects.filter(p => p.status === 'concluido').length;
    const pendentes = projects.filter(p => p.status === 'pendente').length;
    const pausados = projects.filter(p => p.status === 'pausado').length;
    const avgProgress = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progresso, 0) / projects.length)
      : 0;

    return { total, emAndamento, concluidos, pendentes, pausados, avgProgress };
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByStatus,
    getStats,
    refetch,
  };
}
