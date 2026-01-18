import { useMemo, memo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  DollarSign, 
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProductivityMetrics } from '@/hooks/useProductivityMetrics';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';

function MetricasPage() {
  const { metrics, isLoading } = useProductivityMetrics();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  const formatCompact = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Métricas de Produtividade</h1>
          <p className="text-muted-foreground">Análise de performance e indicadores do negócio</p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Tempo médio */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio/Projeto</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(metrics.avgProjectDuration, 0)} dias
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taxa de conversão */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversão Orçamentos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercent(metrics.quoteConversionRate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.approvedQuotes}/{metrics.totalQuotes} aprovados
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket médio */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio/Cliente</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(metrics.avgTicketPerClient)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Margem de lucro */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                  <p className={`text-2xl font-bold ${metrics.profitMarginPerProject >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatPercent(metrics.profitMarginPerProject)}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  metrics.profitMarginPerProject >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'
                }`}>
                  <DollarSign className={`h-5 w-5 ${
                    metrics.profitMarginPerProject >= 0 ? 'text-green-600' : 'text-destructive'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second row of KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projetos Concluídos</p>
                  <p className="text-2xl font-bold">{metrics.projectsCompleted}</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.projectsInProgress}</p>
                </div>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Entrega no Prazo</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercent(metrics.onTimeDeliveryRate)}
                  </p>
                </div>
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Médio/Projeto</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.avgProjectValue)}</p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Comparativo Mensal
              </CardTitle>
              <CardDescription>Receitas vs Despesas (últimos 6 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Receitas" />
                    <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Projects and Quotes Evolution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução de Vendas
              </CardTitle>
              <CardDescription>Projetos concluídos e orçamentos aprovados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="projectsCompleted" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.2} 
                      name="Projetos" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="quotesApproved" 
                      stroke="hsl(142, 76%, 36%)" 
                      fill="hsl(142, 76%, 36%)" 
                      fillOpacity={0.2} 
                      name="Orçamentos Aprovados" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 10 Clientes
            </CardTitle>
            <CardDescription>Clientes com maior valor em projetos</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.topClients.length > 0 ? (
              <div className="space-y-3">
                {metrics.topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.nome}</p>
                        <p className="text-xs text-muted-foreground">{client.projectCount} projeto(s)</p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(client.totalValue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum cliente com projetos encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default memo(MetricasPage);
