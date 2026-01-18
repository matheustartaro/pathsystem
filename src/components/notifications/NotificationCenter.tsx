import { useNavigate } from 'react-router-dom';
import { Bell, FolderKanban, Receipt, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, NotificationType } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeIcons: Record<NotificationType, React.ReactNode> = {
  projeto_prazo: <Clock className="h-4 w-4" />,
  projeto_atrasado: <AlertCircle className="h-4 w-4" />,
  conta_vencer: <Receipt className="h-4 w-4" />,
  conta_vencida: <AlertCircle className="h-4 w-4" />,
};

const severityClasses = {
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

const severityIconBg = {
  error: 'bg-destructive/20',
  warning: 'bg-amber-500/20',
  info: 'bg-blue-500/20',
};

export function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, criticalCount } = useNotifications();

  const handleNotificationClick = (url?: string) => {
    if (url) {
      navigate(url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-medium",
              criticalCount > 0 
                ? "bg-destructive text-destructive-foreground" 
                : "bg-amber-500 text-white"
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h4 className="font-semibold">Notificações</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount === 0 
                ? 'Nenhuma notificação' 
                : `${unreadCount} pendente${unreadCount !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Tudo em dia! Não há notificações pendentes.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.actionUrl)}
                  className={cn(
                    "w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50",
                    notification.actionUrl && "cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    severityIconBg[notification.severity]
                  )}>
                    {typeIcons[notification.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(notification.date, 'dd/MM', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  {notification.actionUrl && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
