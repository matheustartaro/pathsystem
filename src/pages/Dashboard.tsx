import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Plus,
  DollarSign,
  UserPlus,
  FolderPlus,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { StatCard } from '@/components/dashboard';
import { useProjects } from '@/hooks/useProjects';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { useProducts } from '@/hooks/useProducts';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useStatusCategories } from '@/hooks/useStatusCategories';
import { ProjectFormDialog } from '@/components/projects';
import { TransactionFormDialog } from '@/components/financeiro/TransactionFormDialog';
import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatNumber } from '@/lib/utils';

type PeriodFilter = 'month' | 'quarter' | 'year' | 'custom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, getStats, isLoading, addProject } = useProjects();
  const { transactions } = useFinanceiro();
  const { products } = useProducts();
  const { responsaveis } = useResponsaveis();
  const { categories } = useStatusCategories();
  const stats = getStats();

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'receita' | 'despesa'>('receita');

  // Generate months list
  const months = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 5; i >= -6; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return result;
  }, []);

  // Get date range based on period filter
  const getDateRange = () => {
    const now = new Date();
    switch (periodFilter) {
      case 'month':
        const [year, month] = selectedMonth.split('-').map(Number);
        const monthStart = new Date(year, month - 1, 1);
        return { start: startOfMonth(monthStart), end: endOfMonth(monthStart) };
      case 'quarter':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { start: new Date(customStartDate), end: new Date(customEndDate) };
        }
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
      default:
        return { start: startOfYear(now), end: endOfMonth(now) };
    }
  };

  // Financial summary with period filter
  const financialSummary = useMemo(() => {
    const { start: startDate, end: endDate } = getDateRange();

    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    const receitas = filteredTransactions
      .filter(t => t.tipo === 'receita' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    const despesas = filteredTransactions
      .filter(t => t.tipo === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    return { receitas, despesas, saldo: receitas - despesas };
  }, [transactions, periodFilter, selectedMonth, customStartDate, customEndDate]);

  // Recent projects (last 5)
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [projects]);

  const handleSaveProject = (data: Partial<Project>) => {
    addProject(data as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);
  };

  const handleOpenTransaction = (type: 'receita' | 'despesa') => {
    setTransactionType(type);
    setTransactionDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="h-8 w-40 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-5">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const periodLabel = periodFilter === 'month' ? 'do Mês' : periodFilter === 'quarter' ? 'do Trimestre' : periodFilter === 'custom' ? 'Período' : 'do Ano';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês Específico</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {periodFilter === 'month' && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
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
                      ? `${format(new Date(customStartDate), 'dd/MM/yy')} - ${format(new Date(customEndDate), 'dd/MM/yy')}`
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

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setProjectDialogOpen(true)} className="gap-2">
                <FolderPlus className="h-4 w-4" />
                Novo Projeto
              </Button>
              <Button variant="outline" onClick={() => navigate('/clientes/novo')} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Cliente
              </Button>
              <Button variant="outline" onClick={() => handleOpenTransaction('receita')} className="gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950">
                <Plus className="h-4 w-4" />
                Nova Receita
              </Button>
              <Button variant="outline" onClick={() => handleOpenTransaction('despesa')} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Plus className="h-4 w-4" />
                Nova Despesa
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Projetos Ativos"
            value={stats.emAndamento}
            icon={<FolderKanban className="w-6 h-6" />}
          />
          <StatCard
            title={`Receitas ${periodLabel}`}
            value={formatCurrency(financialSummary.receitas)}
            icon={<TrendingUp className="w-6 h-6 text-green-500" />}
          />
          <StatCard
            title={`Despesas ${periodLabel}`}
            value={formatCurrency(financialSummary.despesas)}
            icon={<TrendingDown className="w-6 h-6 text-destructive" />}
          />
          <StatCard
            title={`Saldo ${periodLabel}`}
            value={formatCurrency(financialSummary.saldo)}
            icon={<DollarSign className={`w-6 h-6 ${financialSummary.saldo >= 0 ? 'text-green-500' : 'text-destructive'}`} />}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Projetos Recentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projetos')} className="gap-1 text-muted-foreground">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.map((project) => {
                    const statusCategory = categories.find(c => c.key === project.status);
                    return (
                      <div 
                        key={project.id} 
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/projetos/${project.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-2 h-10 rounded-full" 
                            style={{ backgroundColor: statusCategory?.color || '#888' }}
                          />
                          <div>
                            <p className="font-medium text-sm">{project.nome}</p>
                            <p className="text-xs text-muted-foreground">{project.cliente}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(project.valor || 0)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(project.dataFim), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum projeto cadastrado</p>
                  <Button 
                    variant="link" 
                    onClick={() => setProjectDialogOpen(true)}
                    className="mt-2"
                  >
                    Criar primeiro projeto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10">
                  <span className="text-sm text-muted-foreground">Receitas</span>
                  <span className="font-semibold text-green-600">{formatCurrency(financialSummary.receitas)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10">
                  <span className="text-sm text-muted-foreground">Despesas</span>
                  <span className="font-semibold text-destructive">{formatCurrency(financialSummary.despesas)}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg ${
                  financialSummary.saldo >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'
                }`}>
                  <span className="text-sm text-muted-foreground">Saldo</span>
                  <span className={`font-semibold ${financialSummary.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(financialSummary.saldo)}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2" 
                  onClick={() => navigate('/financeiro/fluxo-caixa')}
                >
                  Ver Fluxo de Caixa
                </Button>
              </CardContent>
            </Card>

            {/* Products Low Stock Alert */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estoque Baixo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {products.filter(p => p.estoque_atual <= p.estoque_minimo && p.ativo).length > 0 ? (
                  products
                    .filter(p => p.estoque_atual <= p.estoque_minimo && p.ativo)
                    .slice(0, 5)
                    .map(product => (
                      <div key={product.id} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground truncate max-w-[140px]">{product.nome}</span>
                        <span className={`font-semibold ${product.estoque_atual === 0 ? 'text-destructive' : 'text-yellow-600'}`}>
                          {formatNumber(product.estoque_atual, product.estoque_atual % 1 === 0 ? 0 : 2)} {product.unidade || 'un'}
                        </span>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum produto com estoque baixo</p>
                  </div>
                )}
                {products.filter(p => p.estoque_atual <= p.estoque_minimo && p.ativo).length > 5 && (
                  <Button variant="link" size="sm" className="w-full" onClick={() => navigate('/catalogo/estoque')}>
                    Ver todos ({products.filter(p => p.estoque_atual <= p.estoque_minimo && p.ativo).length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProjectFormDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={null}
        onSave={handleSaveProject}
      />

      <TransactionFormDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        transaction={null}
        defaultTipo={transactionType}
        onSuccess={() => setTransactionDialogOpen(false)}
      />
    </AppLayout>
  );
};

export default Dashboard;
