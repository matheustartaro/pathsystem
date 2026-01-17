import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useOrderItems } from '@/hooks/useOrderItems';
import { 
  BoxIcon,
  HandCoins,
  AlertTriangle,
  TrendingUp,
  Package,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(339, 90%, 51%)',
  'hsl(25, 95%, 53%)',
];

export function CatalogoTab() {
  const { products, categories: productCategories } = useProducts();
  const { services, categories: serviceCategories } = useServices();
  const { orderItems } = useOrderItems();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // KPIs
  const catalogKPIs = useMemo(() => {
    const produtosAtivos = products.filter(p => p.ativo).length;
    const produtosInativos = products.filter(p => !p.ativo).length;
    const servicosAtivos = services.filter(s => s.ativo).length;
    const servicosInativos = services.filter(s => !s.ativo).length;
    const estoqueBaixo = products.filter(p => p.estoque_atual <= p.estoque_minimo).length;
    const valorEstoque = products.reduce((s, p) => s + (p.estoque_atual * p.custo), 0);

    return { produtosAtivos, produtosInativos, servicosAtivos, servicosInativos, estoqueBaixo, valorEstoque };
  }, [products, services]);

  // Top products by usage
  const topProducts = useMemo(() => {
    const usage: Record<string, { nome: string; quantidade: number; valor: number }> = {};

    orderItems.forEach(item => {
      if (item.item_type === 'product' || item.item_type === 'foam') {
        const product = products.find(p => p.id === item.product_id);
        const nome = item.nome || product?.nome || 'Produto';
        if (!usage[nome]) usage[nome] = { nome, quantidade: 0, valor: 0 };
        usage[nome].quantidade += item.quantidade;
        usage[nome].valor += item.total;
      }
    });

    return Object.values(usage).sort((a, b) => b.quantidade - a.quantidade).slice(0, 8);
  }, [orderItems, products]);

  // Top services by usage
  const topServices = useMemo(() => {
    const usage: Record<string, { nome: string; quantidade: number; valor: number }> = {};

    orderItems.forEach(item => {
      if (item.item_type === 'service') {
        const service = services.find(s => s.id === item.service_id);
        const nome = item.nome || service?.nome || 'Serviço';
        if (!usage[nome]) usage[nome] = { nome, quantidade: 0, valor: 0 };
        usage[nome].quantidade += item.quantidade;
        usage[nome].valor += item.total;
      }
    });

    return Object.values(usage).sort((a, b) => b.valor - a.valor).slice(0, 8);
  }, [orderItems, services]);

  // Products by category
  const productsByCategory = useMemo(() => {
    const byCategory: Record<string, { name: string; value: number }> = {};
    products.forEach(p => {
      const category = productCategories.find(c => c.id === p.category_id);
      const nome = category?.nome || 'Sem categoria';
      if (!byCategory[nome]) byCategory[nome] = { name: nome, value: 0 };
      byCategory[nome].value += 1;
    });
    return Object.values(byCategory);
  }, [products, productCategories]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.estoque_atual <= p.estoque_minimo)
      .sort((a, b) => a.estoque_atual - b.estoque_atual)
      .slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BoxIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produtos Ativos</p>
                <p className="text-lg font-bold">{catalogKPIs.produtosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <BoxIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produtos Inativos</p>
                <p className="text-lg font-bold text-muted-foreground">{catalogKPIs.produtosInativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <HandCoins className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Serviços Ativos</p>
                <p className="text-lg font-bold">{catalogKPIs.servicosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <HandCoins className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Serviços Inativos</p>
                <p className="text-lg font-bold text-muted-foreground">{catalogKPIs.servicosInativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${catalogKPIs.estoqueBaixo > 0 ? 'bg-destructive/10' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <AlertTriangle className={`h-5 w-5 ${catalogKPIs.estoqueBaixo > 0 ? 'text-destructive' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                <p className={`text-lg font-bold ${catalogKPIs.estoqueBaixo > 0 ? 'text-destructive' : ''}`}>{catalogKPIs.estoqueBaixo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Estoque</p>
                <p className="text-lg font-bold">{formatCurrency(catalogKPIs.valorEstoque)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {productsByCategory.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {productsByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado</p>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis type="category" dataKey="nome" fontSize={10} width={100} tickLine={false} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [name === 'quantidade' ? value : formatCurrency(value), name === 'quantidade' ? 'Qtd' : 'Valor']}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum produto vendido</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Services & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-purple-600" />
              Serviços Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length > 0 ? (
              <div className="space-y-3">
                {topServices.map((service, index) => (
                  <div key={service.nome} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-sm font-medium truncate max-w-[150px] block">{service.nome}</span>
                        <span className="text-xs text-muted-foreground">{service.quantidade} vendas</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(service.valor)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum serviço vendido</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5 text-destructive" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium truncate max-w-[180px]">{product.nome}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-destructive">{product.estoque_atual}</span>
                      <span className="text-xs text-muted-foreground"> / {product.estoque_minimo}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum produto com estoque baixo</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
