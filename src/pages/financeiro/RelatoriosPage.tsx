import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useOrderItems } from '@/hooks/useOrderItems';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  subMonths, 
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  getMonth,
  getYear,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type PeriodFilter = 'month' | 'quarter' | 'semester' | 'year' | 'custom';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(339, 90%, 51%)',
  'hsl(25, 95%, 53%)',
];

export default function RelatoriosPage() {
  const { transactions, categories } = useFinanceiro();
  const { projects } = useProjects();
  const { responsaveis } = useResponsaveis();
  const { orderItems } = useOrderItems();
  const { products } = useProducts();

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('year');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  // Get date range based on period filter
  const getDateRange = () => {
    const now = new Date();
    switch (periodFilter) {
      case 'month':
        const monthStart = new Date(selectedYear, selectedMonth, 1);
        return { start: startOfMonth(monthStart), end: endOfMonth(monthStart) };
      case 'quarter':
        return { start: subMonths(now, 3), end: now };
      case 'semester':
        return { start: subMonths(now, 6), end: now };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { 
            start: parseISO(customStartDate), 
            end: parseISO(customEndDate) 
          };
        }
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'year':
      default:
        return { start: new Date(selectedYear, 0, 1), end: new Date(selectedYear, 11, 31) };
    }
  };

  // Monthly evolution data
  const monthlyEvolution = useMemo(() => {
    const months = eachMonthOfInterval({
      start: new Date(selectedYear, 0, 1),
      end: new Date(selectedYear, 11, 31)
    });

    return months.map(month => {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);

      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.data_vencimento);
        return isWithinInterval(date, { start: startDate, end: endDate });
      });

      const receitas = monthTransactions
        .filter(t => t.tipo === 'receita' && t.status === 'pago')
        .reduce((sum, t) => sum + t.valor, 0);

      const despesas = monthTransactions
        .filter(t => t.tipo === 'despesa' && t.status === 'pago')
        .reduce((sum, t) => sum + t.valor, 0);

      return {
        mes: format(month, 'MMM', { locale: ptBR }),
        mesNum: getMonth(month),
        receitas,
        despesas,
        saldo: receitas - despesas,
        acumulado: 0, // Will be calculated below
      };
    });
  }, [transactions, selectedYear]);

  // Calculate accumulated balance
  const monthlyWithAccumulated = useMemo(() => {
    let accumulated = 0;
    return monthlyEvolution.map(item => {
      accumulated += item.saldo;
      return { ...item, acumulado: accumulated };
    });
  }, [monthlyEvolution]);

  // Financial summary for period
  const financialSummary = useMemo(() => {
    const { start, end } = getDateRange();

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return isWithinInterval(date, { start, end });
    });

    const receitas = filteredTransactions
      .filter(t => t.tipo === 'receita' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    const despesas = filteredTransactions
      .filter(t => t.tipo === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    const pendentesReceita = filteredTransactions
      .filter(t => t.tipo === 'receita' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.valor, 0);

    const pendentesDespesa = filteredTransactions
      .filter(t => t.tipo === 'despesa' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.valor, 0);

    return { 
      receitas, 
      despesas, 
      saldo: receitas - despesas,
      pendentesReceita,
      pendentesDespesa,
      totalReceitas: receitas + pendentesReceita,
      totalDespesas: despesas + pendentesDespesa,
    };
  }, [transactions, periodFilter, selectedYear, selectedMonth, customStartDate, customEndDate]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const { start, end } = getDateRange();

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return t.tipo === 'despesa' && t.status === 'pago' && 
             isWithinInterval(date, { start, end });
    });

    const byCategory: Record<string, { nome: string; valor: number; cor: string }> = {};

    filteredTransactions.forEach(t => {
      const category = categories.find(c => c.id === t.category_id);
      const categoryName = category?.nome || 'Sem categoria';
      const categoryColor = category?.cor || '#888888';
      
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = { nome: categoryName, valor: 0, cor: categoryColor };
      }
      byCategory[categoryName].valor += t.valor;
    });

    return Object.values(byCategory)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [transactions, categories, periodFilter, selectedYear, selectedMonth, customStartDate, customEndDate]);

  // Revenue by category
  const revenueByCategory = useMemo(() => {
    const { start, end } = getDateRange();

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return t.tipo === 'receita' && t.status === 'pago' && 
             isWithinInterval(date, { start, end });
    });

    const byCategory: Record<string, { nome: string; valor: number; cor: string }> = {};

    filteredTransactions.forEach(t => {
      const category = categories.find(c => c.id === t.category_id);
      const categoryName = category?.nome || 'Sem categoria';
      const categoryColor = category?.cor || '#888888';
      
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = { nome: categoryName, valor: 0, cor: categoryColor };
      }
      byCategory[categoryName].valor += t.valor;
    });

    return Object.values(byCategory)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [transactions, categories, periodFilter, selectedYear, selectedMonth, customStartDate, customEndDate]);

  // Top clients by revenue
  const topClients = useMemo(() => {
    const { start, end } = getDateRange();

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return t.tipo === 'receita' && t.status === 'pago' && 
             t.client_id && isWithinInterval(date, { start, end });
    });

    const byClient: Record<string, { nome: string; valor: number; count: number }> = {};

    filteredTransactions.forEach(t => {
      const client = responsaveis.find(r => r.id === t.client_id);
      const clientName = client?.nome || 'Desconhecido';
      
      if (!byClient[clientName]) {
        byClient[clientName] = { nome: clientName, valor: 0, count: 0 };
      }
      byClient[clientName].valor += t.valor;
      byClient[clientName].count += 1;
    });

    return Object.values(byClient)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [transactions, responsaveis, periodFilter, selectedYear, selectedMonth, customStartDate, customEndDate]);

  // Revenue by project
  const revenueByProject = useMemo(() => {
    const { start, end } = getDateRange();

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return t.tipo === 'receita' && t.status === 'pago' && 
             t.project_id && isWithinInterval(date, { start, end });
    });

    const byProject: Record<string, { nome: string; valor: number }> = {};

    filteredTransactions.forEach(t => {
      const project = projects.find(p => p.id === t.project_id);
      const projectName = project?.nome || 'Sem projeto';
      
      if (!byProject[projectName]) {
        byProject[projectName] = { nome: projectName, valor: 0 };
      }
      byProject[projectName].valor += t.valor;
    });

    return Object.values(byProject)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [transactions, projects, periodFilter, selectedYear, selectedMonth, customStartDate, customEndDate]);

  // Top products by usage in orders
  const topProducts = useMemo(() => {
    const productUsage: Record<string, { nome: string; quantidade: number; valor: number }> = {};

    orderItems.forEach(item => {
      if (item.item_type === 'product' || item.item_type === 'foam') {
        const product = products.find(p => p.id === item.product_id);
        const nome = item.nome || product?.nome || 'Produto';
        
        if (!productUsage[nome]) {
          productUsage[nome] = { nome, quantidade: 0, valor: 0 };
        }
        productUsage[nome].quantidade += item.quantidade;
        productUsage[nome].valor += item.total;
      }
    });

    return Object.values(productUsage)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8);
  }, [orderItems, products]);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(t => {
      years.add(getYear(new Date(t.data_vencimento)));
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Available months
  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: format(new Date(2000, i, 1), 'MMMM', { locale: ptBR }),
    }));
  }, []);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'month':
        return format(new Date(selectedYear, selectedMonth), 'MMMM/yyyy', { locale: ptBR });
      case 'quarter':
        return 'Último Trimestre';
      case 'semester':
        return 'Último Semestre';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(parseISO(customStartDate), 'dd/MM/yyyy')} - ${format(parseISO(customEndDate), 'dd/MM/yyyy')}`;
        }
        return 'Período Personalizado';
      case 'year':
      default:
        return String(selectedYear);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">Análise detalhada das finanças do seu negócio</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês Específico</SelectItem>
                <SelectItem value="quarter">Último Trimestre</SelectItem>
                <SelectItem value="semester">Último Semestre</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {(periodFilter === 'month' || periodFilter === 'year') && (
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {periodFilter === 'month' && (
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {periodFilter === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {customStartDate && customEndDate 
                      ? `${format(parseISO(customStartDate), 'dd/MM/yy')} - ${format(parseISO(customEndDate), 'dd/MM/yy')}`
                      : 'Selecionar datas'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Data Inicial</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data Final</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas Pagas</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.receitas)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A receber: {formatCurrency(financialSummary.pendentesReceita)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ArrowUpRight className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Pagas</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(financialSummary.despesas)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A pagar: {formatCurrency(financialSummary.pendentesDespesa)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <ArrowDownRight className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo do Período</p>
                  <p className={`text-2xl font-bold ${financialSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(financialSummary.saldo)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  financialSummary.saldo >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-destructive/10'
                }`}>
                  <DollarSign className={`h-6 w-6 ${financialSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Margem</p>
                  <p className={`text-2xl font-bold ${financialSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {financialSummary.receitas > 0 
                      ? `${((financialSummary.saldo / financialSummary.receitas) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Lucro sobre receita</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Evolution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyWithAccumulated}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} />
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

        {/* Accumulated Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Saldo Acumulado {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyWithAccumulated}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="acumulado" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                    name="Saldo Acumulado"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Despesas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <div className="h-[200px] w-full lg:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="valor"
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {expensesByCategory.map((cat, index) => (
                      <div key={cat.nome} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.cor || COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm truncate max-w-[150px]">{cat.nome}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(cat.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma despesa no período</p>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Receitas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByCategory.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <div className="h-[200px] w-full lg:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={revenueByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="valor"
                        >
                          {revenueByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {revenueByCategory.map((cat, index) => (
                      <div key={cat.nome} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.cor || COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm truncate max-w-[150px]">{cat.nome}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(cat.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma receita no período</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Clientes por Receita</CardTitle>
            </CardHeader>
            <CardContent>
              {topClients.length > 0 ? (
                <div className="space-y-3">
                  {topClients.map((client, index) => (
                    <div key={client.nome} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium">{client.nome}</span>
                          <p className="text-xs text-muted-foreground">{client.count} transações</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(client.valor)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum cliente no período</p>
              )}
            </CardContent>
          </Card>

          {/* Top Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Projetos por Receita</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByProject.length > 0 ? (
                <div className="space-y-3">
                  {revenueByProject.map((project, index) => (
                    <div key={project.nome} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[200px]">{project.nome}</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(project.valor)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum projeto no período</p>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Produtos Mais Usados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.nome} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium truncate max-w-[150px] block">{product.nome}</span>
                          <span className="text-xs text-muted-foreground">{product.quantidade} unid.</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(product.valor)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum produto vendido</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
