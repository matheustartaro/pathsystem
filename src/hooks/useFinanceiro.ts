import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, addWeeks, addDays, setDate, isBefore, isAfter } from 'date-fns';

export interface Transaction {
  id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: 'pendente' | 'pago' | 'cancelado';
  category_id: string | null;
  account_id: string | null;
  project_id: string | null;
  client_id: string | null;
  observacoes: string | null;
  recorrente: boolean | null;
  frequencia: 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | null;
  dia_vencimento: number | null;
  recorrencia_fim: string | null;
  recorrencia_parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  created_at: string;
}

export interface Account {
  id: string;
  nome: string;
  tipo: 'banco' | 'caixa' | 'cartao';
  saldo_inicial: number;
  saldo_atual: number;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  ativo: boolean;
  created_at: string;
}

export function useFinanceiro() {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['financial_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as FinancialCategory[];
    },
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Account[];
    },
  });

  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      if (error) throw error;

      // Update account balance if transaction is already paid and has account_id
      if (data.account_id && data.status === 'pago') {
        const { data: account } = await supabase
          .from('accounts')
          .select('saldo_atual')
          .eq('id', data.account_id)
          .single();

        if (account) {
          const balanceChange = data.tipo === 'receita' ? data.valor : -data.valor;
          await supabase
            .from('accounts')
            .update({ saldo_atual: account.saldo_atual + balanceChange })
            .eq('id', data.account_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      // Get the current transaction first to calculate balance change
      const { data: currentTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Update account balance if status changed to 'pago' and has account_id
      if (data.account_id && updates.status === 'pago' && currentTransaction?.status !== 'pago') {
        const { data: account } = await supabase
          .from('accounts')
          .select('saldo_atual')
          .eq('id', data.account_id)
          .single();

        if (account) {
          const balanceChange = data.tipo === 'receita' ? data.valor : -data.valor;
          await supabase
            .from('accounts')
            .update({ saldo_atual: account.saldo_atual + balanceChange })
            .eq('id', data.account_id);
        }
      }

      // If status changed from 'pago' to something else, reverse the balance
      if (data.account_id && currentTransaction?.status === 'pago' && updates.status && updates.status !== 'pago') {
        const { data: account } = await supabase
          .from('accounts')
          .select('saldo_atual')
          .eq('id', data.account_id)
          .single();

        if (account) {
          const balanceChange = data.tipo === 'receita' ? -data.valor : data.valor;
          await supabase
            .from('accounts')
            .update({ saldo_atual: account.saldo_atual + balanceChange })
            .eq('id', data.account_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const addCategory = useMutation({
    mutationFn: async (category: Omit<FinancialCategory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_categories'] });
    },
  });

  const addAccount = useMutation({
    mutationFn: async (account: Omit<Account, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  // Gerar próximas ocorrências de transação recorrente
  const generateRecurringTransactions = async (parentTransaction: Transaction, count: number = 12) => {
    if (!parentTransaction.recorrente || !parentTransaction.frequencia) return [];

    const newTransactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[] = [];
    let currentDate = new Date(parentTransaction.data_vencimento);
    const endDate = parentTransaction.recorrencia_fim ? new Date(parentTransaction.recorrencia_fim) : null;

    for (let i = 0; i < count; i++) {
      // Calcular próxima data
      switch (parentTransaction.frequencia) {
        case 'semanal':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'quinzenal':
          currentDate = addDays(currentDate, 15);
          break;
        case 'mensal':
          currentDate = addMonths(currentDate, 1);
          if (parentTransaction.dia_vencimento) {
            currentDate = setDate(currentDate, Math.min(parentTransaction.dia_vencimento, 28));
          }
          break;
        case 'bimestral':
          currentDate = addMonths(currentDate, 2);
          break;
        case 'trimestral':
          currentDate = addMonths(currentDate, 3);
          break;
        case 'semestral':
          currentDate = addMonths(currentDate, 6);
          break;
        case 'anual':
          currentDate = addMonths(currentDate, 12);
          break;
      }

      // Verificar se passou da data fim
      if (endDate && isAfter(currentDate, endDate)) break;

      newTransactions.push({
        tipo: parentTransaction.tipo,
        descricao: parentTransaction.descricao,
        valor: parentTransaction.valor,
        data_vencimento: currentDate.toISOString().split('T')[0],
        data_pagamento: null,
        status: 'pendente',
        category_id: parentTransaction.category_id,
        account_id: parentTransaction.account_id,
        project_id: parentTransaction.project_id,
        client_id: parentTransaction.client_id,
        observacoes: parentTransaction.observacoes,
        recorrente: false,
        frequencia: null,
        dia_vencimento: null,
        recorrencia_fim: null,
        recorrencia_parent_id: parentTransaction.id,
      });
    }

    // Inserir todas as transações geradas
    if (newTransactions.length > 0) {
      const { error } = await supabase.from('transactions').insert(newTransactions);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }

    return newTransactions;
  };

  // Cálculos
  const getStats = (month?: Date) => {
    const now = month || new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return date >= startOfMonth && date <= endOfMonth;
    });

    const receitas = monthTransactions.filter(t => t.tipo === 'receita');
    const despesas = monthTransactions.filter(t => t.tipo === 'despesa');

    const totalRecebido = receitas.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.valor, 0);
    const totalAReceber = receitas.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.valor, 0);
    const totalPago = despesas.filter(t => t.status === 'pago').reduce((sum, t) => sum + t.valor, 0);
    const totalAPagar = despesas.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.valor, 0);

    const vencidas = transactions.filter(t => {
      const date = new Date(t.data_vencimento);
      return t.status === 'pendente' && date < new Date();
    });

    const saldoTotal = accounts.reduce((sum, a) => sum + a.saldo_atual, 0);

    return {
      totalRecebido,
      totalAReceber,
      totalPago,
      totalAPagar,
      vencidas: vencidas.reduce((sum, t) => sum + t.valor, 0),
      vendidasCount: vencidas.length,
      balancoMes: totalRecebido - totalPago,
      saldoTotal,
    };
  };

  return {
    transactions,
    categories,
    accounts,
    isLoading: loadingTransactions || loadingCategories || loadingAccounts,
    addTransaction: addTransaction.mutateAsync,
    updateTransaction: updateTransaction.mutateAsync,
    deleteTransaction: deleteTransaction.mutateAsync,
    addCategory: addCategory.mutateAsync,
    addAccount: addAccount.mutateAsync,
    updateAccount: updateAccount.mutateAsync,
    deleteAccount: deleteAccount.mutateAsync,
    generateRecurringTransactions,
    getStats,
    receitaCategories: categories.filter(c => c.tipo === 'receita'),
    despesaCategories: categories.filter(c => c.tipo === 'despesa'),
  };
}