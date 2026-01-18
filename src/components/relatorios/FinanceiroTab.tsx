import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { exportHelpers } from '@/lib/export-utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  format,
  getYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

function FinanceiroTab() {
  const { transactions, categories } = useFinanceiro();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }, []);

  const formatCompact = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);
  }, []);

  // Filter transactions for selected year
  const yearTransactions = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);
    return transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return isWithinInterval(date, { start, end });
    });
  }, [transactions, selectedYear]);

  const handleExportPDF = useCallback(() => {
    exportHelpers.exportTransactions(yearTransactions as unknown as Record<string, unknown>[], 'pdf');
  }, [yearTransactions]);

  const handleExportExcel = useCallback(() => {
    exportHelpers.exportTransactions(yearTransactions as unknown as Record<string, unknown>[], 'excel');
  }, [yearTransactions]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(t => years.add(getYear(new Date(t.data_vencimento))));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Year summary
  const yearSummary = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);

    const filtered = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return isWithinInterval(date, { start, end });
    });

    const receitas = filtered.filter(t => t.tipo === 'receita' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
    const despesas = filtered.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
    const pendentesReceita = filtered.filter(t => t.tipo === 'receita' && t.status === 'pendente').reduce((s, t) => s + t.valor, 0);
    const pendentesDespesa = filtered.filter(t => t.tipo === 'despesa' && t.status === 'pendente').reduce((s, t) => s + t.valor, 0);

    return { receitas, despesas, saldo: receitas - despesas, pendentesReceita, pendentesDespesa };
  }, [transactions, selectedYear]);

  // Monthly evolution
  const monthlyEvolution = useMemo(() => {
    const months = eachMonthOfInterval({
      start: new Date(selectedYear, 0, 1),
      end: new Date(selectedYear, 11, 31)
    });

    let accumulated = 0;
    return months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const filtered = transactions.filter(t => {
        const date = new Date(t.data_vencimento);
        return isWithinInterval(date, { start, end });
      });

      const receitas = filtered.filter(t => t.tipo === 'receita' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
      const despesas = filtered.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((s, t) => s + t.valor, 0);
      const saldo = receitas - despesas;
      accumulated += saldo;

      return { mes: format(month, 'MMM', { locale: ptBR }), receitas, despesas, saldo, acumulado: accumulated };
    });
  }, [transactions, selectedYear]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);

    const filtered = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return t.tipo === 'despesa' && t.status === 'pago' && isWithinInterval(date, { start, end });
    });

    const byCategory: Record<string, { nome: string; valor: number; cor: string }> = {};
    filtered.forEach(t => {
      const category = categories.find(c => c.id === t.category_id);
      const nome = category?.nome || 'Sem categoria';
      const cor = category?.cor || '#888888';
      if (!byCategory[nome]) byCategory[nome] = { nome, valor: 0, cor };
      byCategory[nome].valor += t.valor;
    });

    return Object.values(byCategory).sort((a, b) => b.valor - a.valor).slice(0, 8);
  }, [transactions, categories, selectedYear]);

  // Revenue by category
  const revenueByCategory = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);

    const filtered = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return t.tipo === 'receita' && t.status === 'pago' && isWithinInterval(date, { start, end });
    });

    const byCategory: Record<string, { nome: string; valor: number; cor: string }> = {};
    filtered.forEach(t => {
      const category = categories.find(c => c.id === t.category_id);
      const nome = category?.nome || 'Sem categoria';
      const cor = category?.cor || '#888888';
      if (!byCategory[nome]) byCategory[nome] = { nome, valor: 0, cor };
      byCategory[nome].valor += t.valor;
    });

    return Object.values(byCategory).sort((a, b) => b.valor - a.valor).slice(0, 8);
  }, [transactions, categories, selectedYear]);

  return (
    <div className="space-y-6" role="region" aria-label="Relatório Financeiro">
      {/* Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]" aria-label="Selecionar ano">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ExportDropdown
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          disabled={yearTransactions.length === 0}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(yearSummary.receitas)}</p>
                <p className="text-xs text-muted-foreground">A receber: {formatCurrency(yearSummary.pendentesReceita)}</p>
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
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(yearSummary.despesas)}</p>
                <p className="text-xs text-muted-foreground">A pagar: {formatCurrency(yearSummary.pendentesDespesa)}</p>
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
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${yearSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(yearSummary.saldo)}
                </p>
                <p className="text-xs text-muted-foreground">{selectedYear}</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${yearSummary.saldo >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-destructive/10'}`}>
                <DollarSign className={`h-6 w-6 ${yearSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem</p>
                <p className={`text-2xl font-bold ${yearSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {yearSummary.receitas > 0 ? `${((yearSummary.saldo / yearSummary.receitas) * 100).toFixed(1)}%` : '0%'}
                </p>
                <p className="text-xs text-muted-foreground">Lucro sobre receita</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <PieChartIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
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
            Saldo Acumulado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Saldo Acumulado" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <PieChart>
                      <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor">
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {expensesByCategory.map((cat, index) => (
                    <div key={cat.nome} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor || COLORS[index % COLORS.length] }} />
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
                    <PieChart>
                      <Pie data={revenueByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="valor">
                        {revenueByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {revenueByCategory.map((cat, index) => (
                    <div key={cat.nome} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor || COLORS[index % COLORS.length] }} />
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
    </div>
  );
}

export { FinanceiroTab };
