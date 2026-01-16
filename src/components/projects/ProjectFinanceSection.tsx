import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, TrendingDown, Plus, Check, Clock, AlertTriangle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFinanceiro, Transaction } from '@/hooks/useFinanceiro';
import { useOrderItems } from '@/hooks/useOrderItems';
import { TransactionFormDialog } from '@/components/financeiro/TransactionFormDialog';
import { TransactionReceiptDialog } from './TransactionReceiptDialog';
import { cn, formatCurrency } from '@/lib/utils';

interface ProjectFinanceSectionProps {
  projectId: string;
}

export function ProjectFinanceSection({ projectId }: ProjectFinanceSectionProps) {
  const { transactions, updateTransaction } = useFinanceiro();
  const { orderItems } = useOrderItems(projectId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'receita' | 'despesa'>('receita');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);

  const projectTransactions = useMemo(() => {
    return transactions.filter(t => t.project_id === projectId);
  }, [transactions, projectId]);

  const stats = useMemo(() => {
    const valorTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const receitas = projectTransactions.filter(t => t.tipo === 'receita');
    const despesas = projectTransactions.filter(t => t.tipo === 'despesa');
    
    const recebido = receitas.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.valor, 0);
    const aReceber = receitas.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.valor, 0);
    const pago = despesas.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.valor, 0);
    const aPagar = despesas.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.valor, 0);
    
    return {
      valorTotal,
      recebido,
      aReceber,
      pago,
      aPagar,
      saldoAberto: valorTotal - recebido,
      lucroAtual: recebido - pago,
    };
  }, [orderItems, projectTransactions]);

  const handleOpenDialog = (type: 'receita' | 'despesa') => {
    setDialogType(type);
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setDialogType(transaction.tipo);
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleMarkAsPaid = async (transaction: Transaction) => {
    await updateTransaction({
      id: transaction.id,
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0],
    });
  };

  const handleOpenReceipt = (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setReceiptTransaction(transaction);
    setReceiptDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Financeiro do Projeto
        </h4>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Valor do Pedido</div>
            <div className="text-lg font-bold">{formatCurrency(stats.valorTotal)}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Saldo em Aberto</div>
            <div className={cn(
              "text-lg font-bold",
              stats.saldoAberto > 0 ? "text-[hsl(var(--status-warning))]" : "text-[hsl(var(--status-success))]"
            )}>
              {formatCurrency(stats.saldoAberto)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-[hsl(var(--status-success))]" />
              Recebido
            </div>
            <div className="text-sm font-semibold text-[hsl(var(--status-success))]">
              {formatCurrency(stats.recebido)}
            </div>
            {stats.aReceber > 0 && (
              <div className="text-xs text-muted-foreground">
                + {formatCurrency(stats.aReceber)} a receber
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 text-destructive" />
              Despesas
            </div>
            <div className="text-sm font-semibold text-destructive">
              {formatCurrency(stats.pago)}
            </div>
            {stats.aPagar > 0 && (
              <div className="text-xs text-muted-foreground">
                + {formatCurrency(stats.aPagar)} a pagar
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => handleOpenDialog('receita')}
        >
          <Plus className="w-3 h-3" />
          Recebimento
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1"
          onClick={() => handleOpenDialog('despesa')}
        >
          <Plus className="w-3 h-3" />
          Despesa
        </Button>
      </div>

      {/* Transactions List */}
      {projectTransactions.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {projectTransactions.map((transaction) => {
            const isOverdue = transaction.status === 'pendente' && 
              new Date(transaction.data_vencimento) < new Date();
            
            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => handleEditTransaction(transaction)}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  transaction.tipo === 'receita' ? 'bg-[hsl(var(--status-success))]' : 'bg-destructive'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{transaction.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    transaction.tipo === 'receita' ? 'text-[hsl(var(--status-success))]' : 'text-destructive'
                  )}>
                    {transaction.tipo === 'receita' ? '+' : '-'}{formatCurrency(transaction.valor)}
                  </span>
                  {transaction.status === 'pago' ? (
                    <Badge variant="outline" className="text-xs gap-1 bg-[hsl(var(--status-success))]/10">
                      <Check className="w-3 h-3" />
                      Pago
                    </Badge>
                  ) : isOverdue ? (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Vencido
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsPaid(transaction);
                      }}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Pagar
                    </Button>
                  )}
                  {/* Receipt button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleOpenReceipt(transaction, e)}
                    title="Emitir Recibo"
                  >
                    <Printer className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {projectTransactions.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          Nenhuma transação registrada
        </div>
      )}

      {/* Transaction Form Dialog */}
      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultTipo={dialogType}
        transaction={editingTransaction}
        defaultProjectId={projectId}
        onSuccess={() => setDialogOpen(false)}
      />

      {/* Receipt Dialog */}
      <TransactionReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        transaction={receiptTransaction}
      />
    </div>
  );
}
