import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, Search, ArrowRightLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/useProducts';
import { StockMovementDialog } from '@/components/catalogo/StockMovementDialog';
import { cn } from '@/lib/utils';

interface SelectedProduct {
  id: string;
  nome: string;
  estoque_atual: number;
  unidade: string | null;
}

export default function EstoquePage() {
  const { products, isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  const activeProducts = products.filter(p => p.ativo);

  const stats = useMemo(() => {
    const totalEstoque = activeProducts.reduce((sum, p) => sum + p.estoque_atual, 0);
    const valorEstoque = activeProducts.reduce((sum, p) => sum + (p.estoque_atual * p.custo), 0);
    const estoqueBaixo = activeProducts.filter(p => p.estoque_atual > 0 && p.estoque_atual <= p.estoque_minimo).length;
    const semEstoque = activeProducts.filter(p => p.estoque_atual === 0).length;
    return { totalEstoque, valorEstoque, estoqueBaixo, semEstoque };
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    let result = activeProducts;
    
    if (filter === 'low') {
      result = result.filter(p => p.estoque_atual > 0 && p.estoque_atual <= p.estoque_minimo);
    } else if (filter === 'out') {
      result = result.filter(p => p.estoque_atual === 0);
    }
    
    if (search) {
      result = result.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
    }
    
    return result;
  }, [activeProducts, filter, search]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStockStatus = (atual: number, minimo: number) => {
    if (atual === 0) return 'out';
    if (atual <= minimo) return 'low';
    return 'ok';
  };

  const handleOpenMovement = (product: SelectedProduct) => {
    setSelectedProduct(product);
    setMovementDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">Controle de estoque dos produtos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Estoque</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEstoque}</div>
              <p className="text-xs text-muted-foreground">Unidades</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--status-success))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.valorEstoque)}</div>
              <p className="text-xs text-muted-foreground">Custo total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-warning))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(var(--status-warning))]">{stats.estoqueBaixo}</div>
              <p className="text-xs text-muted-foreground">Produtos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.semEstoque}</div>
              <p className="text-xs text-muted-foreground">Produtos</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar produtos..." 
                  className="pl-10" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="low">Baixo</TabsTrigger>
                  <TabsTrigger value="out">Sem</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product.estoque_atual, product.estoque_minimo);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.nome}</TableCell>
                        <TableCell className={cn(
                          "text-center font-semibold",
                          status === 'out' && "text-destructive",
                          status === 'low' && "text-[hsl(var(--status-warning))]"
                        )}>
                          {product.estoque_atual} {product.unidade || 'un'}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {product.estoque_minimo}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(product.custo)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(product.estoque_atual * product.custo)}
                        </TableCell>
                        <TableCell className="text-center">
                          {status === 'out' && <Badge variant="destructive">Sem estoque</Badge>}
                          {status === 'low' && <Badge className="bg-[hsl(var(--status-warning))]">Baixo</Badge>}
                          {status === 'ok' && <Badge variant="outline" className="text-[hsl(var(--status-success))]">OK</Badge>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenMovement({
                              id: product.id,
                              nome: product.nome,
                              estoque_atual: product.estoque_atual,
                              unidade: product.unidade,
                            })}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <StockMovementDialog
        open={movementDialogOpen}
        onOpenChange={setMovementDialogOpen}
        product={selectedProduct}
      />
    </AppLayout>
  );
}
