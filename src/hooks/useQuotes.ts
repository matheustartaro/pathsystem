import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_type: 'servico' | 'produto';
  service_id?: string | null;
  product_id?: string | null;
  nome: string;
  descricao?: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
}

export interface Quote {
  id: string;
  numero: string;
  client_id?: string | null;
  titulo: string;
  descricao?: string | null;
  validade: Date;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'expirado';
  valor_total: number;
  desconto_total: number;
  observacoes?: string | null;
  termos_condicoes?: string | null;
  converted_project_id?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
  items?: QuoteItem[];
  client?: { nome: string } | null;
}

async function fetchQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      client:responsaveis!quotes_client_id_fkey(nome),
      items:quote_items(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(q => ({
    ...q,
    status: q.status as Quote['status'],
    validade: new Date(q.validade),
    created_at: new Date(q.created_at),
    updated_at: new Date(q.updated_at),
    items: q.items?.map((i: any) => ({ ...i, item_type: i.item_type as QuoteItem['item_type'] })),
  })) as Quote[];
}

async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count, error } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`);

  if (error) throw error;

  const nextNumber = (count || 0) + 1;
  return `ORC-${year}-${String(nextNumber).padStart(4, '0')}`;
}

async function createQuote(quote: Omit<Quote, 'id' | 'numero' | 'created_at' | 'updated_at' | 'items' | 'client'>): Promise<Quote> {
  const numero = await generateQuoteNumber();

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      numero,
      client_id: quote.client_id,
      titulo: quote.titulo,
      descricao: quote.descricao,
      validade: quote.validade instanceof Date 
        ? quote.validade.toISOString().split('T')[0]
        : quote.validade,
      status: quote.status,
      valor_total: quote.valor_total || 0,
      desconto_total: quote.desconto_total || 0,
      observacoes: quote.observacoes,
      termos_condicoes: quote.termos_condicoes,
      created_by: quote.created_by,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    status: data.status as Quote['status'],
    validade: new Date(data.validade),
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
}

async function updateQuote(id: string, updates: Partial<Quote>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.client_id !== undefined) dbUpdates.client_id = updates.client_id;
  if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
  if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
  if (updates.validade !== undefined) {
    dbUpdates.validade = updates.validade instanceof Date 
      ? updates.validade.toISOString().split('T')[0]
      : updates.validade;
  }
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.valor_total !== undefined) dbUpdates.valor_total = updates.valor_total;
  if (updates.desconto_total !== undefined) dbUpdates.desconto_total = updates.desconto_total;
  if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;
  if (updates.termos_condicoes !== undefined) dbUpdates.termos_condicoes = updates.termos_condicoes;
  if (updates.converted_project_id !== undefined) dbUpdates.converted_project_id = updates.converted_project_id;

  const { error } = await supabase
    .from('quotes')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
}

async function deleteQuote(id: string): Promise<void> {
  // Delete items first
  await supabase.from('quote_items').delete().eq('quote_id', id);
  
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function addQuoteItem(item: Omit<QuoteItem, 'id'>): Promise<QuoteItem> {
  const { data, error } = await supabase
    .from('quote_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return { ...data, item_type: data.item_type as QuoteItem['item_type'] };
}

async function updateQuoteItem(id: string, updates: Partial<QuoteItem>): Promise<void> {
  const { error } = await supabase
    .from('quote_items')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

async function deleteQuoteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('quote_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useQuotes() {
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading, refetch } = useQuery({
    queryKey: ['quotes'],
    queryFn: fetchQuotes,
  });

  const createMutation = useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Orçamento criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar orçamento: ' + (error as Error).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Quote> }) => 
      updateQuote(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Orçamento atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar orçamento: ' + (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Orçamento excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir orçamento: ' + (error as Error).message);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: addQuoteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<QuoteItem> }) =>
      updateQuoteItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteQuoteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });

  // Convert quote to project
  const convertToProject = async (quoteId: string): Promise<string> => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) throw new Error('Orçamento não encontrado');
    if (quote.status !== 'aprovado') throw new Error('Apenas orçamentos aprovados podem ser convertidos');
    if (quote.converted_project_id) throw new Error('Orçamento já foi convertido em projeto');

    // Create project
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        nome: quote.titulo,
        cliente: quote.client?.nome || 'Cliente',
        client_id: quote.client_id,
        descricao: quote.descricao,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        valor: quote.valor_total,
        status: 'pendente',
        progresso: 0,
      })
      .select()
      .single();

    if (projectError) throw projectError;

    // Copy items to order_items
    if (quote.items && quote.items.length > 0) {
      const orderItems = quote.items.map(item => ({
        project_id: project.id,
        item_type: item.item_type === 'servico' ? 'service' : 'product',
        service_id: item.service_id,
        product_id: item.product_id,
        nome: item.nome,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        total: item.total,
        is_manual: !item.service_id && !item.product_id,
      }));

      await supabase.from('order_items').insert(orderItems);
    }

    // Update quote with project reference
    await supabase
      .from('quotes')
      .update({ converted_project_id: project.id })
      .eq('id', quoteId);

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['quotes'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });

    toast.success('Orçamento convertido em projeto!');
    return project.id;
  };

  // Approve quote (for portal)
  const approveQuote = async (quoteId: string): Promise<void> => {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'aprovado' })
      .eq('id', quoteId);

    if (error) throw error;

    // Log activity
    await supabase.from('project_activities').insert({
      project_id: quoteId, // Using quote ID as reference
      tipo: 'aprovacao',
      descricao: 'Orçamento aprovado pelo cliente via portal',
    });

    queryClient.invalidateQueries({ queryKey: ['quotes'] });
    toast.success('Orçamento aprovado!');
  };

  return {
    quotes,
    isLoading,
    refetch,
    createQuote: createMutation.mutateAsync,
    updateQuote: (id: string, updates: Partial<Quote>) => 
      updateMutation.mutateAsync({ id, updates }),
    deleteQuote: deleteMutation.mutateAsync,
    addItem: addItemMutation.mutateAsync,
    updateItem: (id: string, updates: Partial<QuoteItem>) =>
      updateItemMutation.mutateAsync({ id, updates }),
    deleteItem: deleteItemMutation.mutateAsync,
    getQuoteById: (id: string) => quotes.find(q => q.id === id),
    convertToProject,
    approveQuote,
  };
}
