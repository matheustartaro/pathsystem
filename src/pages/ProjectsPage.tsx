import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, LayoutGrid, List, User, ArrowUpDown } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { ProjectCard, ProjectListItem } from '@/components/projects';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { OrderItemInput } from '@/components/projects/OrderItemsSection';
import { TaskFormDialog } from '@/components/projects/TaskFormDialog';
import { ProjectDetailDialog } from '@/components/gantt/ProjectDetailDialog';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useOrderItems } from '@/hooks/useOrderItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project, ProjectStatus, Task } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import { useStatusCategories } from '@/hooks/useStatusCategories';

const ProjectsPage = () => {
  const { projects, isLoading, addProject, updateProject, deleteProject } = useProjects();
  const { categories } = useStatusCategories();
  const { responsaveis } = useResponsaveis();
  const { orderItems: allOrderItems, addItem, deleteByProject } = useOrderItems();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'data' | 'nome' | 'status'>('status');
  const { toast } = useToast();

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Task dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Get selected project from current projects list to ensure sync
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;

  // Get order items for editing project - map DB items to UI format
  const getOrderItemsForProject = (projectId: string): OrderItemInput[] => {
    const projectItems = allOrderItems.filter(item => item.project_id === projectId);
    
    return projectItems
      .filter(item => item.item_type === 'product' || item.item_type === 'service')
      .map(item => ({
        type: item.item_type as 'product' | 'service',
        itemId: item.service_id || item.product_id || item.id,
        nome: item.nome || '',
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        total: item.total,
        isManual: item.is_manual,
      }));
  };

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      const matchesSearch =
        project.nome.toLowerCase().includes(search.toLowerCase()) ||
        project.cliente.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesResponsavel = responsavelFilter === 'all' || 
        (responsavelFilter === 'none' && !project.responsavelId) ||
        project.responsavelId === responsavelFilter;
      return matchesSearch && matchesStatus && matchesResponsavel;
    });
    
    // Sort projects
    return [...filtered].sort((a, b) => {
      if (sortBy === 'data') {
        return new Date(a.dataFim).getTime() - new Date(b.dataFim).getTime();
      } else if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome);
      } else {
        return a.status.localeCompare(b.status);
      }
    });
  }, [projects, search, statusFilter, responsavelFilter, sortBy]);

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };

  const handleSaveProject = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tarefas'> | Partial<Project>, orderItemsData?: OrderItemInput[]) => {
    // Calculate total value from order items
    const calculateTotalValue = (items: OrderItemInput[]): number => {
      return items.reduce((sum, item) => sum + item.total, 0);
    };

    // Helper to save order items with proper linking
    const saveOrderItems = async (projectId: string, items: OrderItemInput[]) => {
      // First, save services and create a map of temp IDs to real IDs
      const serviceIdMap = new Map<string, string>();
      
      // Save services first
      for (const item of items.filter(i => i.type === 'service')) {
        const savedItem = await addItem({
          project_id: projectId,
          product_id: null,
          service_id: item.isManual ? null : item.itemId,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          desconto: item.desconto,
          total: item.total,
          parent_service_id: null,
          item_type: 'service',
          is_manual: item.isManual || false,
          nome: item.isManual ? item.nome : null,
          largura: null,
          comprimento: null,
          altura: null,
          metro_cubico: null,
          preco_m3: null,
        });
        serviceIdMap.set(item.itemId, savedItem.id);
      }
      
      // Save products
      for (const item of items.filter(i => i.type === 'product')) {
        await addItem({
          project_id: projectId,
          product_id: !item.isManual ? item.itemId : null,
          service_id: null,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          desconto: item.desconto,
          total: item.total,
          parent_service_id: null,
          item_type: 'product',
          is_manual: item.isManual || false,
          nome: item.isManual ? item.nome : null,
          largura: null,
          comprimento: null,
          altura: null,
          metro_cubico: null,
          preco_m3: null,
        });
      }
    };
    
    if (editingProject) {
      // Calculate new value from order items
      const newValue = orderItemsData ? calculateTotalValue(orderItemsData) : undefined;
      
      // Update project with value if order items changed
      await updateProject(editingProject.id, {
        ...data,
        ...(newValue !== undefined && { valor: newValue }),
      });
      
      // Update order items
      if (orderItemsData) {
        await deleteByProject(editingProject.id);
        await saveOrderItems(editingProject.id, orderItemsData);
      }
      
      toast({ title: 'Projeto atualizado com sucesso!' });
    } else {
      // Calculate value from order items for new project
      const projectValue = orderItemsData ? calculateTotalValue(orderItemsData) : 0;
      
      const newProject = await addProject({ 
        ...data, 
        valor: projectValue,
        tarefas: [] 
      } as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Add order items to new project
      if (orderItemsData && newProject) {
        await saveOrderItems(newProject.id, orderItemsData);
      }
      
      toast({ title: 'Projeto criado com sucesso!' });
    }
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    toast({
      title: 'Projeto excluído',
      description: 'O projeto foi removido com sucesso.',
    });
  };

  // Task handlers
  const handleAddTask = (projectId: string) => {
    setTaskProjectId(projectId);
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleSaveTask = (data: Omit<Task, 'id'>) => {
    if (!taskProjectId) return;
    
    const project = projects.find(p => p.id === taskProjectId);
    if (!project) return;

    if (editingTask) {
      const updatedTarefas = project.tarefas.map(t =>
        t.id === editingTask.id ? { ...t, ...data } : t
      );
      updateProject(taskProjectId, { tarefas: updatedTarefas });
      toast({ title: 'Tarefa atualizada com sucesso!' });
    } else {
      const newTask: Task = {
        ...data,
        id: crypto.randomUUID(),
      };
      updateProject(taskProjectId, { tarefas: [...project.tarefas, newTask] });
      toast({ title: 'Tarefa adicionada com sucesso!' });
    }
    setTaskDialogOpen(false);
  };

  const handleToggleTask = (projectId: string, taskId: string, completed: boolean) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const updatedTarefas = project.tarefas.map(t =>
      t.id === taskId ? { ...t, concluida: completed } : t
    );
    
    // Calculate new progress
    const progress = updatedTarefas.length > 0
      ? Math.round((updatedTarefas.filter(t => t.concluida).length / updatedTarefas.length) * 100)
      : 0;
    
    updateProject(projectId, { tarefas: updatedTarefas, progresso: progress });
  };

  const handleUpdateTask = (projectId: string, task: Task) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const updatedTarefas = project.tarefas.map(t =>
      t.id === task.id ? task : t
    );
    
    updateProject(projectId, { tarefas: updatedTarefas });
    toast({ title: 'Tarefa atualizada!' });
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const updatedTarefas = project.tarefas.filter(t => t.id !== taskId);
    
    // Calculate new progress
    const progress = updatedTarefas.length > 0
      ? Math.round((updatedTarefas.filter(t => t.concluida).length / updatedTarefas.length) * 100)
      : 0;
    
    updateProject(projectId, { tarefas: updatedTarefas, progresso: progress });
    toast({ title: 'Tarefa excluída', variant: 'destructive' });
  };

  const handleCardClick = (project: Project) => {
    setSelectedProjectId(project.id);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = (projectId: string, newStatus: ProjectStatus) => {
    updateProject(projectId, { status: newStatus });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted/50 animate-pulse rounded" />
            </div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>

          {/* Filters Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
            <div className="h-10 w-40 bg-muted/50 animate-pulse rounded" />
            <div className="h-10 w-40 bg-muted/50 animate-pulse rounded" />
          </div>

          {/* List Skeleton */}
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-32 bg-muted/50 animate-pulse rounded" />
                  </div>
                  <div className="hidden sm:block h-4 w-24 bg-muted/50 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
            <p className="text-muted-foreground">
              {filteredProjects.length} projeto{filteredProjects.length !== 1 ? 's' : ''} encontrado{filteredProjects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button className="gap-2" onClick={handleAddProject}>
            <Plus className="w-4 h-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.key}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <User className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos responsáveis</SelectItem>
              <SelectItem value="none">Sem responsável</SelectItem>
              {responsaveis.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'data' | 'nome' | 'status')}>
            <SelectTrigger className="w-full sm:w-40">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data">Por Data</SelectItem>
              <SelectItem value="nome">Por Nome</SelectItem>
              <SelectItem value="status">Por Status</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => handleEditProject(project)}
                  onDelete={handleDelete}
                  onAddTask={() => handleAddTask(project.id)}
                  onClick={() => handleCardClick(project)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  onEdit={() => handleEditProject(project)}
                  onDelete={handleDelete}
                  onAddTask={() => handleAddTask(project.id)}
                  onClick={() => handleCardClick(project)}
                />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhum projeto encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou criar um novo projeto.
            </p>
            <Button className="gap-2" onClick={handleAddProject}>
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </div>
        )}
      </div>

      {/* Project Form Dialog */}
      <ProjectFormDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={editingProject}
        onSave={handleSaveProject}
        initialOrderItems={editingProject ? getOrderItemsForProject(editingProject.id) : []}
      />

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onEditProject={handleEditProject}
        onUpdateStatus={handleUpdateStatus}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </AppLayout>
  );
};

export default ProjectsPage;
