import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  RefreshCw,
  Check
} from 'lucide-react';
import { useFinanceiro, Transaction } from '@/hooks/useFinanceiro';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionFormDialog } from '@/components/financeiro/TransactionFormDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function FluxoCaixaPage() {
  const { transactions, accounts, isLoading, deleteTransaction, updateTransaction } = useFinanceiro();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'pago' | 'cancelado'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultTipo, setDefaultTipo] = useState<'receita' | 'despesa'>('receita');

  const monthlyData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    let filtered = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    // Aplicar filtros
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(t => t.tipo === tipoFilter);
    }
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    const allMonthTransactions = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });

    const receitas = allMonthTransactions
      .filter(t => t.tipo === 'receita' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    const despesas = allMonthTransactions
      .filter(t => t.tipo === 'despesa' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    return {
      transactions: filtered.sort((a, b) => 
        new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime()
      ),
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  }, [transactions, selectedMonth, tipoFilter, statusFilter]);

  const saldoTotal = accounts.reduce((sum, a) => sum + a.saldo_atual, 0);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleNewReceita = () => {
    setEditingTransaction(null);
    setDefaultTipo('receita');
    setDialogOpen(true);
  };

  const handleNewDespesa = () => {
    setEditingTransaction(null);
    setDefaultTipo('despesa');
    setDialogOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDefaultTipo(transaction.tipo);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteTransaction(id);
        toast.success('Transação excluída!');
      } catch {
        toast.error('Erro ao excluir transação');
      }
    }
  };

  const handleMarkAsPaid = async (transaction: Transaction) => {
    try {
      await updateTransaction({
        id: transaction.id,
        status: 'pago',
        data_pagamento: format(new Date(), 'yyyy-MM-dd'),
      });
      toast.success('Transação marcada como paga!');
    } catch {
      toast.error('Erro ao atualizar transação');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
              <p className="text-muted-foreground">Gerencie receitas e despesas do seu negócio</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleNewReceita} className="bg-[hsl(var(--status-success))] hover:bg-[hsl(var(--status-success))]/90">
                <TrendingUp className="w-4 h-4 mr-2" />
                Nova Receita
              </Button>
              <Button onClick={handleNewDespesa} variant="destructive">
                <TrendingDown className="w-4 h-4 mr-2" />
                Nova Despesa
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
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
            <Select value={tipoFilter} onValueChange={(v: any) => setTipoFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(saldoTotal)}</div>
              <p className="text-xs text-muted-foreground">Em todas as contas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--status-success))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(var(--status-success))]">{formatCurrency(monthlyData.receitas)}</div>
              <p className="text-xs text-muted-foreground">Recebido no mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(monthlyData.despesas)}</div>
              <p className="text-xs text-muted-foreground">Pago no mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balanço</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${monthlyData.saldo >= 0 ? 'text-[hsl(var(--status-success))]' : 'text-destructive'}`}>
                {formatCurrency(monthlyData.saldo)}
              </div>
              <p className="text-xs text-muted-foreground">Entradas - Saídas</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Movimentações</CardTitle>
              <span className="text-sm text-muted-foreground">
                {monthlyData.transactions.length} transação(ões)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : monthlyData.transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma movimentação encontrada</p>
                <p className="text-sm">Use os botões acima para criar receitas ou despesas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {format(new Date(t.data_vencimento), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t.descricao}</span>
                          {t.recorrente && (
                            <RefreshCw className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={t.tipo === 'receita' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}>
                          {t.tipo === 'receita' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          t.status === 'pago' 
                            ? 'outline' 
                            : t.status === 'cancelado' 
                              ? 'secondary' 
                              : 'secondary'
                        }>
                          {t.status === 'pago' ? 'Pago' : t.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        t.tipo === 'receita' ? 'text-[hsl(var(--status-success))]' : 'text-destructive'
                      }`}>
                        {t.tipo === 'receita' ? '+' : '-'}{formatCurrency(t.valor)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {t.status === 'pendente' && (
                              <>
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(t)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Marcar como Pago
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(t)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(t.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTransaction}
        defaultTipo={defaultTipo}
      />
    </AppLayout>
  );
}