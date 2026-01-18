import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Layers,
  UsersRound,
  BoxIcon,
  HandCoins,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  format
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
];

export function VisaoGeralTab() {
  const { transactions } = useFinanceiro();
  const { projects } = useProjects();
  const { responsaveis } = useResponsaveis();
  const { products } = useProducts();
  const { services } = useServices();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCompact = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  // Current month summary
  const currentMonthSummary = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const filtered = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return isWithinInterval(date, { start, end });
    });

    const receitas = filtered.filter(t => t.tipo === 'receita' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
    const despesas = filtered.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
    const pendentes = filtered.filter(t => t.status === 'pendente').length;

    return { receitas, despesas, saldo: receitas - despesas, pendentes };
  }, [transactions]);

  // Yearly evolution
  const yearlyEvolution = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: startOfYear(now),
      end: endOfYear(now)
    });

    return months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const filtered = transactions.filter(t => {
        const date = new Date(t.data_vencimento);
        return isWithinInterval(date, { start, end });
      });

      const receitas = filtered.filter(t => t.tipo === 'receita' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
      const despesas = filtered.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);

      return {
        mes: format(month, 'MMM', { locale: ptBR }),
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });
  }, [transactions]);

  // Project status distribution
  const projectsByStatus = useMemo(() => {
    const byStatus: Record<string, number> = {};
    projects.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });
    return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Count active items
  const clientes = responsaveis.filter(r => r.tipo === 'cliente' || !r.tipo).length;
  const produtosAtivos = products.filter(p => p.ativo).length;
  const servicosAtivos = services.filter(s => s.ativo).length;
  const projetosAtivos = projects.filter(p => p.status !== 'concluido' && p.status !== 'cancelado').length;
  // Removed stock functionality

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receitas (mês)</p>
                <p className="text-lg font-bold text-green-600">{formatCompact(currentMonthSummary.receitas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas (mês)</p>
                <p className="text-lg font-bold text-destructive">{formatCompact(currentMonthSummary.despesas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${currentMonthSummary.saldo >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-destructive/10'}`}>
                <DollarSign className={`h-5 w-5 ${currentMonthSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo (mês)</p>
                <p className={`text-lg font-bold ${currentMonthSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCompact(currentMonthSummary.saldo)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projetos Ativos</p>
                <p className="text-lg font-bold">{projetosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <UsersRound className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clientes</p>
                <p className="text-lg font-bold">{clientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <BoxIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{produtosAtivos}</p>
              <p className="text-xs text-muted-foreground">Produtos Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <HandCoins className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{servicosAtivos}</p>
              <p className="text-xs text-muted-foreground">Serviços Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-xs text-muted-foreground">Total Projetos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{currentMonthSummary.pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes (mês)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yearly Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projetos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {projectsByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
