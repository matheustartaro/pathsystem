import { useState, useMemo } from 'react';
import { Trash2, Package, Wrench, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export interface OrderItemInput {
  type: 'product' | 'service';
  itemId: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
  descricao?: string;
  isManual?: boolean;
}

interface OrderItemsSectionProps {
  items: OrderItemInput[];
  onChange: (items: OrderItemInput[]) => void;
}

export function OrderItemsSection({ items, onChange }: OrderItemsSectionProps) {
  const { products, addProduct: addProductToDb } = useProducts();
  const { services, addService: addServiceToDb } = useServices();
  const [activeTab, setActiveTab] = useState<'service' | 'product'>('service');
  const [serviceSelectKey, setServiceSelectKey] = useState(0);
  const [productSelectKey, setProductSelectKey] = useState(0);
  
  // Manual item states
  const [showManualService, setShowManualService] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false);
  
  const [manualServiceName, setManualServiceName] = useState('');
  const [manualServicePrice, setManualServicePrice] = useState<number>(0);
  const [manualServiceDesc, setManualServiceDesc] = useState('');
  const [saveServiceToDb, setSaveServiceToDb] = useState(false);
  
  const [manualProductName, setManualProductName] = useState('');
  const [manualProductPrice, setManualProductPrice] = useState<number>(0);
  const [manualProductQty, setManualProductQty] = useState<number>(1);
  const [manualProductDesc, setManualProductDesc] = useState('');
  const [saveProductToDb, setSaveProductToDb] = useState(false);

  const activeProducts = useMemo(() => products.filter(p => p.ativo), [products]);
  const activeServices = useMemo(() => services.filter(s => s.ativo), [services]);

  const addService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const existingIndex = items.findIndex(i => i.type === 'service' && i.itemId === serviceId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantidade += 1;
      updated[existingIndex].total = 
        (updated[existingIndex].quantidade * updated[existingIndex].preco_unitario) - updated[existingIndex].desconto;
      onChange(updated);
    } else {
      onChange([...items, {
        type: 'service',
        itemId: service.id,
        nome: service.nome,
        quantidade: 1,
        preco_unitario: service.preco_venda,
        desconto: 0,
        total: service.preco_venda,
      }]);
    }
    
    setServiceSelectKey(prev => prev + 1);
  };

  const handleAddManualService = async () => {
    if (!manualServiceName.trim()) {
      toast.error('Digite o nome do serviço');
      return;
    }

    const itemId = `manual-service-${Date.now()}`;
    
    if (saveServiceToDb) {
      try {
        const newService = await addServiceToDb({
          nome: manualServiceName.trim(),
          descricao: manualServiceDesc.trim() || null,
          preco_venda: manualServicePrice,
          custo_hora: null,
          category_id: null,
          ativo: true,
          horas: 1,
        });
        
        onChange([...items, {
          type: 'service',
          itemId: newService.id,
          nome: newService.nome,
          quantidade: 1,
          preco_unitario: newService.preco_venda,
          desconto: 0,
          total: newService.preco_venda,
          descricao: manualServiceDesc.trim() || undefined,
        }]);
        
        toast.success('Serviço salvo no catálogo!');
      } catch (error) {
        toast.error('Erro ao salvar serviço');
        return;
      }
    } else {
      onChange([...items, {
        type: 'service',
        itemId,
        nome: manualServiceName.trim(),
        quantidade: 1,
        preco_unitario: manualServicePrice,
        desconto: 0,
        total: manualServicePrice,
        descricao: manualServiceDesc.trim() || undefined,
        isManual: true,
      }]);
    }
    
    resetManualServiceForm();
  };

  const resetManualServiceForm = () => {
    setManualServiceName('');
    setManualServicePrice(0);
    setManualServiceDesc('');
    setSaveServiceToDb(false);
    setShowManualService(false);
  };

  const handleAddManualProduct = async () => {
    if (!manualProductName.trim()) {
      toast.error('Digite o nome do produto');
      return;
    }

    const itemId = `manual-product-${Date.now()}`;
    const total = manualProductPrice * manualProductQty;
    
    if (saveProductToDb) {
      try {
        const newProduct = await addProductToDb({
          nome: manualProductName.trim(),
          descricao: manualProductDesc.trim() || null,
          preco_venda: manualProductPrice,
          custo: 0,
          unidade: 'un',
          category_id: null,
          supplier_id: null,
          ativo: true,
          markup: null,
        });
        
        onChange([...items, {
          type: 'product',
          itemId: newProduct.id,
          nome: newProduct.nome,
          quantidade: manualProductQty,
          preco_unitario: newProduct.preco_venda,
          desconto: 0,
          total: newProduct.preco_venda * manualProductQty,
          descricao: manualProductDesc.trim() || undefined,
        }]);
        
        toast.success('Produto salvo no catálogo!');
      } catch (error) {
        toast.error('Erro ao salvar produto');
        return;
      }
    } else {
      onChange([...items, {
        type: 'product',
        itemId,
        nome: manualProductName.trim(),
        quantidade: manualProductQty,
        preco_unitario: manualProductPrice,
        desconto: 0,
        total,
        descricao: manualProductDesc.trim() || undefined,
        isManual: true,
      }]);
    }
    
    resetManualProductForm();
  };

  const resetManualProductForm = () => {
    setManualProductName('');
    setManualProductPrice(0);
    setManualProductQty(1);
    setManualProductDesc('');
    setSaveProductToDb(false);
    setShowManualProduct(false);
  };

  const addProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = items.findIndex(i => i.type === 'product' && i.itemId === productId);
    
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantidade += 1;
      updated[existingIndex].total = 
        (updated[existingIndex].quantidade * updated[existingIndex].preco_unitario) - updated[existingIndex].desconto;
      onChange(updated);
    } else {
      onChange([...items, {
        type: 'product',
        itemId: product.id,
        nome: product.nome,
        quantidade: 1,
        preco_unitario: product.preco_venda,
        desconto: 0,
        total: product.preco_venda,
      }]);
    }
    
    setProductSelectKey(prev => prev + 1);
  };

  const updateItem = (index: number, field: keyof OrderItemInput, value: number | string) => {
    const updated = [...items];
    const item = updated[index];
    (item as any)[field] = value;
    
    if (field !== 'descricao') {
      item.total = (item.quantidade * item.preco_unitario) - item.desconto;
    }
    
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const totalGeral = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  const serviceItems = useMemo(() => items.filter(i => i.type === 'service'), [items]);
  const productItems = useMemo(() => items.filter(i => i.type === 'product'), [items]);

  const renderItemRow = (item: OrderItemInput, index: number) => {
    return (
      <div 
        key={`${item.type}-${item.itemId}-${index}`} 
        className="flex flex-col gap-2 p-4 bg-background rounded-lg border hover:shadow-sm transition-shadow"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {item.type === 'service' ? (
                <Wrench className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Package className="w-4 h-4 text-orange-500 shrink-0" />
              )}
              <span className="text-sm font-medium truncate">
                {item.nome}
                {item.isManual && <span className="ml-1 text-xs text-muted-foreground">(manual)</span>}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={item.quantidade}
                onChange={(e) => updateItem(index, 'quantidade', Number(e.target.value))}
                className="w-20 h-9 text-center"
              />
              <span className="text-sm text-muted-foreground">×</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={item.preco_unitario}
                onChange={(e) => updateItem(index, 'preco_unitario', Number(e.target.value))}
                className="w-28 h-9"
                title="Preço unitário"
              />
            </div>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.desconto}
              onChange={(e) => updateItem(index, 'desconto', Number(e.target.value))}
              className="w-24 h-9"
              placeholder="Desconto"
            />
            <span className="text-sm font-semibold w-28 text-right">
              {formatCurrency(item.total)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Description field */}
        <div className="ml-6">
          <Input
            placeholder="Descrição/observação do item..."
            value={item.descricao || ''}
            onChange={(e) => updateItem(index, 'descricao', e.target.value)}
            className="h-9"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-5 bg-muted/30 rounded-xl border">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-base">Itens do Projeto</Label>
        <span className="text-base font-bold text-primary">
          Total: {formatCurrency(totalGeral)}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'service' | 'product')}>
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="service" className="gap-2 text-sm">
            <Wrench className="w-4 h-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="product" className="gap-2 text-sm">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="service" className="mt-4 space-y-4">
          <Select key={serviceSelectKey} onValueChange={addService}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Adicionar serviço do catálogo..." />
            </SelectTrigger>
            <SelectContent>
              {activeServices.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  <div className="flex items-center gap-3">
                    <span>{service.nome}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(service.preco_venda)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!showManualService ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 h-11"
              onClick={() => setShowManualService(true)}
            >
              <Edit2 className="w-4 h-4" />
              Adicionar serviço manual
            </Button>
          ) : (
            <div className="p-4 border rounded-xl space-y-4 bg-muted/50">
              <p className="text-sm font-medium">Serviço personalizado:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Nome do serviço"
                  value={manualServiceName}
                  onChange={(e) => setManualServiceName(e.target.value)}
                  className="h-11"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Preço (R$)"
                  value={manualServicePrice || ''}
                  onChange={(e) => setManualServicePrice(Number(e.target.value))}
                  className="h-11"
                />
              </div>
              <Textarea
                placeholder="Descrição/observação (opcional)"
                value={manualServiceDesc}
                onChange={(e) => setManualServiceDesc(e.target.value)}
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="saveService"
                  checked={saveServiceToDb}
                  onCheckedChange={(c) => setSaveServiceToDb(!!c)}
                />
                <Label htmlFor="saveService" className="text-sm cursor-pointer">
                  Salvar serviço no catálogo
                </Label>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={handleAddManualService} className="h-10">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
                <Button type="button" variant="ghost" onClick={resetManualServiceForm} className="h-10">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Service items list */}
          {serviceItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground">Serviços adicionados:</p>
              {serviceItems.map((item) => {
                const index = items.findIndex(i => i === item);
                return renderItemRow(item, index);
              })}
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="product" className="mt-4 space-y-4">
          <Select key={productSelectKey} onValueChange={addProduct}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Adicionar produto do catálogo..." />
            </SelectTrigger>
            <SelectContent>
              {activeProducts.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center gap-3">
                    <span>{product.nome}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(product.preco_venda)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!showManualProduct ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 h-11"
              onClick={() => setShowManualProduct(true)}
            >
              <Edit2 className="w-4 h-4" />
              Adicionar produto manual
            </Button>
          ) : (
            <div className="p-4 border rounded-xl space-y-4 bg-muted/50">
              <p className="text-sm font-medium">Produto personalizado:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Nome do produto"
                  value={manualProductName}
                  onChange={(e) => setManualProductName(e.target.value)}
                  className="md:col-span-2 h-11"
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Quantidade"
                  value={manualProductQty}
                  onChange={(e) => setManualProductQty(Number(e.target.value))}
                  className="h-11"
                />
              </div>
              
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Preço unitário (R$)"
                value={manualProductPrice || ''}
                onChange={(e) => setManualProductPrice(Number(e.target.value))}
                className="h-11"
              />
              
              <Textarea
                placeholder="Descrição/observação (opcional)"
                value={manualProductDesc}
                onChange={(e) => setManualProductDesc(e.target.value)}
                rows={2}
              />
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="saveProduct"
                  checked={saveProductToDb}
                  onCheckedChange={(c) => setSaveProductToDb(!!c)}
                />
                <Label htmlFor="saveProduct" className="text-sm cursor-pointer">
                  Salvar no catálogo
                </Label>
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={handleAddManualProduct} className="h-10">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
                <Button type="button" variant="ghost" onClick={resetManualProductForm} className="h-10">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Product items list */}
          {productItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground">Produtos adicionados:</p>
              {productItems.map((item) => {
                const index = items.findIndex(i => i === item);
                return renderItemRow(item, index);
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
