import { Link } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, Edit2, Plus, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';
import { useStatusCategories } from '@/hooks/useStatusCategories';
import { Button } from '@/components/ui/button';

interface RecentProjectsListProps {
  projects: Project[];
  onEditProject?: (project: Project) => void;
  onAddTask?: (projectId: string) => void;
  onProjectClick?: (project: Project) => void;
}

export function RecentProjectsList({ projects, onEditProject, onAddTask, onProjectClick }: RecentProjectsListProps) {
  const { getColorByStatus, getCategoryByStatus } = useStatusCategories();
  
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getDeadlineStatus = (project: Project) => {
    const today = startOfDay(new Date());
    const endDate = startOfDay(new Date(project.dataFim));
    const statusCategory = getCategoryByStatus(project.status);
    
    if (project.status === 'concluido') {
      return { status: 'completed', label: 'Concluído', icon: CheckCircle2, className: 'text-status-success' };
    }
    
    // Check if this status should show delay tag
    if (statusCategory && statusCategory.showDelayTag === false) {
      return { status: 'no_tag', label: null, icon: null, className: '' };
    }
    
    if (isBefore(endDate, today)) {
      return { status: 'late', label: 'Atrasado', icon: AlertTriangle, className: 'text-destructive' };
    }
    
    return { status: 'ontime', label: 'Em dia', icon: Clock, className: 'text-status-success' };
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-card animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-card-foreground">Projetos Recentes</h3>
        <Link
          to="/projetos"
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
        >
          Ver todos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {recentProjects.map((project) => {
          const deadlineInfo = getDeadlineStatus(project);
          const DeadlineIcon = deadlineInfo.icon;
          
          return (
            <div
              key={project.id}
              className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group cursor-pointer"
              onClick={() => onProjectClick?.(project)}
            >
              <div
                className="w-2 h-14 rounded-full flex-shrink-0"
                style={{ backgroundColor: getColorByStatus(project.status) }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-card-foreground truncate">{project.nome}</p>
                <p className="text-sm text-muted-foreground truncate">{project.cliente}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Prazo: {format(new Date(project.dataFim), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                  {deadlineInfo.label && DeadlineIcon && (
                    <span className={cn("text-xs flex items-center gap-1 font-medium", deadlineInfo.className)}>
                      <DeadlineIcon className="w-3 h-3" />
                      {deadlineInfo.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden sm:block text-right flex-shrink-0">
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getColorByStatus(project.status) }}
                >
                  {getCategoryByStatus(project.status)?.name || project.status}
                </span>
              </div>
              <div className="sm:hidden flex-shrink-0">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getColorByStatus(project.status) }}
                >
                  {getCategoryByStatus(project.status)?.name || project.status}
                </span>
              </div>
              {/* Action buttons - visible on hover */}
              <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                {onAddTask && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAddTask(project.id);
                    }}
                    title="Nova Tarefa"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
                {onEditProject && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEditProject(project);
                    }}
                    title="Editar Projeto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {recentProjects.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Nenhum projeto ainda</h3>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro projeto para começar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
