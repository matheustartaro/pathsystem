import { useState } from 'react';
import { Plus, Trash2, Edit2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ColorPalettePicker } from '@/components/ui/color-palette-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FinancialCategory {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string | null;
  created_at: string;
}

export function FinancialCategoriesSection() {
  const queryClient = useQueryClient();
  
  const { data: categories = [] } = useQuery({
    queryKey: ['financial_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('tipo')
        .order('nome');
      if (error) throw error;
      return data as FinancialCategory[];
    },
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [openColorPopover, setOpenColorPopover] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'receita' as 'receita' | 'despesa',
    cor: 'hsl(220, 15%, 55%)',
  });

  const handleOpenDialog = (category?: FinancialCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nome: category.nome,
        tipo: category.tipo as 'receita' | 'despesa',
        cor: category.cor || 'hsl(220, 15%, 55%)',
      });
    } else {
      setEditingCategory(null);
      setFormData({ nome: '', tipo: 'receita', cor: 'hsl(220, 15%, 55%)' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingCategory) {
        await supabase
          .from('financial_categories')
          .update({ nome: formData.nome, tipo: formData.tipo, cor: formData.cor })
          .eq('id', editingCategory.id);
        toast.success('Categoria atualizada');
      } else {
        await supabase.from('financial_categories').insert({
          nome: formData.nome,
          tipo: formData.tipo,
          cor: formData.cor,
        });
        toast.success('Categoria criada');
      }
      queryClient.invalidateQueries({ queryKey: ['financial_categories'] });
      setDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
      await supabase.from('financial_categories').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['financial_categories'] });
      toast.success('Categoria excluída');
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleColorChange = async (id: string, newColor: string) => {
    try {
      await supabase.from('financial_categories').update({ cor: newColor }).eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['financial_categories'] });
      setOpenColorPopover(null);
      toast.success('Cor atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar cor');
    }
  };

  const receitaCategories = categories.filter(c => c.tipo === 'receita');
  const despesaCategories = categories.filter(c => c.tipo === 'despesa');

  return (
    <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Categorias Financeiras</h2>
            <p className="text-sm text-muted-foreground">Organize receitas e despesas por categoria</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="space-y-4">
        {/* Receita Categories */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Categorias de Receita</h3>
          <div className="space-y-2">
            {receitaCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <Popover 
                    open={openColorPopover === category.id}
                    onOpenChange={(open) => setOpenColorPopover(open ? category.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="w-6 h-6 rounded-full border-2 border-border hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all cursor-pointer"
                        style={{ backgroundColor: category.cor || 'hsl(142, 76%, 36%)' }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <ColorPalettePicker
                        selectedColor={category.cor || 'hsl(142, 76%, 36%)'}
                        onColorSelect={(c) => handleColorChange(category.id, c)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Receita</Badge>
                  <span className="font-medium">{category.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {receitaCategories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma categoria de receita</p>
              </div>
            )}
          </div>
        </div>

        {/* Despesa Categories */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Categorias de Despesa</h3>
          <div className="space-y-2">
            {despesaCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <Popover 
                    open={openColorPopover === category.id}
                    onOpenChange={(open) => setOpenColorPopover(open ? category.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="w-6 h-6 rounded-full border-2 border-border hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all cursor-pointer"
                        style={{ backgroundColor: category.cor || 'hsl(0, 84%, 60%)' }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <ColorPalettePicker
                        selectedColor={category.cor || 'hsl(0, 84%, 60%)'}
                        onColorSelect={(c) => handleColorChange(category.id, c)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Badge variant="destructive">Despesa</Badge>
                  <span className="font-medium">{category.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {despesaCategories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                  <Wallet className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma categoria de despesa</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da categoria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v: 'receita' | 'despesa') => setFormData(prev => ({ ...prev, tipo: v }))}>
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
              <Label>Cor</Label>
              <ColorPalettePicker
                selectedColor={formData.cor}
                onColorSelect={(c) => setFormData(prev => ({ ...prev, cor: c }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingCategory ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
