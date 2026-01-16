import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Calculator } from 'lucide-react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';
import { formatCurrency, formatPercent, formatMultiplier, formatNumber } from '@/lib/utils';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess?: () => void;
}

export function ProductFormDialog({ open, onOpenChange, product, onSuccess }: ProductFormDialogProps) {
  const { addProduct, updateProduct, categories, suppliers, markup: defaultMarkup } = useProducts();
  const { settings } = useSystemSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [useCustomMarkup, setUseCustomMarkup] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    custo: 0,
    preco_venda: 0,
    markup: 0,
    estoque_atual: 0,
    estoque_minimo: 0,
    unidade: 'un',
    category_id: '',
    supplier_id: '',
    ativo: true,
  });

  useEffect(() => {
    if (product) {
      const hasCustomMarkup = product.markup !== null && product.markup !== undefined;
      setUseCustomMarkup(hasCustomMarkup);
      setFormData({
        nome: product.nome,
        descricao: product.descricao || '',
        custo: product.custo,
        preco_venda: product.preco_venda,
        markup: product.markup || settings.markup_padrao || 2,
        estoque_atual: product.estoque_atual,
        estoque_minimo: product.estoque_minimo,
        unidade: product.unidade || 'un',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        ativo: product.ativo,
      });
    } else {
      setUseCustomMarkup(false);
      setFormData({
        nome: '',
        descricao: '',
        custo: 0,
        preco_venda: 0,
        markup: settings.markup_padrao || 2,
        estoque_atual: 0,
        estoque_minimo: 0,
        unidade: 'un',
        category_id: '',
        supplier_id: '',
        ativo: true,
      });
    }
  }, [product, open, settings.markup_padrao]);

  // Calcular margem de lucro em porcentagem
  const margemLucro = formData.custo > 0 
    ? (((formData.preco_venda - formData.custo) / formData.custo) * 100)
    : 0;

  // Calcular markup efetivo baseado em custo e preço de venda
  const markupEfetivo = formData.custo > 0 
    ? (formData.preco_venda / formData.custo)
    : 0;

  // Calcular lucro absoluto
  const lucroAbsoluto = formData.preco_venda - formData.custo;

  // Handler para mudança de custo - recalcula preço baseado no markup
  const handleCustoChange = (custo: number) => {
    const currentMarkup = useCustomMarkup ? formData.markup : settings.markup_padrao;
    const novoPreco = custo * currentMarkup;
    setFormData(prev => ({ 
      ...prev, 
      custo, 
      preco_venda: novoPreco
    }));
  };

  // Handler para mudança de preço de venda - recalcula markup e margem automaticamente
  const handlePrecoVendaChange = (preco_venda: number) => {
    setFormData(prev => {
      // Se tem custo, recalcula o markup
      const newMarkup = prev.custo > 0 ? preco_venda / prev.custo : prev.markup;
      return { 
        ...prev, 
        preco_venda,
        markup: useCustomMarkup ? newMarkup : prev.markup
      };
    });
  };

  // Handler para mudança de markup - recalcula preço de venda
  const handleMarkupChange = (markup: number) => {
    const novoPreco = formData.custo * markup;
    setFormData(prev => ({ 
      ...prev, 
      markup,
      preco_venda: novoPreco
    }));
  };

  // Handler para toggle de markup customizado
  const handleUseCustomMarkupChange = (checked: boolean) => {
    setUseCustomMarkup(checked);
    if (!checked) {
      // Volta para o markup padrão e recalcula preço
      const novoPreco = formData.custo * settings.markup_padrao;
      setFormData(prev => ({ 
        ...prev, 
        markup: settings.markup_padrao,
        preco_venda: novoPreco
      }));
    }
  };

  // Calcular preço sugerido baseado no markup
  const calcularPrecoSugerido = () => {
    const markup = useCustomMarkup ? formData.markup : settings.markup_padrao;
    const precoSugerido = formData.custo * markup;
    setFormData(prev => ({ ...prev, preco_venda: precoSugerido }));
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
        custo: formData.custo,
        preco_venda: formData.preco_venda,
        markup: useCustomMarkup ? formData.markup : null,
        estoque_atual: formData.estoque_atual,
        estoque_minimo: formData.estoque_minimo,
        unidade: formData.unidade,
        category_id: formData.category_id || null,
        supplier_id: formData.supplier_id || null,
        ativo: formData.ativo,
      };

      if (product) {
        await updateProduct({ id: product.id, ...data });
        toast.success('Produto atualizado!');
      } else {
        await addProduct(data);
        toast.success('Produto criado!');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome do produto"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select value={formData.unidade} onValueChange={(v) => setFormData(prev => ({ ...prev, unidade: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="un">Unidade</SelectItem>
                  <SelectItem value="kg">Quilograma</SelectItem>
                  <SelectItem value="m">Metro</SelectItem>
                  <SelectItem value="m2">Metro²</SelectItem>
                  <SelectItem value="l">Litro</SelectItem>
                  <SelectItem value="cx">Caixa</SelectItem>
                  <SelectItem value="pc">Peça</SelectItem>
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
              placeholder="Descrição do produto"
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData(prev => ({ ...prev, supplier_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(sup => (
                    <SelectItem key={sup.id} value={sup.id}>{sup.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Precificação</h4>
              <div className="flex items-center gap-2">
                <Switch
                  id="useCustomMarkup"
                  checked={useCustomMarkup}
                  onCheckedChange={handleUseCustomMarkupChange}
                />
                <Label htmlFor="useCustomMarkup" className="text-xs text-muted-foreground">
                  Markup personalizado
                </Label>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="custo">Custo (R$)</Label>
                <Input
                  id="custo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.custo}
                  onChange={(e) => handleCustoChange(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="markup">
                  Markup {useCustomMarkup ? '' : '(padrão)'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="markup"
                    type="number"
                    step="0.01"
                    min="1"
                    value={useCustomMarkup ? formData.markup : settings.markup_padrao}
                    onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 1)}
                    disabled={!useCustomMarkup}
                    className={!useCustomMarkup ? 'bg-muted' : ''}
                  />
                  <span className="flex items-center text-sm text-muted-foreground">x</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preco_venda">Preço Venda (R$)</Label>
                <div className="flex gap-1">
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_venda}
                    onChange={(e) => handlePrecoVendaChange(parseFloat(e.target.value) || 0)}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={calcularPrecoSugerido}
                    title="Calcular preço sugerido"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Margem</Label>
                <div className={`h-10 px-3 py-2 rounded-md border text-sm flex items-center justify-between ${
                  margemLucro >= 0 ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300' 
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300'
                }`}>
                  <span>{formatPercent(margemLucro)}</span>
                </div>
              </div>
            </div>
            
            {/* Resumo de precificação */}
            <div className="grid gap-2 md:grid-cols-3 pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Markup efetivo:</span> {formatMultiplier(markupEfetivo)}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Lucro por unidade:</span> {formatCurrency(lucroAbsoluto)}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Markup padrão:</span> {formatMultiplier(settings.markup_padrao)}
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-sm">Estoque</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estoque_atual">Estoque Atual</Label>
                <Input
                  id="estoque_atual"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estoque_atual}
                  onChange={(e) => setFormData(prev => ({ ...prev, estoque_atual: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estoque_minimo}
                  onChange={(e) => setFormData(prev => ({ ...prev, estoque_minimo: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
            <Label htmlFor="ativo">Produto ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Salvar' : 'Criar Produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}