import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useServices, Service } from '@/hooks/useServices';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSuccess?: () => void;
}

export function ServiceFormDialog({ open, onOpenChange, service, onSuccess }: ServiceFormDialogProps) {
  const { addService, updateService, categories, valorHora, markup } = useServices();
  const { settings } = useSystemSettings();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    horas: 1,
    custo_hora: 0,
    preco_venda: 0,
    category_id: '',
    ativo: true,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        nome: service.nome,
        descricao: service.descricao || '',
        horas: service.horas,
        custo_hora: service.custo_hora || settings?.valor_hora || 0,
        preco_venda: service.preco_venda,
        category_id: service.category_id || '',
        ativo: service.ativo,
      });
    } else {
      const valorHora = settings?.valor_hora || 0;
      const markup = settings?.markup_padrao || 1;
      setFormData({
        nome: '',
        descricao: '',
        horas: 1,
        custo_hora: valorHora,
        preco_venda: valorHora * markup,
        category_id: '',
        ativo: true,
      });
    }
  }, [service, open, settings]);

  // Valores seguros para settings
  const markupPadrao = settings?.markup_padrao ?? 1;
  const valorHoraPadrao = settings?.valor_hora ?? 0;

  // (horas * custo_hora) * markup
  const calcularPreco = (horas: number, custoHora: number) => {
    return (horas * custoHora) * markupPadrao;
  };

  const handleHorasChange = (horas: number) => {
    const precoSugerido = calcularPreco(horas, formData.custo_hora);
    setFormData(prev => ({ 
      ...prev, 
      horas,
      preco_venda: precoSugerido,
    }));
  };

  const handleCustoHoraChange = (custoHora: number) => {
    const precoSugerido = calcularPreco(formData.horas, custoHora);
    setFormData(prev => ({ 
      ...prev, 
      custo_hora: custoHora,
      preco_venda: precoSugerido,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        horas: formData.horas,
        custo_hora: formData.custo_hora,
        preco_venda: formData.preco_venda,
        category_id: formData.category_id || null,
        ativo: formData.ativo,
      };

      if (service) {
        await updateService({ id: service.id, ...data });
        toast.success('Serviço atualizado!');
      } else {
        await addService(data);
        toast.success('Serviço criado!');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao salvar serviço');
    } finally {
      setIsLoading(false);
    }
  };

  const custoTotal = formData.horas * formData.custo_hora;
  const margemLucro = custoTotal > 0 
    ? (((formData.preco_venda - custoTotal) / custoTotal) * 100).toFixed(1)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do serviço"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição do serviço"
              rows={2}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-sm">Precificação: (Horas × Valor Hora) × Markup</h4>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="horas">Horas</Label>
                <Input
                  id="horas"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.horas}
                  onChange={(e) => handleHorasChange(parseFloat(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custo_hora">Valor Hora (R$)</Label>
                <Input
                  id="custo_hora"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.custo_hora}
                  onChange={(e) => handleCustoHoraChange(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_venda">Preço Final (R$)</Label>
                <Input
                  id="preco_venda"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData(prev => ({ ...prev, preco_venda: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Margem</Label>
                <div className="h-10 px-3 py-2 bg-background rounded-md border border-input text-sm">
                  {margemLucro}%
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Fórmula: ({formData.horas}h × R${(formData.custo_hora || 0).toFixed(2)}) × {markupPadrao} = R${calcularPreco(formData.horas, formData.custo_hora).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
            <Label htmlFor="ativo">Serviço ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {service ? 'Salvar' : 'Criar Serviço'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
