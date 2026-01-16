import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  nome: string;
  descricao: string | null;
  custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade: string | null;
  category_id: string | null;
  supplier_id: string | null;
  ativo: boolean;
  markup: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  nome: string;
  tipo: 'produto' | 'servico';
  created_at: string;
}

export interface Supplier {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_at: string;
}

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['product_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as ProductCategory[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      if (error) throw error;
      const settingsMap: Record<string, number> = {};
      data?.forEach(s => {
        settingsMap[s.key] = Number(s.value);
      });
      return settingsMap;
    },
  });

  const markup = settings?.markup_padrao || 2;

  const addProduct = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const addCategory = useMutation({
    mutationFn: async (category: { nome: string; tipo: 'produto' | 'servico' }) => {
      const { data, error } = await supabase
        .from('product_categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_categories'] });
    },
  });

  const addSupplier = useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const calculatePrice = (custo: number) => custo * markup;

  return {
    products,
    categories: categories.filter(c => c.tipo === 'produto'),
    suppliers,
    markup,
    isLoading,
    addProduct: addProduct.mutateAsync,
    updateProduct: updateProduct.mutateAsync,
    deleteProduct: deleteProduct.mutateAsync,
    addCategory: addCategory.mutateAsync,
    addSupplier: addSupplier.mutateAsync,
    calculatePrice,
  };
}
