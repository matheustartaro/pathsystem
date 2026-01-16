import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockMovement {
  id: string;
  product_id: string;
  project_id: string | null;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string | null;
  created_at: string;
  created_by: string | null;
}

export function useStockMovements(productId?: string) {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['stock_movements', productId],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as StockMovement[];
    },
  });

  const addMovement = useMutation({
    mutationFn: async (movement: { 
      product_id: string; 
      tipo: 'entrada' | 'saida'; 
      quantidade: number; 
      motivo?: string;
      project_id?: string;
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert movement
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          ...movement,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Update product stock
      const { data: product } = await supabase
        .from('products')
        .select('estoque_atual')
        .eq('id', movement.product_id)
        .single();

      if (product) {
        const newStock = movement.tipo === 'entrada' 
          ? product.estoque_atual + movement.quantidade
          : Math.max(0, product.estoque_atual - movement.quantidade);
        
        await supabase
          .from('products')
          .update({ estoque_atual: newStock })
          .eq('id', movement.product_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Process automatic stock deduction for a project
  const processProjectStock = async (projectId: string) => {
    // Get order items for the project
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantidade')
      .eq('project_id', projectId)
      .not('product_id', 'is', null);

    if (!orderItems?.length) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Create stock movements for each product
    for (const item of orderItems) {
      if (!item.product_id) continue;

      await supabase.from('stock_movements').insert({
        product_id: item.product_id,
        project_id: projectId,
        tipo: 'saida',
        quantidade: item.quantidade,
        motivo: 'Baixa automática - Pedido concluído',
        created_by: user?.id,
      });

      // Update product stock
      const { data: product } = await supabase
        .from('products')
        .select('estoque_atual')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const newStock = Math.max(0, product.estoque_atual - item.quantidade);
        await supabase
          .from('products')
          .update({ estoque_atual: newStock })
          .eq('id', item.product_id);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return {
    movements,
    isLoading,
    addMovement: addMovement.mutateAsync,
    processProjectStock,
  };
}
