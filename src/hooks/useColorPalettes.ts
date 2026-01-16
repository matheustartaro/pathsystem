import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ColorPalette {
  id: string;
  group_name: string;
  colors: string[];
}

export function useColorPalettes() {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPalettes();
  }, []);

  const fetchPalettes = async () => {
    try {
      const { data, error } = await supabase
        .from('color_palettes')
        .select('*')
        .order('group_name');

      if (error) throw error;

      setPalettes(data?.map(p => ({
        id: p.id,
        group_name: p.group_name,
        colors: p.colors as string[],
      })) || []);
    } catch (error) {
      console.error('Error fetching color palettes:', error);
      // Use defaults if fetch fails
      setPalettes(getDefaultPalettes());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultPalettes = (): ColorPalette[] => [
    {
      id: '1',
      group_name: 'Neutras',
      colors: ['hsl(0, 0%, 20%)', 'hsl(0, 0%, 35%)', 'hsl(0, 0%, 50%)', 'hsl(0, 0%, 65%)', 'hsl(0, 0%, 80%)', 'hsl(220, 10%, 40%)', 'hsl(220, 10%, 55%)', 'hsl(220, 10%, 70%)'],
    },
    {
      id: '2',
      group_name: 'Tons Quentes',
      colors: ['hsl(0, 70%, 50%)', 'hsl(0, 60%, 60%)', 'hsl(15, 70%, 50%)', 'hsl(25, 80%, 55%)', 'hsl(35, 85%, 50%)', 'hsl(45, 90%, 50%)', 'hsl(50, 80%, 55%)', 'hsl(60, 70%, 50%)'],
    },
    {
      id: '3',
      group_name: 'Tons Frios',
      colors: ['hsl(200, 70%, 50%)', 'hsl(210, 75%, 55%)', 'hsl(220, 70%, 50%)', 'hsl(230, 65%, 55%)', 'hsl(240, 60%, 55%)', 'hsl(250, 55%, 55%)', 'hsl(260, 50%, 55%)', 'hsl(270, 55%, 55%)'],
    },
    {
      id: '4',
      group_name: 'Tons Naturais',
      colors: ['hsl(120, 35%, 45%)', 'hsl(140, 40%, 45%)', 'hsl(160, 35%, 50%)', 'hsl(80, 40%, 45%)', 'hsl(100, 35%, 50%)', 'hsl(30, 50%, 45%)', 'hsl(25, 55%, 40%)', 'hsl(20, 45%, 35%)'],
    },
    {
      id: '5',
      group_name: 'Cores Vivas',
      colors: ['hsl(0, 85%, 55%)', 'hsl(30, 90%, 55%)', 'hsl(60, 85%, 50%)', 'hsl(120, 70%, 45%)', 'hsl(180, 70%, 45%)', 'hsl(210, 85%, 55%)', 'hsl(270, 70%, 55%)', 'hsl(330, 75%, 55%)'],
    },
    {
      id: '6',
      group_name: 'Pastéis',
      colors: ['hsl(0, 50%, 75%)', 'hsl(30, 55%, 80%)', 'hsl(60, 50%, 80%)', 'hsl(120, 40%, 75%)', 'hsl(180, 45%, 75%)', 'hsl(210, 50%, 80%)', 'hsl(270, 45%, 80%)', 'hsl(330, 45%, 80%)'],
    },
    {
      id: '7',
      group_name: 'Terrosos',
      colors: ['hsl(25, 40%, 35%)', 'hsl(30, 45%, 40%)', 'hsl(35, 50%, 45%)', 'hsl(20, 35%, 30%)', 'hsl(15, 30%, 35%)', 'hsl(40, 35%, 50%)', 'hsl(45, 30%, 55%)', 'hsl(10, 25%, 40%)'],
    },
    {
      id: '8',
      group_name: 'Neon',
      colors: ['hsl(0, 100%, 60%)', 'hsl(30, 100%, 55%)', 'hsl(60, 100%, 50%)', 'hsl(120, 100%, 45%)', 'hsl(180, 100%, 45%)', 'hsl(210, 100%, 55%)', 'hsl(270, 100%, 60%)', 'hsl(330, 100%, 55%)'],
    },
  ];

  return {
    palettes,
    isLoading,
    refetch: fetchPalettes,
  };
}