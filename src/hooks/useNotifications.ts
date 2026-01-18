import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { addDays, isBefore, isAfter, startOfDay, differenceInDays } from 'date-fns';

export type NotificationType = 'projeto_prazo' | 'conta_vencer' | 'conta_vencida' | 'projeto_atrasado';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  date: Date;
  actionUrl?: string;
  meta?: Record<string, unknown>;
}

export function useNotifications() {
  const { projects } = useProjects();
  const { transactions } = useFinanceiro();

  const notifications = useMemo<Notification[]>(() => {
    const today = startOfDay(new Date());
    const next7Days = addDays(today, 7);
    const next3Days = addDays(today, 3);
    const allNotifications: Notification[] = [];

    // Projects nearing deadline (within 7 days)
    projects.forEach(project => {
      if (project.status === 'concluido' || project.status === 'cancelado') return;
      
      const endDate = new Date(project.dataFim);
      const daysRemaining = differenceInDays(endDate, today);

      // Project overdue
      if (isBefore(endDate, today)) {
        allNotifications.push({
          id: `project-overdue-${project.id}`,
          type: 'projeto_atrasado',
          title: 'Projeto Atrasado',
          message: `"${project.nome}" está atrasado em ${Math.abs(daysRemaining)} dias`,
          severity: 'error',
          date: endDate,
          actionUrl: `/projetos/${project.id}`,
          meta: { projectId: project.id, daysOverdue: Math.abs(daysRemaining) },
        });
      }
      // Project deadline within 7 days
      else if (isBefore(endDate, next7Days)) {
        allNotifications.push({
          id: `project-deadline-${project.id}`,
          type: 'projeto_prazo',
          title: 'Prazo Próximo',
          message: `"${project.nome}" vence em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}`,
          severity: daysRemaining <= 3 ? 'warning' : 'info',
          date: endDate,
          actionUrl: `/projetos/${project.id}`,
          meta: { projectId: project.id, daysRemaining },
        });
      }
    });

    // Pending transactions
    transactions.forEach(transaction => {
      if (transaction.status !== 'pendente') return;
      
      const dueDate = new Date(transaction.data_vencimento);
      const daysRemaining = differenceInDays(dueDate, today);

      // Transaction overdue
      if (isBefore(dueDate, today)) {
        allNotifications.push({
          id: `transaction-overdue-${transaction.id}`,
          type: 'conta_vencida',
          title: transaction.tipo === 'receita' ? 'Recebimento Vencido' : 'Pagamento Vencido',
          message: `"${transaction.descricao}" venceu há ${Math.abs(daysRemaining)} dias - R$ ${transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          severity: 'error',
          date: dueDate,
          actionUrl: transaction.tipo === 'receita' ? '/financeiro/receitas' : '/financeiro/despesas',
          meta: { transactionId: transaction.id, valor: transaction.valor, tipo: transaction.tipo },
        });
      }
      // Transaction due within 7 days
      else if (isBefore(dueDate, next7Days)) {
        allNotifications.push({
          id: `transaction-due-${transaction.id}`,
          type: 'conta_vencer',
          title: transaction.tipo === 'receita' ? 'Recebimento a Vencer' : 'Pagamento a Vencer',
          message: `"${transaction.descricao}" vence em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} - R$ ${transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          severity: daysRemaining <= 3 ? 'warning' : 'info',
          date: dueDate,
          actionUrl: transaction.tipo === 'receita' ? '/financeiro/receitas' : '/financeiro/despesas',
          meta: { transactionId: transaction.id, valor: transaction.valor, tipo: transaction.tipo },
        });
      }
    });

    // Sort by severity (error first) then by date
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return allNotifications.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.date.getTime() - b.date.getTime();
    });
  }, [projects, transactions]);

  const unreadCount = notifications.length;
  const hasNotifications = notifications.length > 0;
  const criticalCount = notifications.filter(n => n.severity === 'error').length;
  const warningCount = notifications.filter(n => n.severity === 'warning').length;

  return {
    notifications,
    unreadCount,
    hasNotifications,
    criticalCount,
    warningCount,
  };
}
