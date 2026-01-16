import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Calendar, User, AlertTriangle, CheckCircle2, Clock, CheckSquare, Factory } from 'lucide-react';
import { Project } from '@/types/project';
import { formatCurrency } from '@/lib/utils';

import { useStatusCategories } from '@/hooks/useStatusCategories';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
  onAddTask?: () => void;
  onClick?: () => void;
}

export function ProjectCard({ project, onEdit, onDelete, onAddTask, onClick }: ProjectCardProps) {
  const { getColorByStatus, getCategoryByStatus } = useStatusCategories();
  const { getResponsavelById } = useResponsaveis();
  const statusColor = getColorByStatus(project.status);
  const statusCategory = getCategoryByStatus(project.status);
  const responsavel = project.responsavelId ? getResponsavelById(project.responsavelId) : null;
  
  const getDeadlineStatus = (): 'on_time' | 'delayed' | 'completed' | 'no_tag' => {
    if (project.status === 'concluido') return 'completed';
    // Check if this status should show delay tag
    if (statusCategory && statusCategory.showDelayTag === false) return 'no_tag';
    const today = new Date();
    const endDate = new Date(project.dataFim);
    return endDate < today ? 'delayed' : 'on_time';
  };

  const deadlineStatus = getDeadlineStatus();

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click when interacting with dropdown
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) return;
    onClick?.();
  };

  return (
    <div 
      className="bg-card rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 animate-fade-in cursor-pointer group/card"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <span className="font-semibold text-card-foreground hover:text-primary transition-colors">
            {project.nome}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild data-dropdown-trigger>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={e => e.stopPropagation()}>
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

      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{project.cliente}</span>
          </div>
          {responsavel && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full truncate max-w-[120px]">
              {responsavel.nome}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>
            {format(new Date(project.dataInicio), "dd MMM", { locale: ptBR })} →{' '}
            {format(new Date(project.dataFim), "dd MMM yyyy", { locale: ptBR })}
          </span>
        </div>

        {/* Production period */}
        {project.producaoInicio && project.producaoFim && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Factory className="w-4 h-4 flex-shrink-0 text-primary/70" />
            <span className="text-primary/80">
              Produção: {format(new Date(project.producaoInicio), "dd MMM", { locale: ptBR })} →{' '}
              {format(new Date(project.producaoFim), "dd MMM", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-card-foreground">{project.progresso}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${project.progresso}%`,
                backgroundColor: statusColor,
              }}
            />
          </div>
        </div>

        {/* Status and deadline */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-medium text-primary-foreground"
              style={{ backgroundColor: statusColor }}
            >
              {statusCategory?.name || project.status}
            </span>
            {(project.valor || 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {formatCurrency(project.valor || 0)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {deadlineStatus === 'delayed' && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="w-3 h-3" />
                Atrasado
              </span>
            )}
            {deadlineStatus === 'completed' && (
              <span className="flex items-center gap-1 text-xs text-[hsl(var(--status-success))]">
                <CheckCircle2 className="w-3 h-3" />
                Concluído
              </span>
            )}
            {deadlineStatus === 'on_time' && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Em dia
              </span>
            )}
          </div>
        </div>

        {/* Tasks summary - optimized */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-medium">{project.tarefas.filter(t => t.concluida).length}/{project.tarefas.length}</span>
          <span>tarefas</span>
        </div>
      </div>
    </div>
  );
}
