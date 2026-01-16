import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Calendar, User, AlertTriangle, CheckCircle2, Clock, CheckSquare } from 'lucide-react';
import { Project } from '@/types/project';
import { useStatusCategories } from '@/hooks/useStatusCategories';
import { formatCurrency } from '@/lib/utils';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectListItemProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
  onAddTask?: () => void;
  onClick?: () => void;
}

export function ProjectListItem({ project, onEdit, onDelete, onAddTask, onClick }: ProjectListItemProps) {
  const { getColorByStatus, getCategoryByStatus } = useStatusCategories();
  const { getResponsavelById } = useResponsaveis();
  const statusColor = getColorByStatus(project.status);
  const statusCategory = getCategoryByStatus(project.status);
  const responsavel = project.responsavelId ? getResponsavelById(project.responsavelId) : null;
  
  const getDeadlineStatus = (): 'on_time' | 'delayed' | 'completed' | 'no_tag' => {
    if (project.status === 'concluido') return 'completed';
    if (statusCategory && statusCategory.showDelayTag === false) return 'no_tag';
    const today = new Date();
    const endDate = new Date(project.dataFim);
    return endDate < today ? 'delayed' : 'on_time';
  };

  const deadlineStatus = getDeadlineStatus();
  const completedTasks = project.tarefas.filter(t => t.concluida).length;
  const totalTasks = project.tarefas.length;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) return;
    onClick?.();
  };

  return (
    <div 
      className="bg-card rounded-lg border border-border px-4 py-3 shadow-sm hover:shadow-card hover:border-primary/20 transition-all duration-200 animate-fade-in cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div
          className="w-2 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
        />
        
        {/* Main content */}
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_minmax(140px,auto)_minmax(100px,auto)_minmax(70px,auto)_minmax(80px,auto)] gap-x-6 gap-y-2 items-center">
          {/* Project name & client */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-card-foreground truncate">
                {project.nome}
              </span>
              <span
                className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium text-primary-foreground flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              >
                {statusCategory?.name || project.status}
              </span>
              {(project.valor || 0) > 0 && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary flex-shrink-0">
                  {formatCurrency(project.valor || 0)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="truncate">{project.cliente}</span>
              {responsavel && (
                <span className="hidden md:flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {responsavel.nome}
                </span>
              )}
            </div>
          </div>

          {/* Dates - hidden on mobile, centered */}
          <div className="hidden sm:flex items-center justify-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {format(new Date(project.dataInicio), "dd/MM", { locale: ptBR })} - {format(new Date(project.dataFim), "dd/MM/yy", { locale: ptBR })}
            </span>
          </div>

          {/* Progress - centered */}
          <div className="hidden sm:flex items-center justify-center gap-2">
            <Progress value={project.progresso} className="h-1.5 w-16" />
            <span className="text-xs font-medium text-muted-foreground w-8">{project.progresso}%</span>
          </div>

          {/* Tasks - centered */}
          <div className="hidden md:flex items-center justify-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{completedTasks}/{totalTasks}</span>
          </div>

          {/* Deadline status - centered */}
          <div className="hidden sm:flex items-center justify-center">
            {deadlineStatus === 'delayed' && (
              <span className="flex items-center gap-1 text-xs text-destructive whitespace-nowrap">
                <AlertTriangle className="w-3.5 h-3.5" />
                Atrasado
              </span>
            )}
            {deadlineStatus === 'completed' && (
              <span className="flex items-center gap-1 text-xs text-[hsl(var(--status-success))] whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluído
              </span>
            )}
            {deadlineStatus === 'on_time' && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" />
                Em dia
              </span>
            )}
          </div>
        </div>

        {/* Mobile indicators */}
        <div className="flex sm:hidden items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium text-primary-foreground"
            style={{ backgroundColor: statusColor }}
          >
            {statusCategory?.name || project.status}
          </span>
          {deadlineStatus === 'delayed' && (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild data-dropdown-trigger>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground flex-shrink-0" onClick={e => e.stopPropagation()}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(project); }}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddTask?.(); }}>
              Nova Tarefa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { 
                e.stopPropagation(); 
                if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
                  onDelete?.(project.id); 
                }
              }}
              className="text-destructive focus:text-destructive"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}