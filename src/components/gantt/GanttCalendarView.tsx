import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project, Task } from '@/types/project';
import { useStatusCategories } from '@/hooks/useStatusCategories';
import { Button } from '@/components/ui/button';
import { ProjectDetailDialog } from './ProjectDetailDialog';

interface GanttCalendarViewProps {
  projects: Project[];
  onEditProject?: (project: Project) => void;
  onAddTask?: (projectId: string) => void;
  onToggleTask?: (projectId: string, taskId: string, completed: boolean) => void;
  onUpdateStatus?: (projectId: string, newStatus: string) => void;
  onUpdateTask?: (projectId: string, task: Task) => void;
  onDeleteTask?: (projectId: string, taskId: string) => void;
}

export function GanttCalendarView({ projects, onEditProject, onAddTask, onToggleTask, onUpdateStatus, onUpdateTask, onDeleteTask }: GanttCalendarViewProps) {
  const { getColorByStatus } = useStatusCategories();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Get selected project from current projects list to ensure sync
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the start with empty days to align with week start
  const startDay = getDay(monthStart);
  const paddingDays = startDay === 0 ? 6 : startDay - 1; // Monday start

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getProjectsForDay = (day: Date) => {
    // Filter out completed projects
    return projects.filter(p => {
      if (p.status === 'concluido') return false;
      const endDate = new Date(p.dataFim);
      return isSameDay(endDate, day);
    });
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProjectId(project.id);
    setDetailDialogOpen(true);
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground capitalize ml-2">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Entregas do mês</p>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Padding days */}
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-20 p-1.5 border-b border-r border-border bg-muted/20" />
          ))}

          {/* Actual days */}
          {days.map((day, i) => {
            const dayProjects = getProjectsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-20 p-1.5 border-b border-r border-border transition-colors",
                  isToday && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday ? "text-primary" : "text-foreground"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayProjects.slice(0, 3).map(project => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className="w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate transition-opacity hover:opacity-80"
                      style={{ 
                        backgroundColor: getColorByStatus(project.status),
                        color: 'white'
                      }}
                    >
                      {project.nome}
                    </button>
                  ))}
                  {dayProjects.length > 3 && (
                    <p className="text-[10px] text-muted-foreground px-1">
                      +{dayProjects.length - 3} mais
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ProjectDetailDialog
        project={selectedProject}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
        onEditProject={onEditProject}
        onUpdateStatus={onUpdateStatus}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
      />
    </>
  );
}
