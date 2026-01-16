import { useState, useEffect } from 'react';
import { StatusCategory, ProjectStatus } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'projetos-jm-status-categories';

// Static default categories - used as initial values before loading
const DEFAULT_CATEGORIES: StatusCategory[] = [
  { id: '1', name: 'Pendente', color: 'hsl(220, 15%, 55%)', key: 'pendente', order: 0, showDelayTag: false },
  { id: '2', name: 'Em Andamento', color: 'hsl(40, 25%, 50%)', key: 'em_andamento', order: 1, showDelayTag: true },
  { id: '3', name: 'Pausado', color: 'hsl(35, 20%, 45%)', key: 'pausado', order: 2, showDelayTag: false },
  { id: '4', name: 'Concluído', color: 'hsl(150, 20%, 45%)', key: 'concluido', order: 3, showDelayTag: false },
];

export function useStatusCategories() {
  // Initialize with default categories to avoid gray state
  const [categories, setCategories] = useState<StatusCategory[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('status_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedData = data.map((d, index) => ({
          id: d.id,
          name: d.name,
          color: d.color,
          key: d.key,
          order: (d as any).sort_order ?? index,
          showDelayTag: (d as any).show_delay_tag ?? true,
        }));
        setCategories(mappedData);
      } else {
        // Insert default categories if none exist
        for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
          const cat = DEFAULT_CATEGORIES[i];
          await supabase.from('status_categories').insert({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            key: cat.key,
            sort_order: i,
          } as any);
        }
        setCategories(DEFAULT_CATEGORIES);
      }
      setUseSupabase(true);
    } catch {
      console.log('Falling back to localStorage for status categories');
      setUseSupabase(false);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setCategories(JSON.parse(stored));
        } catch {
          setCategories(DEFAULT_CATEGORIES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
        }
      } else {
        setCategories(DEFAULT_CATEGORIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveCategories = (newCategories: StatusCategory[]) => {
    setCategories(newCategories);
    if (!useSupabase) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
    }
  };

  const addCategory = async (category: Omit<StatusCategory, 'id' | 'order'>) => {
    const newCategory: StatusCategory = {
      ...category,
      id: crypto.randomUUID(),
      order: categories.length,
      showDelayTag: category.showDelayTag ?? true,
    };

    if (useSupabase) {
      try {
        await supabase.from('status_categories').insert({
          id: newCategory.id,
          name: newCategory.name,
          color: newCategory.color,
          key: newCategory.key,
          show_delay_tag: newCategory.showDelayTag,
        } as any);
      } catch (error) {
        console.error('Error adding category:', error);
      }
    }

    saveCategories([...categories, newCategory]);
    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<StatusCategory>) => {
    if (useSupabase) {
      try {
        const updateData: Record<string, unknown> = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.color !== undefined) updateData.color = updates.color;
        if (updates.key !== undefined) updateData.key = updates.key;
        if (updates.showDelayTag !== undefined) updateData.show_delay_tag = updates.showDelayTag;

        await supabase
          .from('status_categories')
          .update(updateData)
          .eq('id', id);
      } catch (error) {
        console.error('Error updating category:', error);
      }
    }

    const updated = categories.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    saveCategories(updated);
  };

  const deleteCategory = async (id: string) => {
    if (useSupabase) {
      try {
        await supabase.from('status_categories').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
    saveCategories(categories.filter(c => c.id !== id));
  };

  const reorderCategories = async (sourceIndex: number, destIndex: number) => {
    const result = Array.from(categories);
    const [removed] = result.splice(sourceIndex, 1);
    result.splice(destIndex, 0, removed);
    
    // Update order property
    const reordered = result.map((cat, index) => ({
      ...cat,
      order: index,
    }));
    
    saveCategories(reordered);
    
    // Persist order to database
    if (useSupabase) {
      try {
        for (let i = 0; i < reordered.length; i++) {
          await supabase
            .from('status_categories')
            .update({ sort_order: i } as any)
            .eq('id', reordered[i].id);
        }
      } catch (error) {
        console.error('Error saving category order:', error);
      }
    }
  };

  const getColorByStatus = (status: ProjectStatus): string => {
    const category = categories.find(c => c.key === status);
    return category?.color || 'hsl(220, 15%, 55%)';
  };

  const getCategoryByStatus = (status: ProjectStatus): StatusCategory | undefined => {
    return categories.find(c => c.key === status);
  };

  return {
    categories,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getColorByStatus,
    getCategoryByStatus,
    refetch: loadCategories,
  };
}
