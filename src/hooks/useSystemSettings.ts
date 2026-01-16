import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemSettings {
  valor_hora: number;
  markup_padrao: number;
}

export function useSystemSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      if (error) throw error;
      
      const settingsMap: SystemSettings = {
        valor_hora: 50,
        markup_padrao: 2,
      };
      
      data?.forEach(s => {
        if (s.key === 'valor_hora' || s.key === 'markup_padrao') {
          settingsMap[s.key] = Number(s.value);
        }
      });
      
      return settingsMap;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
    },
  });

  return {
    settings: settings || { valor_hora: 50, markup_padrao: 2 },
    isLoading,
    updateSetting: updateSetting.mutateAsync,
  };
}
