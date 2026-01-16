import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  id: string;
  project_id: string;
  product_id: string | null;
  service_id: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
  created_at: string;
  updated_at: string;
  // New fields
  parent_service_id: string | null;
  item_type: 'product' | 'service' | 'foam';
  is_manual: boolean;
  nome: string | null;
  largura: number | null;
  comprimento: number | null;
  altura: number | null;
  metro_cubico: number | null;
  preco_m3: number | null;
}

export function useOrderItems(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: orderItems = [], isLoading } = useQuery({
    queryKey: ['order_items', projectId],
    queryFn: async () => {
      let query = supabase
        .from('order_items')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as OrderItem[];
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('order_items')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order_items'] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OrderItem> & { id: string }) => {
      const { error } = await supabase
        .from('order_items')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order_items'] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order_items'] });
    },
  });

  const deleteByProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('project_id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order_items'] });
    },
  });

  return {
    orderItems,
    isLoading,
    addItem: (item: Omit<OrderItem, 'id' | 'created_at' | 'updated_at'>) => addItemMutation.mutateAsync(item),
    updateItem: (id: string, updates: Partial<OrderItem>) => updateItemMutation.mutateAsync({ id, ...updates }),
    deleteItem: (id: string) => deleteItemMutation.mutateAsync(id),
    deleteByProject: (projectId: string) => deleteByProjectMutation.mutateAsync(projectId),
  };
}
