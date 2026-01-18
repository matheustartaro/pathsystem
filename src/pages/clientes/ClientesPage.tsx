import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Search, UserCheck, Pencil, Trash2, Phone, Mail, MapPin, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useResponsaveis, Responsavel } from '@/hooks/useResponsaveis';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MaskedInput } from '@/components/ui/masked-input';
import { PaginationControls, usePagination } from '@/components/ui/pagination-controls';

const ORIGENS = ['Instagram', 'Facebook', 'Google', 'Indicação', 'WhatsApp', 'Outro'];

export default function ClientesPage() {
  const { clientes, isLoading, addResponsavel, updateResponsavel, deleteResponsavel } = useResponsaveis();
  const [search, setSearch] = useState('');
  const [origemFilter, setOrigemFilter] = useState<string>('todos');
  const [cidadeFilter, setCidadeFilter] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Responsavel | null>(null);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj_cpf: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    origem: '',
    observacoes: '',
  });

  // Validation state
  const [validationState, setValidationState] = useState({
    cnpj_cpf: true,
    telefone: true,
    email: true,
    cep: true,
  });

  // Get unique cities for filter
  const cidades = useMemo(() => {
    const uniqueCidades = new Set(clientes.map(c => c.cidade).filter(Boolean));
    return Array.from(uniqueCidades).sort();
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.telefone?.includes(search);
      const matchesOrigem = origemFilter === 'todos' || c.origem === origemFilter;
      const matchesCidade = cidadeFilter === 'todos' || c.cidade === cidadeFilter;
      return matchesSearch && matchesOrigem && matchesCidade;
    });
  }, [clientes, search, origemFilter, cidadeFilter]);

  // Pagination
  const pagination = usePagination(filteredClientes, 25);

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleOpenDialog = (client?: Responsavel) => {
    setValidationState({ cnpj_cpf: true, telefone: true, email: true, cep: true });
    if (client) {
      setEditingClient(client);
      setFormData({
        nome: client.nome,
        email: client.email || '',
        telefone: client.telefone || '',
        cnpj_cpf: client.cnpj_cpf || '',
        endereco: client.endereco || '',
        cidade: client.cidade || '',
        estado: client.estado || '',
        cep: client.cep || '',
        origem: client.origem || '',
        observacoes: client.observacoes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cnpj_cpf: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        origem: '',
        observacoes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingClient) {
        await updateResponsavel(editingClient.id, { 
          ...formData, 
          tipo: 'cliente',
          cargo: editingClient.cargo,
        });
        toast.success('Cliente atualizado!');
      } else {
        await addResponsavel({ 
          ...formData, 
          tipo: 'cliente', 
          cargo: null,
        });
        toast.success('Cliente cadastrado!');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteResponsavel(id);
        toast.success('Cliente excluído!');
      } catch (error) {
        toast.error('Erro ao excluir cliente');
      }
    }
  };

  // Stats by origem
  const origemStats = useMemo(() => {
    const stats: Record<string, number> = {};
    clientes.forEach(c => {
      if (c.origem) {
        stats[c.origem] = (stats[c.origem] || 0) + 1;
      }
    });
    return stats;
  }, [clientes]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">
              {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} encontrado{filteredClientes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientes.length}</div>
              <p className="text-xs text-muted-foreground">Cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Origem</CardTitle>
              <UserCheck className="h-4 w-4 text-[hsl(var(--status-success))]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(var(--status-success))]">
                {clientes.filter(c => c.origem).length}
              </div>
              <p className="text-xs text-muted-foreground">Rastreados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Origem</CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {Object.entries(origemStats).slice(0, 4).map(([origem, count]) => (
                  <Badge key={origem} variant="secondary" className="text-xs">
                    {origem}: {count}
                  </Badge>
                ))}
                {Object.keys(origemStats).length === 0 && (
                  <span className="text-xs text-muted-foreground">Nenhuma origem</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome, email ou telefone..." 
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
                <Select value={origemFilter} onValueChange={setOrigemFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas origens</SelectItem>
                    {ORIGENS.map(origem => (
                      <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cidades.length > 0 && (
                  <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas cidades</SelectItem>
                      {cidades.map(cidade => (
                        <SelectItem key={cidade} value={cidade!}>{cidade}</SelectItem>
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
            ) : filteredClientes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente encontrado</p>
                <p className="text-sm">Ajuste os filtros ou clique em "Novo Cliente"</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.paginatedItems.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell className="font-medium">{cliente.nome}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {cliente.email && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" /> {cliente.email}
                                </span>
                              )}
                              {cliente.telefone && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" /> {cliente.telefone}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{cliente.cidade || '-'}</TableCell>
                          <TableCell>
                            {cliente.origem ? (
                              <Badge variant="outline">{cliente.origem}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(cliente)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(cliente.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.itemsPerPage}
                    onPageChange={pagination.onPageChange}
                    onItemsPerPageChange={pagination.onItemsPerPageChange}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <MaskedInput
                  mask="cpf_cnpj"
                  value={formData.cnpj_cpf}
                  onChange={(value, isValid) => {
                    setFormData({ ...formData, cnpj_cpf: value });
                    setValidationState(prev => ({ ...prev, cnpj_cpf: isValid }));
                  }}
                />
                {!validationState.cnpj_cpf && formData.cnpj_cpf && (
                  <p className="text-xs text-destructive">CPF/CNPJ inválido</p>
                )}
              </div>
            </div>
              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <Input
                  value={formData.cnpj_cpf}
                  onChange={(e) => setFormData({ ...formData, cnpj_cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <MaskedInput
                  mask="email"
                  value={formData.email}
                  onChange={(value, isValid) => {
                    setFormData({ ...formData, email: value });
                    setValidationState(prev => ({ ...prev, email: isValid }));
                  }}
                />
                {!validationState.email && formData.email && (
                  <p className="text-xs text-destructive">Email inválido</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <MaskedInput
                  mask="phone"
                  value={formData.telefone}
                  onChange={(value, isValid) => {
                    setFormData({ ...formData, telefone: value });
                    setValidationState(prev => ({ ...prev, telefone: isValid }));
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <MaskedInput
                  mask="cep"
                  value={formData.cep}
                  onChange={(value, isValid) => {
                    setFormData({ ...formData, cep: value });
                    setValidationState(prev => ({ ...prev, cep: isValid }));
                  }}
                  onBlur={handleCepBlur}
                  disabled={isFetchingCep}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                  disabled={isFetchingCep}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                  disabled={isFetchingCep}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                  disabled={isFetchingCep}
                />
              </div>
              <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, número, bairro"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                value={formData.origem}
                onValueChange={(value) => setFormData({ ...formData, origem: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Como conheceu?" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS.map(origem => (
                    <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Anotações sobre o cliente..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingClient ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}