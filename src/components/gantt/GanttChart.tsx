import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { format, differenceInDays, addDays, addMonths, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isToday, getWeekOfMonth, isWithinInterval, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Plus, ChevronDown, ChevronRight as ChevronRightIcon, Edit2, Trash2, ZoomIn, ZoomOut, Factory, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project, Task } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStatusCategories } from '@/hooks/useStatusCategories';

type ViewMode = 'week' | 'month' | '2months' | '3months' | '6months';

interface GanttChartProps {
  projects: Project[];
  onUpdateProject?: (id: string, updates: Partial<Project>) => void;
  onAddProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onAddTask?: (projectId: string) => void;
  onEditTask?: (projectId: string, task: Task) => void;
  onDeleteTask?: (projectId: string, taskId: string) => void;
}

export function GanttChart({ 
  projects, 
  onUpdateProject,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: GanttChartProps) {
  const { categories, getColorByStatus } = useStatusCategories();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showProductionOnly, setShowProductionOnly] = useState(false);
  const [showProductionComparison, setShowProductionComparison] = useState(false);
  const [showDeliveryComparison, setShowDeliveryComparison] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: 'project' | 'task' | 'production' | 'delivery'; id: string; projectId?: string } | null>(null);
  const [dragging, setDragging] = useState<{
    type: 'project' | 'task' | 'production';
    id: string;
    projectId?: string;
    edge: 'start' | 'end' | 'move';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Get container width for auto-fit
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Account for left sidebar (w-48 md:w-64 = 192px or 256px)
        const sidebarWidth = window.innerWidth >= 768 ? 256 : 192;
        const availableWidth = containerRef.current.offsetWidth - sidebarWidth;
        setContainerWidth(availableWidth > 0 ? availableWidth : 600);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const { days, weeks, months, cellWidth, startDate } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (viewMode === 'week') {
      start = startOfWeek(currentDate, { locale: ptBR });
      end = addDays(start, 13);
    } else if (viewMode === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else if (viewMode === '2months') {
      start = startOfMonth(currentDate);
      end = endOfMonth(addMonths(currentDate, 1));
    } else if (viewMode === '3months') {
      start = startOfMonth(currentDate);
      end = endOfMonth(addMonths(currentDate, 2));
    } else {
      // 6 months view
      start = startOfMonth(currentDate);
      end = endOfMonth(addMonths(currentDate, 5));
    }

    const interval = eachDayOfInterval({ start, end });
    const weekIntervals = eachWeekOfInterval({ start, end }, { locale: ptBR });
    const monthIntervals = eachMonthOfInterval({ start, end });

    // Calculate cell width to fit container - for 6 months, use full width
    const daysCount = interval.length;
    // For 6 months view, use exact fit to container width
    const calculatedWidth = containerWidth > 0 ? containerWidth / daysCount : 20;
    // Minimum width only for non-6-months views to allow scrolling
    const minWidth = viewMode === '6months' ? 0 : viewMode === '3months' ? 8 : 12;
    const width = Math.max(calculatedWidth, minWidth);

    return {
      days: interval,
      weeks: weekIntervals,
      months: monthIntervals,
      cellWidth: width,
      startDate: start,
    };
  }, [viewMode, currentDate, containerWidth]);

  const totalWidth = days.length * cellWidth;

  useEffect(() => {
    if (scrollRef.current && todayRef.current) {
      const todayPosition = todayRef.current.offsetLeft;
      const containerWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollLeft = todayPosition - containerWidth / 3;
    }
  }, [days]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        return newDate;
      });
    } else if (viewMode === '2months') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 2 : -2));
        return newDate;
      });
    } else if (viewMode === '3months') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
        return newDate;
      });
    } else {
      // Navigate by 6 months for 6 months view
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 6 : -6));
        return newDate;
      });
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setTimeout(() => {
      if (scrollRef.current && todayRef.current) {
        const todayPosition = todayRef.current.offsetLeft;
        const containerWidth = scrollRef.current.clientWidth;
        scrollRef.current.scrollLeft = todayPosition - containerWidth / 3;
      }
    }, 100);
  };

  const toggleExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const getBarPosition = (itemStart: Date, itemEnd: Date) => {
    // Normalize dates to avoid timezone issues
    const normalizedStart = new Date(itemStart);
    const normalizedEnd = new Date(itemEnd);
    const normalizedFirstDay = new Date(days[0]);
    
    // Set all to noon to avoid day boundary issues
    normalizedStart.setHours(12, 0, 0, 0);
    normalizedEnd.setHours(12, 0, 0, 0);
    normalizedFirstDay.setHours(12, 0, 0, 0);
    
    const startOffset = differenceInDays(normalizedStart, normalizedFirstDay);
    const duration = differenceInDays(normalizedEnd, normalizedStart) + 1;

    // Clamp values to visible range
    const clampedStartOffset = Math.max(0, startOffset);
    const clampedEndOffset = Math.min(startOffset + duration, days.length);
    const clampedDuration = clampedEndOffset - clampedStartOffset;

    const left = clampedStartOffset * cellWidth;
    const width = Math.max(clampedDuration * cellWidth, 0);
    const isVisible = clampedDuration > 0;

    return { left, width, isVisible };
  };

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    type: 'project' | 'task',
    id: string,
    originalStart: Date,
    originalEnd: Date,
    edge: 'start' | 'end' | 'move',
    projectId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({
      type,
      id,
      projectId,
      edge,
      startX: e.clientX,
      originalStart: new Date(originalStart),
      originalEnd: new Date(originalEnd),
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !onUpdateProject) return;

    const deltaX = e.clientX - dragging.startX;
    const deltaDays = Math.round(deltaX / cellWidth);

    if (deltaDays === 0) return;

    let newStart = dragging.originalStart;
    let newEnd = dragging.originalEnd;

    if (dragging.edge === 'start') {
      newStart = addDays(dragging.originalStart, deltaDays);
      if (newStart >= newEnd) newStart = addDays(newEnd, -1);
    } else if (dragging.edge === 'end') {
      newEnd = addDays(dragging.originalEnd, deltaDays);
      if (newEnd <= newStart) newEnd = addDays(newStart, 1);
    } else {
      newStart = addDays(dragging.originalStart, deltaDays);
      newEnd = addDays(dragging.originalEnd, deltaDays);
    }

    if (dragging.type === 'project') {
      // Update production dates when in production mode, otherwise update project dates
      if (showProductionOnly) {
        onUpdateProject(dragging.id, { producaoInicio: newStart, producaoFim: newEnd });
      } else {
        onUpdateProject(dragging.id, { dataInicio: newStart, dataFim: newEnd });
      }
    } else if (dragging.type === 'task' && dragging.projectId) {
      const project = projects.find(p => p.id === dragging.projectId);
      if (project) {
        const updatedTarefas = project.tarefas.map(t =>
          t.id === dragging.id
            ? { ...t, dataInicio: newStart, dataFim: newEnd }
            : t
        );
        onUpdateProject(dragging.projectId, { tarefas: updatedTarefas });
      }
    }
  }, [dragging, cellWidth, onUpdateProject, projects, showProductionOnly]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Filter out completed projects (sorting is handled by parent component)
  const sortedProjects = projects.filter(p => p.status !== 'concluido');

  // Build flat list of rows for rendering
  const rows: Array<{
    type: 'project' | 'task';
    project: Project;
    task?: Task;
  }> = [];

  if (showProductionOnly) {
    // Show projects with their production period from producaoInicio/producaoFim fields
    sortedProjects.forEach((project) => {
      if (project.producaoInicio && project.producaoFim) {
        rows.push({ type: 'project', project });
      }
    });
  } else {
    sortedProjects.forEach((project) => {
      rows.push({ type: 'project', project });
      if (expandedProjects.has(project.id)) {
        project.tarefas.forEach(task => {
          rows.push({ type: 'task', project, task });
        });
      }
    });
  }

  // Get selected item dates for highlighting - now specific to each item type
  // Uses isSameDay for inclusive range checking
  const selectedDates = useMemo(() => {
    if (!selectedItem && !dragging) return null;
    
    const itemToUse = dragging || selectedItem;
    if (!itemToUse) return null;

    if (itemToUse.type === 'project') {
      const project = projects.find(p => p.id === itemToUse.id);
      if (project) {
        return { start: new Date(project.dataInicio), end: new Date(project.dataFim) };
      }
    } else if (itemToUse.type === 'production') {
      // For production bars, highlight only the production period
      const project = projects.find(p => p.id === itemToUse.id);
      if (project?.producaoInicio && project?.producaoFim) {
        return { start: new Date(project.producaoInicio), end: new Date(project.producaoFim) };
      }
    } else if (itemToUse.type === 'delivery') {
      // For delivery bars, highlight only the delivery period
      const project = projects.find(p => p.id === itemToUse.id);
      if (project?.entregaInicio && project?.entregaFim) {
        return { start: new Date(project.entregaInicio), end: new Date(project.entregaFim) };
      }
    } else if (itemToUse.type === 'task') {
      // For tasks, highlight only the task period
      const projectId = 'projectId' in itemToUse ? itemToUse.projectId : null;
      if (projectId) {
        const project = projects.find(p => p.id === projectId);
        const task = project?.tarefas.find(t => t.id === itemToUse.id);
        if (task?.dataInicio && task?.dataFim) {
          return { start: new Date(task.dataInicio), end: new Date(task.dataFim) };
        }
      }
    }
    return null;
  }, [selectedItem, dragging, projects]);

  // Helper to check if a day is within selected range (inclusive)
  const isDayInSelectedRange = (day: Date, range: { start: Date; end: Date } | null) => {
    if (!range) return false;
    const normalizedDay = new Date(day);
    normalizedDay.setHours(12, 0, 0, 0);
    const normalizedStart = new Date(range.start);
    normalizedStart.setHours(12, 0, 0, 0);
    const normalizedEnd = new Date(range.end);
    normalizedEnd.setHours(12, 0, 0, 0);
    return normalizedDay >= normalizedStart && normalizedDay <= normalizedEnd;
  };

  // Find today's column index for the marker
  const todayIndex = days.findIndex(d => isToday(d));

  return (
    <div ref={containerRef} className="bg-card rounded-xl border border-border shadow-card overflow-hidden animate-fade-in">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigatePeriod('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="gap-2">
            <Calendar className="w-4 h-4" />
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigatePeriod('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground ml-2 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Delivery Toggle */}
          <Button
            variant={showDeliveryComparison ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowDeliveryComparison(!showDeliveryComparison)}
            className="gap-1.5 text-xs h-8"
            title="Mostrar barra de entrega abaixo do projeto"
          >
            <Truck className="w-3.5 h-3.5" />
            Entrega
          </Button>

          {/* Production Toggle - Combined comparison + production only */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={showProductionComparison ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setShowProductionComparison(!showProductionComparison);
                if (!showProductionComparison) setShowProductionOnly(false);
              }}
              className="gap-1 text-xs h-7"
              title="Mostrar barra de produção abaixo do projeto"
            >
              <Factory className="w-3 h-3" />
              Comparar
            </Button>
            <Button
              variant={showProductionOnly ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setShowProductionOnly(!showProductionOnly);
                if (!showProductionOnly) setShowProductionComparison(false);
              }}
              className="gap-1 text-xs h-7"
              title="Ver apenas projetos com período de produção"
            >
              Apenas
            </Button>
          </div>

          {onAddProject && (
            <Button onClick={onAddProject} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          )}
          
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="text-xs gap-1"
            >
              <ZoomIn className="w-3 h-3" />
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="text-xs"
            >
              Mês
            </Button>
            <Button
              variant={viewMode === '2months' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('2months')}
              className="text-xs"
            >
              2 Meses
            </Button>
            <Button
              variant={viewMode === '3months' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('3months')}
              className="text-xs"
            >
              3 Meses
            </Button>
            <Button
              variant={viewMode === '6months' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('6months')}
              className="text-xs gap-1"
            >
              <ZoomOut className="w-3 h-3" />
              6 Meses
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Project Names Column */}
        <div className="flex-shrink-0 w-48 md:w-64 border-r border-border">
          {/* Header row for project column - Week header height */}
          <div className="h-10 border-b border-border flex items-center px-4 bg-muted">
            <span className="text-sm font-semibold text-foreground">Projetos</span>
          </div>
          {/* Day header height */}
          <div className="h-8 border-b border-border bg-background" />
          
          {rows.map((row) => (
            <div
              key={row.type === 'project' ? row.project.id : `${row.project.id}-${row.task?.id}`}
              className={cn(
                'h-12 flex items-center gap-2 px-3 border-b border-border transition-colors group',
                row.type === 'project' 
                  ? 'bg-muted/50' 
                  : 'bg-background pl-6'
              )}
            >
              {row.type === 'project' ? (
                <>
                  <button
                    onClick={() => toggleExpand(row.project.id)}
                    className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    {row.project.tarefas.length > 0 && (
                      expandedProjects.has(row.project.id) 
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </button>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getColorByStatus(row.project.status) }}
                  />
                  <span className="text-sm font-medium text-foreground truncate flex-1">
                    {row.project.nome}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    {onAddTask && (
                      <button
                        onClick={() => onAddTask(row.project.id)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Adicionar tarefa"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onEditProject && (
                      <button
                        onClick={() => onEditProject(row.project)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Editar projeto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteProject && (
                      <button
                        onClick={() => onDeleteProject(row.project.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    row.task?.concluida ? 'bg-status-success' : 'bg-muted-foreground'
                  )} />
                  <span className={cn(
                    'text-xs truncate flex-1 text-muted-foreground',
                    row.task?.concluida && 'line-through opacity-60'
                  )}>
                    {row.task?.nome}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    {onEditTask && row.task && (
                      <button
                        onClick={() => onEditTask(row.project.id, row.task!)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                        title="Editar tarefa"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    {onDeleteTask && row.task && (
                      <button
                        onClick={() => onDeleteTask(row.project.id, row.task!.id)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        title="Excluir tarefa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Gantt Timeline */}
        <div className="flex-1 overflow-hidden" ref={scrollRef}>
          <div style={{ width: totalWidth }}>
            {/* Week/Month Headers */}
            <div className="h-10 border-b border-border flex bg-muted">
              {viewMode === '2months' || viewMode === '3months' || viewMode === '6months' ? (
                // Show month headers for multi-month views
                months.map((month, i) => {
                  const monthStart = startOfMonth(month);
                  const monthEnd = endOfMonth(month);
                  const monthDaysInView = days.filter(d => d >= monthStart && d <= monthEnd);
                  const monthWidth = monthDaysInView.length * cellWidth;
                  
                  return (
                    <div
                      key={i}
                      style={{ width: monthWidth }}
                      className="border-r-2 border-border flex items-center justify-center bg-muted"
                    >
                      <span className={cn(
                        "font-semibold text-foreground capitalize",
                        viewMode === '6months' ? "text-[10px]" : "text-sm"
                      )}>
                        {viewMode === '6months' 
                          ? format(month, 'MMM', { locale: ptBR })
                          : format(month, 'MMMM yyyy', { locale: ptBR })
                        }
                      </span>
                    </div>
                  );
                })
              ) : (
                // Show week headers for week/month view
                weeks.map((week, i) => {
                  const weekStart = week;
                  const weekEnd = addDays(week, 6);
                  const weekDaysInView = days.filter(d => d >= weekStart && d <= weekEnd);
                  const weekWidth = weekDaysInView.length * cellWidth;
                  const weekNum = getWeekOfMonth(week, { locale: ptBR });
                  
                  return (
                    <div
                      key={i}
                      style={{ width: weekWidth }}
                      className="border-r border-border/50 flex items-center justify-center"
                    >
                      <span className="text-sm font-semibold text-foreground">
                        Semana {weekNum}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Day Headers */}
            <div className="h-8 border-b border-border flex bg-background">
            {days.map((day, i) => {
                const isFirstOfMonth = day.getDate() === 1 && i > 0;
                const showDayNumber = viewMode !== '6months'; // Hide day numbers in 6 months view
                const dayOfWeek = getDay(day); // 0 = Sunday, 6 = Saturday
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                
                return (
                  <div
                    key={i}
                    ref={isToday(day) ? todayRef : null}
                    style={{ width: cellWidth }}
                    className={cn(
                      'flex-shrink-0 flex items-center justify-center text-xs',
                      isFirstOfMonth ? 'border-l-2 border-l-border' : 'border-r border-border/30',
                      isToday(day) && 'bg-primary/10'
                    )}
                  >
                    {showDayNumber && (
                      <span className={cn(
                        'font-medium',
                        viewMode === '3months' ? 'text-[9px]' : 'text-xs',
                        isToday(day) ? 'text-primary' : isWeekend ? 'text-muted-foreground/40' : 'text-muted-foreground'
                      )}>
                        {format(day, 'd')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Row Bars */}
            <div className="relative">
              {/* Today Marker Label */}
              {todayIndex >= 0 && (
                <div
                  className="absolute -top-[72px] z-30 transform -translate-x-1/2"
                  style={{ left: todayIndex * cellWidth + cellWidth / 2 }}
                >
                  <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    Hoje
                  </div>
                </div>
              )}

              {/* Today Line */}
              {todayIndex >= 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                  style={{
                    left: todayIndex * cellWidth + cellWidth / 2,
                  }}
                />
              )}

              {/* Row Bars */}
              {rows.map((row) => {
                if (row.type === 'project') {
                  // Use production dates when in production mode, otherwise use project dates
                  const barStartDate = showProductionOnly && row.project.producaoInicio 
                    ? new Date(row.project.producaoInicio) 
                    : new Date(row.project.dataInicio);
                  const barEndDate = showProductionOnly && row.project.producaoFim 
                    ? new Date(row.project.producaoFim) 
                    : new Date(row.project.dataFim);
                  
                  const { left, width, isVisible } = getBarPosition(barStartDate, barEndDate);

                  const barColor = getColorByStatus(row.project.status);

                  // Get production bar position for comparison mode
                  const hasProduction = row.project.producaoInicio && row.project.producaoFim;
                  const productionBar = hasProduction && showProductionComparison && !showProductionOnly
                    ? getBarPosition(new Date(row.project.producaoInicio!), new Date(row.project.producaoFim!))
                    : null;

                  // Get delivery bar position for comparison mode
                  const hasDelivery = row.project.entregaInicio && row.project.entregaFim;
                  const deliveryBar = hasDelivery && showDeliveryComparison && !showProductionOnly
                    ? getBarPosition(new Date(row.project.entregaInicio!), new Date(row.project.entregaFim!))
                    : null;

                  // Calculate row height based on comparison bars
                  const hasComparisonBars = (showProductionComparison && hasProduction) || (showDeliveryComparison && hasDelivery);

                  return (
                    <div 
                      key={row.project.id} 
                      className="h-12 relative border-b border-border bg-muted/50"
                    >
                      {/* Grid lines with highlight */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {days.map((day, i) => {
                          const isFirstOfMonth = day.getDate() === 1 && i > 0;
                          const isHighlighted = isDayInSelectedRange(day, selectedDates);
                          return (
                            <div
                              key={i}
                              style={{ width: cellWidth }}
                              className={cn(
                                'h-full',
                                isFirstOfMonth ? 'border-l-2 border-l-border' : 'border-r border-border/20',
                                isToday(day) && 'bg-primary/5',
                                isHighlighted && 'bg-primary/20'
                              )}
                            />
                          );
                        })}
                      </div>

                      {/* Main project bar */}
                      {isVisible && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute h-8 rounded cursor-move transition-shadow hover:shadow-lg flex items-center justify-center group/bar',
                                (dragging?.id === row.project.id && dragging?.type === 'project' || selectedItem?.id === row.project.id && selectedItem?.type === 'project') && 'ring-2 ring-primary',
                                hasComparisonBars ? 'top-1' : 'top-2'
                              )}
                              style={{
                                left,
                                width: Math.max(width, 60),
                                backgroundColor: barColor,
                              }}
                              onClick={() => {
                                // Toggle selection: if already selected, deselect
                                if (selectedItem?.id === row.project.id && selectedItem?.type === 'project') {
                                  setSelectedItem(null);
                                } else {
                                  setSelectedItem({ type: 'project', id: row.project.id });
                                }
                              }}
                              onMouseDown={(e) => handleMouseDown(
                                e,
                                'project',
                                row.project.id,
                                barStartDate,
                                barEndDate,
                                'move'
                              )}
                            >
                              {/* Left resize handle */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-l"
                                onMouseDown={(e) => handleMouseDown(
                                  e,
                                  'project',
                                  row.project.id,
                                  barStartDate,
                                  barEndDate,
                                  'start'
                                )}
                              />
                              
                              <span className="text-[10px] font-medium text-white truncate px-2 pointer-events-none drop-shadow-sm">
                                {format(barStartDate, "dd/MM", { locale: ptBR })} - {format(barEndDate, "dd/MM", { locale: ptBR })}
                              </span>

                              {/* Right resize handle */}
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-r"
                                onMouseDown={(e) => handleMouseDown(
                                  e,
                                  'project',
                                  row.project.id,
                                  barStartDate,
                                  barEndDate,
                                  'end'
                                )}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold">{row.project.nome}</p>
                              <p className="text-xs text-muted-foreground">{row.project.cliente}</p>
                              <p className="text-xs">
                                {showProductionOnly ? 'Produção: ' : 'Prazo: '}
                                {format(barStartDate, "dd MMM", { locale: ptBR })} →{' '}
                                {format(barEndDate, "dd MMM yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-xs">Progresso: {row.project.progresso}%</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Production comparison bar (smaller, below main bar) */}
                      {productionBar?.isVisible && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-7 h-4 rounded-sm cursor-pointer transition-shadow hover:shadow-md flex items-center justify-center',
                                (selectedItem?.id === row.project.id && selectedItem?.type === 'production') && 'ring-2 ring-orange-500'
                              )}
                              style={{
                                left: productionBar.left,
                                width: Math.max(productionBar.width, 30),
                                backgroundColor: '#f97316', // Orange color for production
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle selection
                                if (selectedItem?.id === row.project.id && selectedItem?.type === 'production') {
                                  setSelectedItem(null);
                                } else {
                                  setSelectedItem({ type: 'production', id: row.project.id });
                                }
                              }}
                            >
                              <Factory className="w-2.5 h-2.5 text-white" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold flex items-center gap-1">
                                <Factory className="w-3 h-3" />
                                Produção
                              </p>
                              <p className="text-xs">
                                {format(new Date(row.project.producaoInicio!), "dd MMM", { locale: ptBR })} →{' '}
                                {format(new Date(row.project.producaoFim!), "dd MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Delivery comparison bar (smaller, below main bar) */}
                      {deliveryBar?.isVisible && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute h-4 rounded-sm cursor-pointer transition-shadow hover:shadow-md flex items-center justify-center',
                                (selectedItem?.id === row.project.id && selectedItem?.type === 'delivery') && 'ring-2 ring-blue-500',
                                productionBar?.isVisible ? 'top-[42px]' : 'top-7'
                              )}
                              style={{
                                left: deliveryBar.left,
                                width: Math.max(deliveryBar.width, 30),
                                backgroundColor: '#3b82f6', // Blue color for delivery
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle selection
                                if (selectedItem?.id === row.project.id && selectedItem?.type === 'delivery') {
                                  setSelectedItem(null);
                                } else {
                                  setSelectedItem({ type: 'delivery', id: row.project.id });
                                }
                              }}
                            >
                              <Truck className="w-2.5 h-2.5 text-white" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                Entrega
                              </p>
                              <p className="text-xs">
                                {format(new Date(row.project.entregaInicio!), "dd MMM", { locale: ptBR })} →{' '}
                                {format(new Date(row.project.entregaFim!), "dd MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                } else {
                  // Task row
                  const task = row.task!;
                  const hasDate = task.dataInicio && task.dataFim;
                  
                  if (!hasDate) {
                    return (
                      <div 
                        key={`${row.project.id}-${task.id}`} 
                        className="h-12 relative border-b border-border bg-background"
                      >
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {days.map((day, i) => (
                            <div
                              key={i}
                              style={{ width: cellWidth }}
                              className={cn(
                                'h-full border-r border-border/20',
                                isToday(day) && 'bg-primary/5'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const { left, width, isVisible } = getBarPosition(
                    new Date(task.dataInicio!),
                    new Date(task.dataFim!)
                  );

                  const taskColor = getColorByStatus(row.project.status);

                  return (
                    <div 
                      key={`${row.project.id}-${task.id}`} 
                      className="h-12 relative border-b border-border bg-background"
                    >
                      {/* Grid lines with highlight */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {days.map((day, i) => {
                          const isFirstOfMonth = day.getDate() === 1 && i > 0;
                          const isHighlighted = isDayInSelectedRange(day, selectedDates);
                          return (
                            <div
                              key={i}
                              style={{ width: cellWidth }}
                              className={cn(
                                'h-full',
                                isFirstOfMonth ? 'border-l-2 border-l-border' : 'border-r border-border/20',
                                isToday(day) && 'bg-primary/5',
                                isHighlighted && 'bg-primary/20'
                              )}
                            />
                          );
                        })}
                      </div>

                      {isVisible && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-3 h-6 rounded-full cursor-move transition-shadow hover:shadow-md flex items-center',
                                task.concluida ? 'opacity-60' : '',
                                (dragging?.id === task.id && dragging?.type === 'task' || selectedItem?.id === task.id && selectedItem?.type === 'task') && 'ring-2 ring-primary ring-offset-1'
                              )}
                              style={{
                                left,
                                width: Math.max(width, 40),
                                backgroundColor: taskColor,
                                opacity: task.concluida ? 0.5 : 0.8,
                              }}
                              onClick={() => {
                                // Toggle selection: if already selected, deselect
                                if (selectedItem?.id === task.id && selectedItem?.type === 'task') {
                                  setSelectedItem(null);
                                } else {
                                  setSelectedItem({ type: 'task', id: task.id, projectId: row.project.id });
                                }
                              }}
                              onMouseDown={(e) => handleMouseDown(
                                e,
                                'task',
                                task.id,
                                task.dataInicio!,
                                task.dataFim!,
                                'move',
                                row.project.id
                              )}
                            >
                              {/* Left resize handle */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-l-full"
                                onMouseDown={(e) => handleMouseDown(
                                  e,
                                  'task',
                                  task.id,
                                  task.dataInicio!,
                                  task.dataFim!,
                                  'start',
                                  row.project.id
                                )}
                              />
                              
                              <span className="text-[9px] font-medium text-white truncate px-2 pointer-events-none drop-shadow-sm">
                                {format(task.dataInicio!, "dd/MM", { locale: ptBR })} - {format(task.dataFim!, "dd/MM", { locale: ptBR })}
                              </span>

                              {/* Right resize handle */}
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/10 rounded-r-full"
                                onMouseDown={(e) => handleMouseDown(
                                  e,
                                  'task',
                                  task.id,
                                  task.dataInicio!,
                                  task.dataFim!,
                                  'end',
                                  row.project.id
                                )}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="space-y-1">
                              <p className="font-semibold">{task.nome}</p>
                              {task.responsavel && (
                                <p className="text-xs text-muted-foreground">
                                  Responsável: {task.responsavel}
                                </p>
                              )}
                              <p className="text-xs">
                                {format(task.dataInicio!, "dd MMM", { locale: ptBR })} →{' '}
                                {format(task.dataFim!, "dd MMM", { locale: ptBR })}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex flex-wrap items-center gap-4 justify-end">
          <span className="text-xs font-medium text-muted-foreground mr-auto">Legenda:</span>
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-foreground">{category.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
