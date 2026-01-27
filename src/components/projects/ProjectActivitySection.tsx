import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectActivities } from '@/hooks/useProjectActivities';
import { cn } from '@/lib/utils';

interface ProjectActivitySectionProps {
  projectId: string;
}

export function ProjectActivitySection({ projectId }: ProjectActivitySectionProps) {
  const { activities, isLoading, getActivityIcon, getActivityColor } = useProjectActivities(projectId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Clock className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-xs">Nenhuma atividade registrada</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-3">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="relative flex gap-3">
                    {/* Timeline dot */}
                    <div className={cn(
                      'relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-background border-2',
                      getActivityColor(activity.tipo).replace('text-', 'border-')
                    )}>
                      <span className="text-xs">{getActivityIcon(activity.tipo)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-3">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-sm text-foreground">{activity.descricao}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {activity.user_name && (
                            <>
                              <span className="font-medium">{activity.user_name}</span>
                              <span>•</span>
                            </>
                          )}
                          <span title={format(activity.created_at, "dd/MM/yyyy HH:mm", { locale: ptBR })}>
                            {formatDistanceToNow(activity.created_at, { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
