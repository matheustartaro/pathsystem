import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      'liquid-glass rounded-lg p-4 lg:p-5 animate-fade-in transition-all duration-200 hover:shadow-card-hover',
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-xs lg:text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-lg lg:text-xl xl:text-2xl font-bold text-card-foreground tracking-tight truncate">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-[hsl(var(--status-success))]' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% este mês
            </p>
          )}
        </div>
        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-accent/50 flex items-center justify-center text-accent-foreground shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}
