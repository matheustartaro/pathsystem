import { ProjectStatus } from '@/types/project';

/**
 * Get display label for a status key
 * This is a fallback - prefer using useStatusCategories().getCategoryByStatus() for dynamic labels
 */
export const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    pausado: 'Pausado',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    aguardando_pagamento: 'Aguardando Pagamento',
  };
  return labels[status] || status;
};

/**
 * Get Tailwind color class for a status
 * This is a fallback - prefer using useStatusCategories().getColorByStatus() for dynamic colors
 */
export const getStatusColor = (status: ProjectStatus): string => {
  const colors: Record<string, string> = {
    pendente: 'bg-primary/70',
    em_andamento: 'bg-primary',
    pausado: 'bg-muted-foreground',
    concluido: 'bg-muted-foreground/70',
    cancelado: 'bg-destructive',
    aguardando_pagamento: 'bg-amber-500',
  };
  return colors[status] || 'bg-muted';
};
