import { useState } from 'react';
import { Plus, Trash2, Edit2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useProducts, Supplier } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function SuppliersSection() {
  const { suppliers } = useProducts();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
  });

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        nome: supplier.nome,
        cnpj: supplier.cnpj || '',
        telefone: supplier.telefone || '',
        email: supplier.email || '',
        endereco: supplier.endereco || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({ nome: '', cnpj: '', telefone: '', email: '', endereco: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingSupplier) {
        await supabase
          .from('suppliers')
          .update({
            nome: formData.nome,
            cnpj: formData.cnpj || null,
            telefone: formData.telefone || null,
            email: formData.email || null,
            endereco: formData.endereco || null,
          })
          .eq('id', editingSupplier.id);
        toast.success('Fornecedor atualizado');
      } else {
        await supabase.from('suppliers').insert({
          nome: formData.nome,
          cnpj: formData.cnpj || null,
          telefone: formData.telefone || null,
          email: formData.email || null,
          endereco: formData.endereco || null,
        });
        toast.success('Fornecedor criado');
      }
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    
    try {
      await supabase.from('suppliers').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor excluído');
    } catch (error) {
      toast.error('Erro ao excluir fornecedor');
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Fornecedores</h2>
            <p className="text-sm text-muted-foreground">Gerencie seus fornecedores de produtos</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="space-y-3">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{supplier.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {supplier.cnpj || 'Sem CNPJ'} {supplier.telefone && `• ${supplier.telefone}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(supplier.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {suppliers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Truck className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Nenhum fornecedor</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cadastre fornecedores para associar aos produtos
            </p>
            <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Fornecedor
            </Button>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@fornecedor.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Endereço completo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingSupplier ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
