import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Package, Wrench, DollarSign, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { toast } from 'sonner';
import { formatCurrency, formatPercent, formatMultiplier } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PrecosPage() {
  const { products, markup: produtoMarkup, isLoading: loadingProducts, updateProduct } = useProducts();
  const { services, valorHora, markup: servicoMarkup, isLoading: loadingServices, updateService } = useServices();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const activeProducts = products.filter(p => p.ativo);
  const activeServices = services.filter(s => s.ativo);

  const totalItens = activeProducts.length + activeServices.length;

  const calcularMargemProduto = (custo: number, preco: number) => {
    if (preco === 0) return 0;
    return ((preco - custo) / preco) * 100;
  };

  const handleRecalculateAll = async () => {
    setIsRecalculating(true);
    try {
      // Recalculate products
      for (const product of activeProducts) {
        const novoPreco = product.custo * produtoMarkup;
        if (novoPreco !== product.preco_venda) {
          await updateProduct({ id: product.id, preco_venda: novoPreco });
        }
      }

      // Recalculate services
      for (const service of activeServices) {
        const custoHora = service.custo_hora ?? valorHora;
        const custoTotal = service.horas * custoHora;
        const novoPreco = custoTotal * servicoMarkup;
        if (novoPreco !== service.preco_venda) {
          await updateService({ id: service.id, preco_venda: novoPreco });
        }
      }

      toast.success(`Preços recalculados com sucesso! (${activeProducts.length} produtos, ${activeServices.length} serviços)`);
    } catch (error) {
      toast.error('Erro ao recalcular preços');
    } finally {
      setIsRecalculating(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tabela de Preços</h1>
          <p className="text-muted-foreground">Visualize os preços de produtos e serviços</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Hora</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(valorHora)}</div>
              <p className="text-xs text-muted-foreground">Configurado no sistema</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Markup Padrão</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMultiplier(produtoMarkup)}</div>
              <p className="text-xs text-muted-foreground">Multiplicador de custo</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItens}</div>
              <p className="text-xs text-muted-foreground">{activeProducts.length} produtos + {activeServices.length} serviços</p>
            </CardContent>
          </Card>
        </div>

        {/* Recalculate Button */}
        <div className="flex justify-end">
          <Button 
            onClick={() => setShowConfirmDialog(true)} 
            disabled={isRecalculating || totalItens === 0}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalcular Todos os Preços
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-0">
            <Tabs defaultValue="produtos" className="w-full">
              <TabsList>
                <TabsTrigger value="produtos" className="gap-2">
                  <Package className="h-4 w-4" />
                  Produtos ({activeProducts.length})
                </TabsTrigger>
                <TabsTrigger value="servicos" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  Serviços ({activeServices.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="produtos" className="mt-4">
                {loadingProducts ? (
                  <div className="text-center py-12 text-muted-foreground">Carregando...</div>
                ) : activeProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum produto cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Custo</TableHead>
                        <TableHead className="text-center">Markup</TableHead>
                        <TableHead className="text-right">Preço Venda</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeProducts.map((product) => {
                        const markup = product.custo > 0 ? product.preco_venda / product.custo : produtoMarkup;
                        const margem = calcularMargemProduto(product.custo, product.preco_venda);
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.nome}</TableCell>
                            <TableCell className="text-right">{formatCurrency(product.custo)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{formatMultiplier(markup, 1)}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-primary">
                              {formatCurrency(product.preco_venda)}
                            </TableCell>
                            <TableCell className="text-right text-[hsl(var(--status-success))]">
                              {formatPercent(margem, 0)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              
              <TabsContent value="servicos" className="mt-4">
                {loadingServices ? (
                  <div className="text-center py-12 text-muted-foreground">Carregando...</div>
                ) : activeServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum serviço cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="text-center">Horas</TableHead>
                        <TableHead className="text-right">Custo/Hora</TableHead>
                        <TableHead className="text-right">Custo Total</TableHead>
                        <TableHead className="text-right">Preço Venda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeServices.map((service) => {
                        const custoHora = service.custo_hora ?? valorHora;
                        const custoTotal = service.horas * custoHora;
                        return (
                          <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.nome}</TableCell>
                            <TableCell className="text-center">{service.horas}h</TableCell>
                            <TableCell className="text-right">{formatCurrency(custoHora)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(custoTotal)}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">
                              {formatCurrency(service.preco_venda)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalcular todos os preços?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá atualizar os preços de venda de todos os produtos e serviços ativos 
              baseado no custo atual e no markup padrão ({produtoMarkup}x).
              <br /><br />
              <strong>{activeProducts.length}</strong> produtos e <strong>{activeServices.length}</strong> serviços serão atualizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecalculateAll} disabled={isRecalculating}>
              {isRecalculating ? 'Recalculando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
