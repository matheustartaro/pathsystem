import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Clock, Edit2, Trash2, MoreHorizontal, Package, Filter, HandCoins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useServices, Service } from '@/hooks/useServices';
import { ServiceFormDialog } from '@/components/catalogo/ServiceFormDialog';
import { ServiceProductsDialog } from '@/components/catalogo/ServiceProductsDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ServicosPage() {
  const { services, categories, isLoading, deleteService, getServiceProducts } = useServices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.nome.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || 
        (statusFilter === 'ativo' ? s.ativo : !s.ativo);
      const matchesCategory = categoryFilter === 'todos' || s.category_id === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [services, search, statusFilter, categoryFilter]);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleManageProducts = (service: Service) => {
    setSelectedService(service);
    setProductsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        await deleteService(id);
        toast.success('Serviço excluído!');
      } catch {
        toast.error('Erro ao excluir serviço');
      }
    }
  };

  const handleNew = () => {
    setEditingService(null);
    setDialogOpen(true);
  };

  const activeServices = services.filter(s => s.ativo);
  const servicesWithProducts = services.filter(s => getServiceProducts(s.id).length > 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
            <p className="text-muted-foreground">
              {filteredServices.length} serviço{filteredServices.length !== 1 ? 's' : ''} encontrado{filteredServices.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <HandCoins className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
              <p className="text-xs text-muted-foreground">Cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <HandCoins className="h-4 w-4 text-[hsl(var(--status-success))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(var(--status-success))]">{activeServices.length}</div>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Produtos</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{servicesWithProducts.length}</div>
              <p className="text-xs text-muted-foreground">Vinculados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar serviços..." 
                  className="pl-10" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filtros:</span>
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos status</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                {categories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas categorias</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum serviço encontrado</p>
                <p className="text-sm">Ajuste os filtros ou clique em "Novo Serviço"</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Valor/Hora</TableHead>
                    <TableHead>Preço Final</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => {
                    const linkedProducts = getServiceProducts(service.id);
                    return (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.nome}</p>
                          {service.descricao && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {service.descricao}
                            </p>
                          )}
                          {linkedProducts.length > 0 && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              <Package className="w-3 h-3 mr-1" />
                              {linkedProducts.length} produto(s)
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{service.horas}h</TableCell>
                      <TableCell>R$ {(service.custo_hora || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">R$ {service.preco_venda.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={service.ativo ? 'default' : 'secondary'}>
                          {service.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(service)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageProducts(service)}>
                              <Package className="h-4 w-4 mr-2" />
                              Vincular Produtos
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(service.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ServiceFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        service={editingService}
      />

      <ServiceProductsDialog
        open={productsDialogOpen}
        onOpenChange={setProductsDialogOpen}
        service={selectedService}
      />
    </AppLayout>
  );
}