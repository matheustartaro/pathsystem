import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingSpinner({ 
  size = 'md', 
  className,
  label = 'Carregando...'
}: LoadingSpinnerProps) {
  return (
    <div 
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label={label}
    >
      <Loader2 
        className={cn('animate-spin text-primary', sizeClasses[size])} 
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Carregando página...' }: PageLoadingProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
