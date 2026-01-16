import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, RefreshCw } from 'lucide-react';
import { useFinanceiro, Transaction } from '@/hooks/useFinanceiro';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  defaultTipo?: 'receita' | 'despesa';
  defaultProjectId?: string;
  onSuccess?: () => void;
}

export function TransactionFormDialog({ 
  open, 
  onOpenChange, 
  transaction, 
  defaultTipo = 'receita',
  defaultProjectId,
  onSuccess 
}: TransactionFormDialogProps) {
  const { addTransaction, updateTransaction, generateRecurringTransactions, categories, accounts } = useFinanceiro();
  const { projects } = useProjects();
  const { responsaveis } = useResponsaveis();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    tipo: defaultTipo as 'receita' | 'despesa',
    descricao: '',
    valor: 0,
    data_vencimento: format(new Date(), 'yyyy-MM-dd'),
    data_pagamento: '',
    status: 'pendente' as 'pendente' | 'pago' | 'cancelado',
    category_id: '',
    account_id: '',
    project_id: '',
    client_id: '',
    observacoes: '',
    recorrente: false,
    frequencia: '' as '' | 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual',
    dia_vencimento: '',
    recorrencia_fim: '',
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        tipo: transaction.tipo,
        descricao: transaction.descricao,
        valor: transaction.valor,
        data_vencimento: transaction.data_vencimento,
        data_pagamento: transaction.data_pagamento || '',
        status: transaction.status,
        category_id: transaction.category_id || '',
        account_id: transaction.account_id || '',
        project_id: transaction.project_id || '',
        client_id: transaction.client_id || '',
        observacoes: transaction.observacoes || '',
        recorrente: transaction.recorrente || false,
        frequencia: transaction.frequencia || '',
        dia_vencimento: transaction.dia_vencimento?.toString() || '',
        recorrencia_fim: transaction.recorrencia_fim || '',
      });
    } else {
      setFormData({
        tipo: defaultTipo,
        descricao: '',
        valor: 0,
        data_vencimento: format(new Date(), 'yyyy-MM-dd'),
        data_pagamento: '',
        status: 'pendente',
        category_id: '',
        account_id: '',
        project_id: defaultProjectId || '',
        client_id: '',
        observacoes: '',
        recorrente: false,
        frequencia: '',
        dia_vencimento: '',
        recorrencia_fim: '',
      });
    }
  }, [transaction, open, defaultTipo, defaultProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    if (formData.valor <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    if (formData.recorrente && !formData.frequencia) {
      toast.error('Selecione a frequência para transações recorrentes');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: formData.valor,
        data_vencimento: formData.data_vencimento,
        data_pagamento: formData.data_pagamento || null,
        status: formData.status,
        category_id: formData.category_id || null,
        account_id: formData.account_id || null,
        project_id: formData.project_id || null,
        client_id: formData.client_id || null,
        observacoes: formData.observacoes || null,
        recorrente: formData.recorrente,
        frequencia: formData.recorrente ? formData.frequencia || null : null,
        dia_vencimento: formData.recorrente && formData.dia_vencimento 
          ? parseInt(formData.dia_vencimento) 
          : null,
        recorrencia_fim: formData.recorrente && formData.recorrencia_fim 
          ? formData.recorrencia_fim 
          : null,
        recorrencia_parent_id: null,
      };

      if (transaction) {
        await updateTransaction({ id: transaction.id, ...data });
        toast.success('Transação atualizada!');
      } else {
        const newTransaction = await addTransaction(data);
        
        // Se for recorrente, gerar próximas parcelas
        if (formData.recorrente && formData.frequencia) {
          await generateRecurringTransactions(newTransaction as Transaction, 12);
          toast.success(`${formData.tipo === 'receita' ? 'Receita' : 'Despesa'} recorrente criada com as próximas parcelas!`);
        } else {
          toast.success(`${formData.tipo === 'receita' ? 'Receita' : 'Despesa'} criada!`);
        }
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao salvar transação');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.tipo === formData.tipo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar' : 'Nova'} {formData.tipo === 'receita' ? 'Receita' : 'Despesa'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(v: 'receita' | 'despesa') => setFormData(prev => ({ ...prev, tipo: v, category_id: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v: 'pendente' | 'pago' | 'cancelado') => setFormData(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição da transação"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data Vencimento</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data Pagamento</Label>
              <Input
                id="data_pagamento"
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_pagamento: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">Conta</Label>
              <Select value={formData.account_id} onValueChange={(v) => setFormData(prev => ({ ...prev, account_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Projeto</Label>
              <Select value={formData.project_id} onValueChange={(v) => setFormData(prev => ({ ...prev, project_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={formData.client_id} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.filter(r => r.tipo === 'cliente').map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção de Recorrência */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <Label htmlFor="recorrente" className="font-medium">Transação Recorrente</Label>
              </div>
              <Switch
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  recorrente: checked,
                  frequencia: checked ? 'mensal' : '',
                }))}
              />
            </div>

            {formData.recorrente && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Select 
                    value={formData.frequencia} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, frequencia: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dia_vencimento">Dia do Vencimento</Label>
                  <Input
                    id="dia_vencimento"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dia_vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, dia_vencimento: e.target.value }))}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recorrencia_fim">Data Fim (opcional)</Label>
                  <Input
                    id="recorrencia_fim"
                    type="date"
                    value={formData.recorrencia_fim}
                    onChange={(e) => setFormData(prev => ({ ...prev, recorrencia_fim: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}