import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Search, Edit2, Trash2, MoreHorizontal, Check, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { TransactionFormDialog } from '@/components/financeiro/TransactionFormDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReceitasPage() {
  const { transactions, isLoading, deleteTransaction, updateTransaction, getStats } = useFinanceiro();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<typeof transactions[0] | null>(null);
  const [search, setSearch] = useState('');

  const receitas = transactions.filter(t => t.tipo === 'receita');
  const stats = getStats();

  const filteredReceitas = receitas.filter(t => 
    t.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (transaction: typeof transactions[0]) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        await deleteTransaction(id);
        toast.success('Receita excluída!');
      } catch {
        toast.error('Erro ao excluir receita');
      }
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await updateTransaction({ id, status: 'pago', data_pagamento: format(new Date(), 'yyyy-MM-dd') });
      toast.success('Receita marcada como paga!');
    } catch {
      toast.error('Erro ao atualizar receita');
    }
  };

  const handleNew = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-[hsl(var(--status-success))]"><Check className="w-3 h-3 mr-1" /> Pago</Badge>;
      case 'pendente':
        return <Badge variant="outline" className="text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'cancelado':
        return <Badge variant="secondary"><X className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
            <p className="text-muted-foreground">Gerencie suas receitas e entradas</p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Receita
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--status-success))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(var(--status-success))]">
                R$ {stats.totalRecebido.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--status-warning))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(var(--status-warning))]">
                R$ {stats.totalAReceber.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Pendente</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(stats.totalRecebido + stats.totalAReceber).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Recebido + Pendente</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar receitas..." 
                  className="pl-10" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filteredReceitas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma receita encontrada</p>
                <p className="text-sm">Clique em "Nova Receita" para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceitas.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <p className="font-medium">{transaction.descricao}</p>
                      </TableCell>
                      <TableCell className="font-medium text-[hsl(var(--status-success))]">
                        R$ {transaction.valor.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {transaction.status === 'pendente' && (
                              <DropdownMenuItem onClick={() => handleMarkPaid(transaction.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Marcar como Pago
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(transaction.id)}
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
        defaultTipo="receita"
      />
    </AppLayout>
  );
}
