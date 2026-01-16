import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Package } from 'lucide-react';
import { useServices, Service, ServiceProduct } from '@/hooks/useServices';
import { useProducts, Product } from '@/hooks/useProducts';
import { toast } from 'sonner';

interface ServiceProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
}

export function ServiceProductsDialog({ open, onOpenChange, service }: ServiceProductsDialogProps) {
  const { getServiceProducts, linkProduct, unlinkProduct } = useServices();
  const { products } = useProducts();
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  if (!service) return null;

  const linkedProducts = getServiceProducts(service.id);
  
  const availableProducts = products.filter(
    p => !linkedProducts.some(lp => lp.product_id === p.id)
  );

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.nome || 'Produto não encontrado';
  };

  const getProductCost = (productId: string) => {
    return products.find(p => p.id === productId)?.custo || 0;
  };

  const handleAddProduct = async () => {
    if (!selectedProductId) {
      toast.error('Selecione um produto');
      return;
    }

    try {
      await linkProduct({
        service_id: service.id,
        product_id: selectedProductId,
        quantidade,
      });
      toast.success('Produto vinculado ao serviço');
      setSelectedProductId('');
      setQuantidade(1);
    } catch (error) {
      toast.error('Erro ao vincular produto');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      await unlinkProduct({
        service_id: service.id,
        product_id: productId,
      });
      toast.success('Produto removido do serviço');
    } catch (error) {
      toast.error('Erro ao remover produto');
    }
  };

  const totalCustoProdutos = linkedProducts.reduce((sum, lp) => {
    return sum + (getProductCost(lp.product_id) * lp.quantidade);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Produtos Vinculados - {service.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Product Form */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>Produto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nome} - R$ {product.custo.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-2">
              <Label>Qtd</Label>
              <Input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button onClick={handleAddProduct} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Linked Products Table */}
          {linkedProducts.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedProducts.map((lp) => {
                    const cost = getProductCost(lp.product_id);
                    return (
                      <TableRow key={lp.id}>
                        <TableCell className="font-medium">{getProductName(lp.product_id)}</TableCell>
                        <TableCell className="text-center">{lp.quantidade}</TableCell>
                        <TableCell className="text-right">R$ {cost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">R$ {(cost * lp.quantidade).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProduct(lp.product_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum produto vinculado a este serviço</p>
              <p className="text-sm">Adicione produtos que são utilizados neste serviço</p>
            </div>
          )}

          {/* Summary */}
          {linkedProducts.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo dos Produtos:</span>
                <span className="font-medium">R$ {totalCustoProdutos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo Mão de Obra ({service.horas}h × R${(service.custo_hora || 0).toFixed(2)}):</span>
                <span className="font-medium">R$ {((service.custo_hora || 0) * service.horas).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Custo Total do Serviço:</span>
                <span className="font-bold">R$ {(totalCustoProdutos + ((service.custo_hora || 0) * service.horas)).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
