import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useQuotes } from '@/hooks/useQuotes';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { differenceInDays, startOfMonth, endOfMonth, subMonths, isWithinInterval, format } from 'date-fns';

export interface ProductivityMetrics {
  // Project metrics
  avgProjectDuration: number;
  avgProjectValue: number;
  projectsCompleted: number;
  projectsInProgress: number;
  onTimeDeliveryRate: number;

  // Quote metrics
  quoteConversionRate: number;
  totalQuotes: number;
  approvedQuotes: number;
  avgQuoteValue: number;

  // Financial metrics
  avgTicketPerClient: number;
  profitMarginPerProject: number;
  totalRevenue: number;
  totalExpenses: number;

  // Monthly comparison
  monthlyComparison: {
    month: string;
    revenue: number;
    expenses: number;
    projectsCompleted: number;
    quotesApproved: number;
  }[];

  // Top clients
  topClients: {
    id: string;
    nome: string;
    totalValue: number;
    projectCount: number;
  }[];
}

export function useProductivityMetrics() {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { quotes, isLoading: quotesLoading } = useQuotes();
  const { transactions, isLoading: transactionsLoading } = useFinanceiro();
  const { clientes, isLoading: clientesLoading } = useResponsaveis();

  const isLoading = projectsLoading || quotesLoading || transactionsLoading || clientesLoading;

  const metrics = useMemo<ProductivityMetrics>(() => {
    // Project metrics
    const completedProjects = projects.filter(p => p.status === 'entregue' || p.status === 'finalizado');
    const inProgressProjects = projects.filter(p => 
      p.status !== 'entregue' && p.status !== 'finalizado' && p.status !== 'cancelado'
    );

    const avgProjectDuration = completedProjects.length > 0
      ? completedProjects.reduce((sum, p) => {
          const days = differenceInDays(new Date(p.dataFim), new Date(p.dataInicio));
          return sum + days;
        }, 0) / completedProjects.length
      : 0;

    const avgProjectValue = completedProjects.length > 0
      ? completedProjects.reduce((sum, p) => sum + (p.valor || 0), 0) / completedProjects.length
      : 0;

    // On-time delivery rate
    const onTimeProjects = completedProjects.filter(p => {
      const deliveryDate = new Date(p.dataFim);
      const actualDate = p.updatedAt ? new Date(p.updatedAt) : deliveryDate;
      return actualDate <= deliveryDate;
    });
    const onTimeDeliveryRate = completedProjects.length > 0
      ? (onTimeProjects.length / completedProjects.length) * 100
      : 0;

    // Quote metrics
    const approvedQuotes = quotes.filter(q => q.status === 'aprovado');
    const sentQuotes = quotes.filter(q => q.status !== 'rascunho');
    const quoteConversionRate = sentQuotes.length > 0
      ? (approvedQuotes.length / sentQuotes.length) * 100
      : 0;

    const avgQuoteValue = quotes.length > 0
      ? quotes.reduce((sum, q) => sum + q.valor_total, 0) / quotes.length
      : 0;

    // Financial metrics
    const paidRevenues = transactions
      .filter(t => t.tipo === 'receita' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    const paidExpenses = transactions
      .filter(t => t.tipo === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    const profitMarginPerProject = paidRevenues > 0
      ? ((paidRevenues - paidExpenses) / paidRevenues) * 100
      : 0;

    // Avg ticket per client
    const clientsWithProjects = clientes.filter(c => 
      projects.some(p => p.clientId === c.id)
    );
    const avgTicketPerClient = clientsWithProjects.length > 0
      ? projects.reduce((sum, p) => sum + (p.valor || 0), 0) / clientsWithProjects.length
      : 0;

    // Monthly comparison (last 6 months)
    const monthlyComparison = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const monthRevenue = transactions
        .filter(t => 
          t.tipo === 'receita' && 
          t.status === 'pago' &&
          isWithinInterval(new Date(t.data_vencimento), { start, end })
        )
        .reduce((sum, t) => sum + t.valor, 0);

      const monthExpenses = transactions
        .filter(t => 
          t.tipo === 'despesa' && 
          t.status === 'pago' &&
          isWithinInterval(new Date(t.data_vencimento), { start, end })
        )
        .reduce((sum, t) => sum + t.valor, 0);

      const monthProjectsCompleted = projects.filter(p =>
        (p.status === 'entregue' || p.status === 'finalizado') &&
        isWithinInterval(new Date(p.updatedAt), { start, end })
      ).length;

      const monthQuotesApproved = quotes.filter(q =>
        q.status === 'aprovado' &&
        isWithinInterval(new Date(q.updated_at), { start, end })
      ).length;

      monthlyComparison.push({
        month: format(monthDate, 'MMM'),
        revenue: monthRevenue,
        expenses: monthExpenses,
        projectsCompleted: monthProjectsCompleted,
        quotesApproved: monthQuotesApproved,
      });
    }

    // Top clients by value
    const clientValueMap = new Map<string, { nome: string; totalValue: number; projectCount: number }>();
    projects.forEach(p => {
      if (p.clientId) {
        const cliente = clientes.find(c => c.id === p.clientId);
        if (cliente) {
          const existing = clientValueMap.get(p.clientId) || { nome: cliente.nome, totalValue: 0, projectCount: 0 };
          clientValueMap.set(p.clientId, {
            nome: cliente.nome,
            totalValue: existing.totalValue + (p.valor || 0),
            projectCount: existing.projectCount + 1,
          });
        }
      }
    });

    const topClients = Array.from(clientValueMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    return {
      avgProjectDuration,
      avgProjectValue,
      projectsCompleted: completedProjects.length,
      projectsInProgress: inProgressProjects.length,
      onTimeDeliveryRate,
      quoteConversionRate,
      totalQuotes: quotes.length,
      approvedQuotes: approvedQuotes.length,
      avgQuoteValue,
      avgTicketPerClient,
      profitMarginPerProject,
      totalRevenue: paidRevenues,
      totalExpenses: paidExpenses,
      monthlyComparison,
      topClients,
    };
  }, [projects, quotes, transactions, clientes]);

  return { metrics, isLoading };
}
