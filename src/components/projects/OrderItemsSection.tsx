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
  type: 'product' | 'service' | 'foam';
  itemId: string;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
  descricao?: string;
  isManual?: boolean;
  // Foam specific fields
  largura?: number;
  comprimento?: number;
  altura?: number;
  metroCubico?: number;
  precoM3?: number;
}

interface OrderItemsSectionProps {
  items: OrderItemInput[];
  onChange: (items: OrderItemInput[]) => void;
}

// Category name for foam products
const FOAM_CATEGORY_NAME = 'Espumas';

export function OrderItemsSection({ items, onChange }: OrderItemsSectionProps) {
  const { products, categories, addProduct: addProductToDb } = useProducts();
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
  const [manualProductIsFoam, setManualProductIsFoam] = useState(false);
  const [manualFoamLargura, setManualFoamLargura] = useState<number>(0);
  const [manualFoamComprimento, setManualFoamComprimento] = useState<number>(0);
  const [manualFoamAltura, setManualFoamAltura] = useState<number>(0);
  const [manualFoamPrecoM3, setManualFoamPrecoM3] = useState<number>(0);
  
  // Foam fields for catalog products
  const [foamFields, setFoamFields] = useState<{[key: string]: {largura: number; comprimento: number; altura: number; precoM3: number}}>({});

  const activeProducts = useMemo(() => products.filter(p => p.ativo), [products]);
  const activeServices = useMemo(() => services.filter(s => s.ativo), [services]);
  
  // Find foam category ID
  const foamCategoryId = useMemo(() => {
    const foamCategory = categories.find(c => c.nome.toLowerCase().includes('espuma'));
    return foamCategory?.id;
  }, [categories]);

  // Check if a product is foam (by category)
  const isProductFoam = (categoryId: string | null) => {
    if (!foamCategoryId || !categoryId) return false;
    return categoryId === foamCategoryId;
  };

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

    const itemId = `manual-${manualProductIsFoam ? 'foam' : 'product'}-${Date.now()}`;
    
    if (manualProductIsFoam) {
      // Foam calculation
      if (manualFoamLargura <= 0 || manualFoamComprimento <= 0 || manualFoamAltura <= 0) {
        toast.error('Preencha as dimensões corretamente');
        return;
      }
      
      const metroCubico = (manualFoamLargura * manualFoamComprimento * manualFoamAltura * manualProductQty) / 1000000;
      const total = metroCubico * manualFoamPrecoM3;
      
      if (saveProductToDb) {
        try {
          const newProduct = await addProductToDb({
            nome: manualProductName.trim(),
            descricao: manualProductDesc.trim() || null,
            preco_venda: manualFoamPrecoM3,
            custo: 0,
            unidade: 'm³',
            category_id: foamCategoryId || null,
            supplier_id: null,
            ativo: true,
            estoque_atual: 0,
            estoque_minimo: 0,
            markup: null,
          });
          
          onChange([...items, {
            type: 'foam',
            itemId: newProduct.id,
            nome: newProduct.nome,
            quantidade: manualProductQty,
            preco_unitario: manualFoamPrecoM3,
            desconto: 0,
            total,
            descricao: manualProductDesc.trim() || undefined,
            largura: manualFoamLargura,
            comprimento: manualFoamComprimento,
            altura: manualFoamAltura,
            metroCubico,
            precoM3: manualFoamPrecoM3,
          }]);
          
          toast.success('Espuma salva no catálogo!');
        } catch (error) {
          toast.error('Erro ao salvar espuma');
          return;
        }
      } else {
        onChange([...items, {
          type: 'foam',
          itemId,
          nome: manualProductName.trim(),
          quantidade: manualProductQty,
          preco_unitario: manualFoamPrecoM3,
          desconto: 0,
          total,
          descricao: manualProductDesc.trim() || undefined,
          largura: manualFoamLargura,
          comprimento: manualFoamComprimento,
          altura: manualFoamAltura,
          metroCubico,
          precoM3: manualFoamPrecoM3,
          isManual: true,
        }]);
      }
    } else {
      // Regular product
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
            estoque_atual: 0,
            estoque_minimo: 0,
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
    }
    
    resetManualProductForm();
  };

  const resetManualProductForm = () => {
    setManualProductName('');
    setManualProductPrice(0);
    setManualProductQty(1);
    setManualProductDesc('');
    setSaveProductToDb(false);
    setManualProductIsFoam(false);
    setManualFoamLargura(0);
    setManualFoamComprimento(0);
    setManualFoamAltura(0);
    setManualFoamPrecoM3(0);
    setShowManualProduct(false);
  };

  const addProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const isFoam = isProductFoam(product.category_id);
    
    if (isFoam) {
      // Initialize foam fields for this product if not exists
      if (!foamFields[productId]) {
        setFoamFields(prev => ({
          ...prev,
          [productId]: { largura: 0, comprimento: 0, altura: 0, precoM3: product.preco_venda }
        }));
      }
      toast.info('Preencha as dimensões da espuma abaixo');
    } else {
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
    }
    
    setProductSelectKey(prev => prev + 1);
  };

  const addFoamFromCatalog = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const fields = foamFields[productId];
    
    if (!product || !fields) return;
    
    if (fields.largura <= 0 || fields.comprimento <= 0 || fields.altura <= 0) {
      toast.error('Preencha as dimensões corretamente');
      return;
    }
    
    const metroCubico = (fields.largura * fields.comprimento * fields.altura) / 1000000;
    const total = metroCubico * fields.precoM3;
    
    onChange([...items, {
      type: 'foam',
      itemId: product.id,
      nome: product.nome,
      quantidade: 1,
      preco_unitario: fields.precoM3,
      desconto: 0,
      total,
      largura: fields.largura,
      comprimento: fields.comprimento,
      altura: fields.altura,
      metroCubico,
      precoM3: fields.precoM3,
    }]);
    
    // Clear the foam fields
    setFoamFields(prev => {
      const newFields = { ...prev };
      delete newFields[productId];
      return newFields;
    });
    
    toast.success('Espuma adicionada!');
  };

  const cancelFoamEntry = (productId: string) => {
    setFoamFields(prev => {
      const newFields = { ...prev };
      delete newFields[productId];
      return newFields;
    });
  };

  const updateFoamField = (productId: string, field: keyof typeof foamFields[string], value: number) => {
    setFoamFields(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value }
    }));
  };

  const updateItem = (index: number, field: keyof OrderItemInput, value: number | string) => {
    const updated = [...items];
    const item = updated[index];
    (item as any)[field] = value;
    
    // Recalculate total for foam items
    if (item.type === 'foam' && (field === 'largura' || field === 'comprimento' || field === 'altura' || field === 'quantidade' || field === 'preco_unitario')) {
      const largura = field === 'largura' ? (value as number) : (item.largura || 0);
      const comprimento = field === 'comprimento' ? (value as number) : (item.comprimento || 0);
      const altura = field === 'altura' ? (value as number) : (item.altura || 0);
      const qty = field === 'quantidade' ? (value as number) : item.quantidade;
      const precoM3 = field === 'preco_unitario' ? (value as number) : (item.precoM3 || item.preco_unitario);
      
      const metroCubico = (largura * comprimento * altura * qty) / 1000000;
      item.metroCubico = metroCubico;
      item.total = metroCubico * precoM3 - item.desconto;
    } else if (field !== 'descricao') {
      item.total = (item.quantidade * item.preco_unitario) - item.desconto;
    }
    
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const totalGeral = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);

  const serviceItems = useMemo(() => items.filter(i => i.type === 'service'), [items]);
  const productItems = useMemo(() => items.filter(i => i.type === 'product' || i.type === 'foam'), [items]);

  const manualFoamPreview = useMemo(() => {
    if (manualFoamLargura <= 0 || manualFoamComprimento <= 0 || manualFoamAltura <= 0) return { m3: 0, total: 0 };
    const m3 = (manualFoamLargura * manualFoamComprimento * manualFoamAltura * manualProductQty) / 1000000;
    return { m3, total: m3 * manualFoamPrecoM3 };
  }, [manualFoamLargura, manualFoamComprimento, manualFoamAltura, manualProductQty, manualFoamPrecoM3]);

  const renderItemRow = (item: OrderItemInput, index: number) => {
    const isFoam = item.type === 'foam';
    
    return (
      <div 
        key={`${item.type}-${item.itemId}-${index}`} 
        className="flex flex-col gap-2 p-3 bg-background rounded-lg border"
      >
        <div className="flex items-start gap-2">
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
                {isFoam && <span className="ml-1 text-xs text-purple-500">(espuma)</span>}
              </span>
            </div>
            {isFoam && item.metroCubico && (
              <div className="text-xs text-muted-foreground ml-6 mt-1">
                {item.largura}cm × {item.comprimento}cm × {item.altura}cm = {item.metroCubico.toFixed(4)} m³
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {!isFoam && (
              <>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={item.quantidade}
                  onChange={(e) => updateItem(index, 'quantidade', Number(e.target.value))}
                  className="w-16 h-7 text-center text-sm"
                />
                <span className="text-xs text-muted-foreground">×</span>
              </>
            )}
            <Input
              type="number"
              min={0}
              step={0.01}
              value={isFoam ? (item.precoM3 || item.preco_unitario) : item.preco_unitario}
              onChange={(e) => updateItem(index, 'preco_unitario', Number(e.target.value))}
              className="w-20 h-7 text-sm"
              title={isFoam ? 'Preço por m³' : 'Preço unitário'}
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.desconto}
              onChange={(e) => updateItem(index, 'desconto', Number(e.target.value))}
              className="w-16 h-7 text-sm"
              placeholder="Desc."
            />
            <span className="text-xs font-medium w-24 text-right">
              {formatCurrency(item.total)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Description field */}
        <div className="ml-6">
          <Input
            placeholder="Descrição/observação do item..."
            value={item.descricao || ''}
            onChange={(e) => updateItem(index, 'descricao', e.target.value)}
            className="h-7 text-sm"
          />
        </div>
      </div>
    );
  };

  // Products that have pending foam entries
  const pendingFoamProducts = useMemo(() => {
    return Object.keys(foamFields).map(id => {
      const product = products.find(p => p.id === id);
      return product ? { product, fields: foamFields[id] } : null;
    }).filter(Boolean) as { product: typeof products[0]; fields: typeof foamFields[string] }[];
  }, [foamFields, products]);

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <Label className="font-medium">Itens do Pedido</Label>
        <span className="text-sm font-semibold text-primary">
          Total: {formatCurrency(totalGeral)}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'service' | 'product')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="service" className="gap-2">
            <Wrench className="w-4 h-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="product" className="gap-2">
            <Package className="w-4 h-4" />
            Produtos / Espumas
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="service" className="mt-3 space-y-3">
          <Select key={serviceSelectKey} onValueChange={addService}>
            <SelectTrigger>
              <SelectValue placeholder="Adicionar serviço do catálogo..." />
            </SelectTrigger>
            <SelectContent>
              {activeServices.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  <div className="flex items-center gap-2">
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
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowManualService(true)}
            >
              <Edit2 className="w-4 h-4" />
              Adicionar serviço manual
            </Button>
          ) : (
            <div className="p-3 border rounded-lg space-y-3 bg-muted/50">
              <p className="text-sm font-medium">Serviço personalizado:</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Nome do serviço"
                  value={manualServiceName}
                  onChange={(e) => setManualServiceName(e.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Preço (R$)"
                  value={manualServicePrice || ''}
                  onChange={(e) => setManualServicePrice(Number(e.target.value))}
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
                <Button type="button" size="sm" onClick={handleAddManualService}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={resetManualServiceForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Service items list */}
          {serviceItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Serviços adicionados:</p>
              {serviceItems.map((item) => {
                const index = items.findIndex(i => i === item);
                return renderItemRow(item, index);
              })}
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="product" className="mt-3 space-y-3">
          <Select key={productSelectKey} onValueChange={addProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Adicionar produto do catálogo..." />
            </SelectTrigger>
            <SelectContent>
              {activeProducts.map(product => {
                const isFoam = isProductFoam(product.category_id);
                return (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-2">
                      <span>{product.nome}</span>
                      {isFoam && <span className="text-xs text-purple-500">(espuma)</span>}
                      <span className="text-muted-foreground">
                        {formatCurrency(product.preco_venda)}
                        {isFoam && '/m³'}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Pending foam entries - show dimension fields */}
          {pendingFoamProducts.map(({ product, fields }) => (
            <div key={product.id} className="p-3 border rounded-lg space-y-3 bg-purple-50 dark:bg-purple-950/30">
              <p className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-500" />
                {product.nome} - Preencha as dimensões:
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Largura (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={fields.largura || ''}
                    onChange={(e) => updateFoamField(product.id, 'largura', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Comprimento (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={fields.comprimento || ''}
                    onChange={(e) => updateFoamField(product.id, 'comprimento', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={fields.altura || ''}
                    onChange={(e) => updateFoamField(product.id, 'altura', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Preço/m³ (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={fields.precoM3 || ''}
                    onChange={(e) => updateFoamField(product.id, 'precoM3', Number(e.target.value))}
                  />
                </div>
              </div>
              {fields.largura > 0 && fields.comprimento > 0 && fields.altura > 0 && (
                <div className="text-sm p-2 bg-muted rounded">
                  <strong>Cálculo:</strong> {fields.largura} × {fields.comprimento} × {fields.altura} = <strong>{((fields.largura * fields.comprimento * fields.altura) / 1000000).toFixed(4)} m³</strong>
                  {fields.precoM3 > 0 && (
                    <span className="ml-2">→ <strong>R$ {((fields.largura * fields.comprimento * fields.altura) / 1000000 * fields.precoM3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => addFoamFromCatalog(product.id)}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => cancelFoamEntry(product.id)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ))}

          {!showManualProduct ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setShowManualProduct(true)}
            >
              <Edit2 className="w-4 h-4" />
              Adicionar produto/espuma manual
            </Button>
          ) : (
            <div className="p-3 border rounded-lg space-y-3 bg-muted/50">
              <p className="text-sm font-medium">Produto/Espuma personalizado:</p>
              
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="isFoam"
                  checked={manualProductIsFoam}
                  onCheckedChange={(c) => setManualProductIsFoam(!!c)}
                />
                <Label htmlFor="isFoam" className="text-sm cursor-pointer">
                  É uma espuma (calcular por m³)
                </Label>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Nome do produto"
                  value={manualProductName}
                  onChange={(e) => setManualProductName(e.target.value)}
                  className="col-span-2"
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Qtd"
                  value={manualProductQty}
                  onChange={(e) => setManualProductQty(Number(e.target.value))}
                />
              </div>
              
              {manualProductIsFoam ? (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Largura (cm)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={manualFoamLargura || ''}
                        onChange={(e) => setManualFoamLargura(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Comprimento (cm)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={manualFoamComprimento || ''}
                        onChange={(e) => setManualFoamComprimento(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Altura (cm)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        value={manualFoamAltura || ''}
                        onChange={(e) => setManualFoamAltura(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Preço/m³ (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={manualFoamPrecoM3 || ''}
                        onChange={(e) => setManualFoamPrecoM3(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  {manualFoamPreview.m3 > 0 && (
                    <div className="text-sm p-2 bg-muted rounded">
                      <strong>Cálculo:</strong> {manualFoamLargura} × {manualFoamComprimento} × {manualFoamAltura} × {manualProductQty} = <strong>{manualFoamPreview.m3.toFixed(4)} m³</strong>
                      {manualFoamPrecoM3 > 0 && (
                        <span className="ml-2">→ <strong>R$ {manualFoamPreview.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Preço unitário (R$)"
                  value={manualProductPrice || ''}
                  onChange={(e) => setManualProductPrice(Number(e.target.value))}
                />
              )}
              
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
                <Button type="button" size="sm" onClick={handleAddManualProduct}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={resetManualProductForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Product items list */}
          {productItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Produtos/Espumas adicionados:</p>
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
