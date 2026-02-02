import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';
import { getStatusLabel, getStatusColor } from '@/lib/status-utils';

interface GanttMobileListProps {
  projects: Project[];
}

export function GanttMobileList({ projects }: GanttMobileListProps) {
  const sortedProjects = [...projects].sort(
    (a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()
  );

  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden animate-fade-in">
      <div className="p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-xs font-medium">
            Para uma visualização completa do Gantt, use a versão desktop.
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {sortedProjects.map((project) => (
          <Link
            key={project.id}
            to={`/projetos/${project.id}`}
            className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
          >
            <div
              className="w-1.5 h-12 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.cor }}
            />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="font-medium text-sm text-card-foreground truncate">{project.nome}</p>
              <p className="text-xs text-muted-foreground truncate">{project.cliente}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {format(project.dataInicio, "dd MMM", { locale: ptBR })} →{' '}
                  {format(project.dataFim, "dd MMM", { locale: ptBR })}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${project.progresso}%`,
                      backgroundColor: project.cor,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {project.progresso}%
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium text-white',
                  getStatusColor(project.status)
                )}
              >
                {getStatusLabel(project.status)}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
        {sortedProjects.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum projeto encontrado
          </div>
        )}
      </div>
    </div>
  );
}
