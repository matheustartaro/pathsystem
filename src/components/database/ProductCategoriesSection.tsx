import { useState } from 'react';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ProductCategory {
  id: string;
  nome: string;
  tipo: 'produto' | 'servico';
  created_at: string;
}

export function ProductCategoriesSection() {
  const queryClient = useQueryClient();
  
  const { data: categories = [] } = useQuery({
    queryKey: ['product_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('tipo')
        .order('nome');
      if (error) throw error;
      return data as ProductCategory[];
    },
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'produto' as 'produto' | 'servico',
  });

  const handleOpenDialog = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        nome: category.nome,
        tipo: category.tipo,
      });
    } else {
      setEditingCategory(null);
      setFormData({ nome: '', tipo: 'produto' });
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
          .from('product_categories')
          .update({ nome: formData.nome, tipo: formData.tipo })
          .eq('id', editingCategory.id);
        toast.success('Categoria atualizada');
      } else {
        await supabase.from('product_categories').insert({
          nome: formData.nome,
          tipo: formData.tipo,
        });
        toast.success('Categoria criada');
      }
      queryClient.invalidateQueries({ queryKey: ['product_categories'] });
      setDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
      await supabase.from('product_categories').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['product_categories'] });
      toast.success('Categoria excluída');
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const productCategories = categories.filter(c => c.tipo === 'produto');
  const serviceCategories = categories.filter(c => c.tipo === 'servico');

  return (
    <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Categorias de Produtos/Serviços</h2>
            <p className="text-sm text-muted-foreground">Organize seus produtos e serviços por categoria</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="space-y-4">
        {/* Product Categories */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Categorias de Produtos</h3>
          <div className="space-y-2">
            {productCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Produto</Badge>
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
            {productCategories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Tag className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma categoria de produto</p>
              </div>
            )}
          </div>
        </div>

        {/* Service Categories */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Categorias de Serviços</h3>
          <div className="space-y-2">
            {serviceCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Serviço</Badge>
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
            {serviceCategories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Tag className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma categoria de serviço</p>
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
              <Select value={formData.tipo} onValueChange={(v: 'produto' | 'servico') => setFormData(prev => ({ ...prev, tipo: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produto">Produto</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                </SelectContent>
              </Select>
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
