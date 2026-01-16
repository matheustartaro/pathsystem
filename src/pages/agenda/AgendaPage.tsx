import { useState, useMemo } from 'react';
import { format, isSameDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Clock, Users, Trash2, Edit2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useEvents, Event } from '@/hooks/useEvents';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { EventFormDialog } from '@/components/agenda/EventFormDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AgendaPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { events, isLoading, addEvent, updateEvent, deleteEvent } = useEvents();
  const { projects } = useProjects();
  const { responsaveis } = useResponsaveis();
  const { toast } = useToast();

  const eventsToday = useMemo(() => {
    const today = new Date();
    return events.filter(e => isSameDay(new Date(e.data_inicio), today));
  }, [events]);

  const eventsThisWeek = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 0 });
    const end = endOfWeek(now, { weekStartsOn: 0 });
    return events.filter(e => {
      const eventDate = new Date(e.data_inicio);
      return isWithinInterval(eventDate, { start, end });
    });
  }, [events]);

  const projectsWithDates = useMemo(() => {
    return projects.filter(p => p.dataInicio || p.dataFim);
  }, [projects]);

  const eventsForSelectedDate = useMemo(() => {
    return events.filter(e => isSameDay(new Date(e.data_inicio), date));
  }, [events, date]);

  const datesWithEvents = useMemo(() => {
    return events.map(e => new Date(e.data_inicio));
  }, [events]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleSaveEvent = async (data: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data);
      toast({ title: 'Evento atualizado!' });
    } else {
      await addEvent(data);
      toast({ title: 'Evento criado!' });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteEvent(id);
    toast({ title: 'Evento excluído', variant: 'destructive' });
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId)?.nome;
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    return responsaveis.find(r => r.id === clientId)?.nome;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
            <p className="text-muted-foreground">Organize seus compromissos e eventos</p>
          </div>
          <Button onClick={handleAddEvent}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
              <CalendarIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsToday.length}</div>
              <p className="text-xs text-muted-foreground">Compromissos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Clock className="h-4 w-4 text-status-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsThisWeek.length}</div>
              <p className="text-xs text-muted-foreground">Eventos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Users className="h-4 w-4 text-status-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectsWithDates.length}</div>
              <p className="text-xs text-muted-foreground">Com datas na agenda</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          <Card>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                locale={ptBR}
                className="rounded-md"
                modifiers={{
                  hasEvents: datesWithEvents,
                }}
                modifiersStyles={{
                  hasEvents: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: 'hsl(var(--primary))',
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Eventos do Dia
                  <span className="ml-2 text-muted-foreground font-normal text-base">
                    {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </span>
                </span>
                <Button size="sm" variant="outline" onClick={handleAddEvent}>
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : eventsForSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {eventsForSelectedDate.map(event => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleEditEvent(event)}
                    >
                      <div
                        className="w-1 h-full min-h-[3rem] rounded-full shrink-0"
                        style={{ backgroundColor: event.cor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium truncate">{event.titulo}</h4>
                            {!event.dia_todo && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.data_inicio), 'HH:mm')}
                                {event.data_fim && ` - ${format(new Date(event.data_fim), 'HH:mm')}`}
                              </p>
                            )}
                            {event.dia_todo && (
                              <p className="text-sm text-muted-foreground">Dia inteiro</p>
                            )}
                          </div>
                        </div>
                        {event.descricao && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {event.descricao}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {getProjectName(event.project_id) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {getProjectName(event.project_id)}
                            </span>
                          )}
                          {getClientName(event.client_id) && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                              {getClientName(event.client_id)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento para este dia</p>
                  <p className="text-sm">Clique em "Novo Evento" para adicionar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        initialDate={date}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </AppLayout>
  );
}
