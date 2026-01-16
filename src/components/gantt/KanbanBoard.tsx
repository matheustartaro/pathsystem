import { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MoreHorizontal, Clock, AlertTriangle, CheckCircle2, ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project, ProjectStatus, Task } from '@/types/project';
import { useStatusCategories } from '@/hooks/useStatusCategories';
import { ProjectDetailDialog } from './ProjectDetailDialog';

interface KanbanBoardProps {
  projects: Project[];
  onEditProject?: (project: Project) => void;
  onAddTask?: (projectId: string) => void;
  onUpdateProjectStatus?: (projectId: string, newStatus: ProjectStatus) => void;
  onToggleTask?: (projectId: string, taskId: string, completed: boolean) => void;
  onUpdateTask?: (projectId: string, task: Task) => void;
  onDeleteTask?: (projectId: string, taskId: string) => void;
}

interface KanbanColumn {
  key: string;
  title: string;
  projects: Project[];
  color: string;
}

export function KanbanBoard({ 
  projects, 
  onEditProject, 
  onAddTask,
  onUpdateProjectStatus,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
}: KanbanBoardProps) {
  const { categories, getColorByStatus, reorderCategories } = useStatusCategories();
  const [localCategories, setLocalCategories] = useState(categories);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);

  // Get selected project from local projects list to ensure sync
  const selectedProject = selectedProjectId ? localProjects.find(p => p.id === selectedProjectId) || null : null;

  // Sync local projects with props
  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  // Sync local categories with categories from hook
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const columns = useMemo((): KanbanColumn[] => {
    // Use dynamic categories from database, sorted by order
    const sortedCategories = [...localCategories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sortedCategories.map(category => ({
      key: category.key,
      title: category.name,
      projects: localProjects.filter(p => p.status === category.key),
      color: category.color,
    }));
  }, [localProjects, localCategories]);

  // Statuses that should NOT show delay tags
  const statusesWithoutDelayTag = ['concluido', 'pausado', 'pendente', 'aguardando_entrega'];
  
  const getDeadlineStatus = (project: Project): 'on_time' | 'delayed' | 'completed' | 'no_tag' => {
    if (project.status === 'concluido') return 'completed';
    // Don't show delay tag for pausado, pendente, or aguardando_entrega
    if (statusesWithoutDelayTag.includes(project.status)) return 'no_tag';
    const today = new Date();
    const endDate = new Date(project.dataFim);
    return endDate < today ? 'delayed' : 'on_time';
  };

  const getTotalValue = (projs: Project[]) => {
    return projs.length;
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { type, source, destination } = result;

    // Handle column reordering
    if (type === 'column') {
      const sourceIndex = source.index;
      const destIndex = destination.index;
      
      if (sourceIndex === destIndex) return;
      
      const sortedCategories = [...localCategories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const reordered = Array.from(sortedCategories);
      const [removed] = reordered.splice(sourceIndex, 1);
      reordered.splice(destIndex, 0, removed);
      
      const updatedCategories = reordered.map((cat, index) => ({
        ...cat,
        order: index,
      }));
      
      setLocalCategories(updatedCategories);
      reorderCategories(sourceIndex, destIndex);
      return;
    }

    // Handle project card drag between columns
    if (type === 'project') {
      const sourceStatus = source.droppableId as ProjectStatus;
      const destinationStatus = destination.droppableId as ProjectStatus;

      if (sourceStatus === destinationStatus) return;

      const projectId = result.draggableId;
      
      setLocalProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, status: destinationStatus } : p
      ));

      onUpdateProjectStatus?.(projectId, destinationStatus);
    }
  };

  const handleCardClick = (project: Project) => {
    setSelectedProjectId(project.id);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = (projectId: string, newStatus: ProjectStatus) => {
    // Update local state immediately
    setLocalProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, status: newStatus } : p
    ));
    
    // Call external handler
    onUpdateProjectStatus?.(projectId, newStatus);
  };

  const handleToggleTask = (projectId: string, taskId: string, completed: boolean) => {
    // Update local state
    setLocalProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updatedTasks = p.tarefas.map(t => 
        t.id === taskId ? { ...t, concluida: completed } : t
      );
      const progress = updatedTasks.length > 0 
        ? Math.round((updatedTasks.filter(t => t.concluida).length / updatedTasks.length) * 100)
        : 0;
      return { ...p, tarefas: updatedTasks, progresso: progress };
    }));
    
    onToggleTask?.(projectId, taskId, completed);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="column">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="bg-card rounded-xl border border-border shadow-card overflow-hidden animate-fade-in"
            >
              {/* Kanban Container */}
              <div className="flex min-h-[600px] overflow-x-auto scrollbar-hidden">
                {columns.map((column, columnIndex) => (
                  <Draggable key={column.key} draggableId={`column-${column.key}`} index={columnIndex}>
                    {(columnProvided, columnSnapshot) => (
                      <div 
                        ref={columnProvided.innerRef}
                        {...columnProvided.draggableProps}
                        className={cn(
                          "flex-1 min-w-[280px] border-r-2 border-border last:border-r-0 flex flex-col",
                          columnSnapshot.isDragging && "shadow-lg bg-card z-10"
                        )}
                      >
                        {/* Column Header */}
                        <div 
                          {...columnProvided.dragHandleProps}
                          className="p-4 border-b-2 border-border bg-muted/50 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: column.color }}
                              />
                              <h3 className="font-semibold text-foreground">{column.title}</h3>
                            </div>
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 ml-6">
                            {getTotalValue(column.projects)} projeto{column.projects.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Column Content */}
                        <Droppable droppableId={column.key} type="project">
                          {(droppableProvided, droppableSnapshot) => (
                            <div
                              ref={droppableProvided.innerRef}
                              {...droppableProvided.droppableProps}
                              className={cn(
                                "flex-1 p-3 space-y-3 bg-background transition-colors",
                                droppableSnapshot.isDraggingOver && "bg-accent/20"
                              )}
                              style={{ minHeight: '200px' }}
                            >
                              {column.projects.map((project, index) => {
                                const deadlineStatus = getDeadlineStatus(project);
                                
                                return (
                                  <Draggable 
                                    key={project.id} 
                                    draggableId={project.id} 
                                    index={index}
                                  >
                                    {(cardProvided, cardSnapshot) => (
                                      <div
                                        ref={cardProvided.innerRef}
                                        {...cardProvided.draggableProps}
                                        {...cardProvided.dragHandleProps}
                                        className={cn(
                                          "bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group",
                                          cardSnapshot.isDragging && "shadow-lg rotate-2 opacity-90"
                                        )}
                                        onClick={() => handleCardClick(project)}
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <h4 className="font-medium text-foreground text-sm leading-tight">
                                            {project.nome}
                                          </h4>
                                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">{project.cliente}</p>
                                        <div className="mb-3">
                                          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${column.color}30` }}>
                                            <div className="h-full rounded-full transition-all" style={{ width: `${project.progresso}%`, backgroundColor: column.color }} />
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span>{format(new Date(project.dataFim), "dd MMM", { locale: ptBR })}</span>
                                          </div>
                                          {deadlineStatus === 'delayed' && (
                                            <div className="flex items-center gap-1 text-xs text-destructive">
                                              <AlertTriangle className="w-3 h-3" /><span>Atrasado</span>
                                            </div>
                                          )}
                                          {deadlineStatus === 'completed' && (
                                            <div className="flex items-center gap-1 text-xs text-[hsl(var(--status-success))]">
                                              <CheckCircle2 className="w-3 h-3" /><span>Concluído</span>
                                            </div>
                                          )}
                                          {(deadlineStatus === 'on_time' || deadlineStatus === 'no_tag') && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                              <span>{project.progresso}%</span>
                                            </div>
                                          )}
                                        </div>
                                        {project.tarefas.length > 0 && (
                                          <div className="mt-3 pt-3 border-t border-border">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                              <span>{project.tarefas.filter(t => t.concluida).length}/{project.tarefas.length} tarefas</span>
                                              <button onClick={(e) => { e.stopPropagation(); onAddTask?.(project.id); }} className="text-primary hover:underline">+ Nova</button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {droppableProvided.placeholder}
                              {column.projects.length === 0 && (
                                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                                  Arraste projetos aqui
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onAddTask={onAddTask}
        onToggleTask={handleToggleTask}
        onEditProject={onEditProject}
        onUpdateStatus={handleUpdateStatus}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
      />
    </>
  );
}
