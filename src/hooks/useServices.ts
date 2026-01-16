import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: string;
  nome: string;
  descricao: string | null;
  horas: number;
  custo_hora: number | null;
  preco_venda: number;
  category_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceProduct {
  id: string;
  service_id: string;
  product_id: string;
  quantidade: number;
}

export function useServices() {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Service[];
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
      return data;
    },
  });

  const { data: serviceProducts = [] } = useQuery({
    queryKey: ['service_products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_products')
        .select('*');
      if (error) throw error;
      return data as ServiceProduct[];
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

  const valorHora = settings?.valor_hora || 50;
  const markup = settings?.markup_padrao || 2;

  const addService = useMutation({
    mutationFn: async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Service> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const linkProduct = useMutation({
    mutationFn: async (data: { service_id: string; product_id: string; quantidade: number }) => {
      const { error } = await supabase
        .from('service_products')
        .upsert(data, { onConflict: 'service_id,product_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_products'] });
    },
  });

  const unlinkProduct = useMutation({
    mutationFn: async ({ service_id, product_id }: { service_id: string; product_id: string }) => {
      const { error } = await supabase
        .from('service_products')
        .delete()
        .eq('service_id', service_id)
        .eq('product_id', product_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_products'] });
    },
  });

  // (horas * valor_hora) * markup
  const calculatePrice = (horas: number, customCustoHora?: number) => {
    const custoHora = customCustoHora ?? valorHora;
    return (horas * custoHora) * markup;
  };

  const getServiceProducts = (serviceId: string) => {
    return serviceProducts.filter(sp => sp.service_id === serviceId);
  };

  return {
    services,
    categories: categories.filter(c => c.tipo === 'servico'),
    serviceProducts,
    valorHora,
    markup,
    isLoading,
    addService: addService.mutateAsync,
    updateService: updateService.mutateAsync,
    deleteService: deleteService.mutateAsync,
    linkProduct: linkProduct.mutateAsync,
    unlinkProduct: unlinkProduct.mutateAsync,
    calculatePrice,
    getServiceProducts,
  };
}
