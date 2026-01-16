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
      'liquid-glass rounded-xl p-6 lg:p-8 animate-fade-in transition-all duration-200 hover:shadow-card-hover',
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-sm lg:text-base text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-card-foreground tracking-tight truncate">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm font-medium',
              trend.isPositive ? 'text-[hsl(var(--status-success))]' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% este mês
            </p>
          )}
        </div>
        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-accent/50 flex items-center justify-center text-accent-foreground shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}
