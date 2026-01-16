import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { GanttChart, GanttMobileList, KanbanBoard, GanttCalendarView } from '@/components/gantt';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';
import { TaskFormDialog } from '@/components/projects/TaskFormDialog';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Project, Task, ProjectStatus } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Columns3, CalendarDays, Filter, ArrowUpDown } from 'lucide-react';

type SortOption = 'createdAt' | 'dataFim' | 'dataInicio' | 'nome' | 'status' | 'progresso';

type ViewType = 'gantt' | 'kanban' | 'calendar';

const GanttPage = () => {
  const { projects, isLoading, addProject, updateProject, deleteProject } = useProjects();
  const { responsaveis } = useResponsaveis();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [viewType, setViewType] = useState<ViewType>('gantt');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('status');
  
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = projects;
    
    // Apply filter
    if (responsavelFilter === 'none') {
      result = result.filter(p => !p.responsavelId);
    } else if (responsavelFilter !== 'all') {
      result = result.filter(p => p.responsavelId === responsavelFilter);
    }
    
    // Apply sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'dataFim':
          return new Date(a.dataFim).getTime() - new Date(b.dataFim).getTime();
        case 'dataInicio':
          return new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime();
        case 'nome':
          return a.nome.localeCompare(b.nome);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'progresso':
          return b.progresso - a.progresso; // Higher progress first
        default:
          return 0;
      }
    });
  }, [projects, responsavelFilter, sortBy]);

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };

  const handleSaveProject = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tarefas'> | Partial<Project>) => {
    if (editingProject) {
      updateProject(editingProject.id, data);
      toast({ title: 'Projeto atualizado com sucesso!' });
    } else {
      addProject({ ...data, tarefas: [] } as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);
      toast({ title: 'Projeto criado com sucesso!' });
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      deleteProject(id);
      toast({ title: 'Projeto excluído', variant: 'destructive' });
    }
  };

  const handleAddTask = (projectId: string) => {
    setSelectedProjectId(projectId);
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (projectId: string, task: Task) => {
    setSelectedProjectId(projectId);
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleSaveTask = (data: Omit<Task, 'id'> | Task) => {
    if (!selectedProjectId) return;
    
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    let updatedTarefas: Task[];

    if ('id' in data && data.id) {
      // Editing existing task
      updatedTarefas = project.tarefas.map(t =>
        t.id === data.id ? (data as Task) : t
      );
      toast({ title: 'Tarefa atualizada!' });
    } else {
      // Adding new task
      const newTask: Task = {
        ...data,
        id: crypto.randomUUID(),
      };
      updatedTarefas = [...project.tarefas, newTask];
      toast({ title: 'Tarefa adicionada!' });
    }

    updateProject(selectedProjectId, { tarefas: updatedTarefas });
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      const updatedTarefas = project.tarefas.filter(t => t.id !== taskId);
      updateProject(projectId, { tarefas: updatedTarefas });
      toast({ title: 'Tarefa excluída', variant: 'destructive' });
    }
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    updateProject(id, updates);
  };

  const handleUpdateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    updateProject(projectId, { status: newStatus });
    toast({ title: 'Status atualizado!' });
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

  const handleDeleteTaskFromProject = (projectId: string, taskId: string) => {
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

  const getViewTitle = () => {
    switch (viewType) {
      case 'gantt': return 'Gráfico de Gantt';
      case 'kanban': return 'Pipeline de Projetos';
      case 'calendar': return 'Calendário de Entregas';
    }
  };

  const getViewDescription = () => {
    switch (viewType) {
      case 'gantt': return 'Visualização do cronograma de todos os projetos';
      case 'kanban': return 'Visualização por status dos projetos';
      case 'calendar': return 'Visualização das datas de entrega dos projetos';
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Page Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted/50 animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-44 bg-muted animate-pulse rounded" />
              <div className="h-9 w-44 bg-muted animate-pulse rounded" />
            </div>
          </div>

          {/* Gantt Skeleton */}
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between">
              <div className="flex gap-2">
                <div className="h-9 w-9 bg-muted animate-pulse rounded" />
                <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                <div className="h-9 w-9 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex gap-1">
                <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                <div className="h-9 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="flex">
              <div className="w-48 md:w-64 border-r border-border">
                <div className="h-10 bg-muted border-b border-border" />
                <div className="h-8 border-b border-border" />
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 border-b border-border flex items-center px-3 gap-2">
                    <div className="w-5 h-5 bg-muted animate-pulse rounded" />
                    <div className="w-3 h-3 bg-muted animate-pulse rounded-full" />
                    <div className="h-4 flex-1 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="h-10 bg-muted border-b border-border" />
                <div className="h-8 bg-background border-b border-border" />
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 border-b border-border flex items-center px-4">
                    <div className="h-8 w-32 bg-muted/50 animate-pulse rounded ml-[10%]" style={{ marginLeft: `${i * 8 + 5}%`, width: `${30 - i * 3}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1 flex-shrink-0">
              <h1 className="text-2xl font-bold text-foreground">{getViewTitle()}</h1>
              <p className="text-muted-foreground">{getViewDescription()}</p>
            </div>

            {/* Filters and View Toggle - aligned right and vertically centered */}
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Responsável Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filtrar por responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os responsáveis</SelectItem>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {responsaveis.map((resp) => (
                      <SelectItem key={resp.id} value={resp.id}>
                        {resp.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Data de criação</SelectItem>
                    <SelectItem value="dataInicio">Data de início</SelectItem>
                    <SelectItem value="dataFim">Data de término</SelectItem>
                    <SelectItem value="nome">Nome do projeto</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="progresso">Progresso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {!isMobile && (
                  <>
                    <Button
                      variant={viewType === 'gantt' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('gantt')}
                      className="gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Gantt
                    </Button>
                    <Button
                      variant={viewType === 'kanban' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('kanban')}
                      className="gap-2"
                    >
                      <Columns3 className="w-4 h-4" />
                      Pipeline
                    </Button>
                  </>
                )}
                <Button
                  variant={viewType === 'calendar' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('calendar')}
                  className="gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendário
                </Button>
              </div>
            </div>
          </div>
        </div>


        {/* Content */}
        {isMobile && viewType !== 'calendar' ? (
          <GanttMobileList projects={filteredProjects} />
        ) : viewType === 'gantt' ? (
          <GanttChart
            projects={filteredProjects}
            onUpdateProject={handleUpdateProject}
            onAddProject={handleAddProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : viewType === 'kanban' ? (
          <KanbanBoard
            projects={filteredProjects}
            onEditProject={handleEditProject}
            onAddTask={handleAddTask}
            onUpdateProjectStatus={handleUpdateProjectStatus}
            onToggleTask={handleToggleTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTaskFromProject}
          />
        ) : (
          <GanttCalendarView
            projects={filteredProjects}
            onEditProject={handleEditProject}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onUpdateStatus={handleUpdateProjectStatus}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTaskFromProject}
          />
        )}
      </div>

      {/* Project Form Dialog */}
      <ProjectFormDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={editingProject}
        onSave={handleSaveProject}
      />

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </AppLayout>
  );
};

export default GanttPage;
