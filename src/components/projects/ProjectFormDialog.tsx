import { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon, FileText, Calendar as CalendarIconLucide, Plus, Loader2 } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { useStatusCategories } from '@/hooks/useStatusCategories';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { OrderItemsSection, OrderItemInput } from './OrderItemsSection';
import { ClientFormDialog } from './ClientFormDialog';
import { toast } from 'sonner';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tarefas'> | Partial<Project>, orderItems?: OrderItemInput[]) => void;
  initialOrderItems?: OrderItemInput[];
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSave,
  initialOrderItems = [],
}: ProjectFormDialogProps) {
  const { categories } = useStatusCategories();
  const { responsaveis, addResponsavel } = useResponsaveis();
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([]);
  const [activeTab, setActiveTab] = useState('dados');
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  
  // Memoize filtered lists to prevent infinite loops
  const clientes = useMemo(
    () => responsaveis.filter(r => r.tipo === 'cliente'),
    [responsaveis]
  );
  
  const funcionarios = useMemo(
    () => responsaveis.filter(r => r.tipo === 'funcionario'),
    [responsaveis]
  );
  
  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast.error('Digite o nome do cliente');
      return;
    }
    
    setIsCreatingClient(true);
    try {
      const newClient = await addResponsavel({
        nome: newClientName.trim(),
        tipo: 'cliente',
      });
      setClienteId(newClient.id);
      setClienteNome(newClient.nome);
      setNewClientName('');
      setIsAddingClient(false);
      toast.success('Cliente cadastrado!');
    } catch (error) {
      toast.error('Erro ao cadastrar cliente');
    } finally {
      setIsCreatingClient(false);
    }
  };
  
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(new Date());
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date());
  const [usePrazoDias, setUsePrazoDias] = useState(true);
  const [prazoDias, setPrazoDias] = useState(30);
  
  // These fields are only shown when editing
  const [producaoInicio, setProducaoInicio] = useState<Date | undefined>(undefined);
  const [producaoFim, setProducaoFim] = useState<Date | undefined>(undefined);
  const [entregaData, setEntregaData] = useState<Date | undefined>(undefined);
  const [useEntregaPeriodo, setUseEntregaPeriodo] = useState(false);
  const [entregaInicio, setEntregaInicio] = useState<Date | undefined>(undefined);
  const [entregaFim, setEntregaFim] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<ProjectStatus>('pendente');
  const [progresso, setProgresso] = useState(0);
  const [responsavelId, setResponsavelId] = useState<string | null>(null);

  const isEditing = !!project;

  // Get color from status category
  const getColorByStatus = (s: ProjectStatus): string => {
    const category = categories.find(c => c.key === s);
    return category?.color || 'hsl(220, 15%, 55%)';
  };

  useEffect(() => {
    if (open) {
      setActiveTab('dados');
    }
  }, [open]);

  // Only run when modal opens/closes or project changes - not on every clientes change
  useEffect(() => {
    if (!open) return;
    
    if (project) {
      setNome(project.nome);
      // Find client - use responsaveis directly from the hook
      const foundClient = responsaveis.find(r => r.tipo === 'cliente' && r.nome === project.cliente);
      if (foundClient) {
        setClienteId(foundClient.id);
        setClienteNome(foundClient.nome);
      } else {
        setClienteId(null);
        setClienteNome(project.cliente);
      }
      setDescricao(project.descricao);
      setDataInicio(new Date(project.dataInicio));
      setDataFim(new Date(project.dataFim));
      setUsePrazoDias(!!project.prazoEmDias);
      setPrazoDias(project.prazoEmDias || 30);
      setProducaoInicio(project.producaoInicio ? new Date(project.producaoInicio) : undefined);
      setProducaoFim(project.producaoFim ? new Date(project.producaoFim) : undefined);
      // Check if we have a period (both dates) or single date
      if (project.entregaInicio && project.entregaFim) {
        setUseEntregaPeriodo(true);
        setEntregaInicio(new Date(project.entregaInicio));
        setEntregaFim(new Date(project.entregaFim));
        setEntregaData(undefined);
      } else if (project.entregaInicio) {
        setUseEntregaPeriodo(false);
        setEntregaData(new Date(project.entregaInicio));
        setEntregaInicio(undefined);
        setEntregaFim(undefined);
      } else {
        setUseEntregaPeriodo(false);
        setEntregaData(undefined);
        setEntregaInicio(undefined);
        setEntregaFim(undefined);
      }
      setStatus(project.status);
      setProgresso(project.progresso);
      setResponsavelId(project.responsavelId || null);
      setOrderItems(initialOrderItems);
    } else {
      // Reset to defaults for new project
      setNome('');
      setClienteId(null);
      setClienteNome('');
      setDescricao('');
      setDataInicio(new Date());
      setDataFim(addDays(new Date(), 30));
      setUsePrazoDias(true);
      setPrazoDias(30);
      setProducaoInicio(undefined);
      setProducaoFim(undefined);
      setUseEntregaPeriodo(false);
      setEntregaData(undefined);
      setEntregaInicio(undefined);
      setEntregaFim(undefined);
      setStatus('pendente');
      setProgresso(0);
      setResponsavelId(null);
      setOrderItems([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, open]);

  // Calculate end date when using prazo em dias
  useEffect(() => {
    if (usePrazoDias && dataInicio && prazoDias > 0) {
      setDataFim(addDays(dataInicio, prazoDias));
    }
  }, [usePrazoDias, dataInicio, prazoDias]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clienteId ? clientes.find(c => c.id === clienteId)?.nome || clienteNome : clienteNome;
    if (!nome || !cliente || !dataInicio || !dataFim) return;

    const cor = getColorByStatus(status);

    if (isEditing) {
      // Determine entrega dates based on mode
      const finalEntregaInicio = useEntregaPeriodo ? entregaInicio : entregaData;
      const finalEntregaFim = useEntregaPeriodo ? entregaFim : null;

      onSave({
        id: project.id,
        nome,
        cliente,
        descricao,
        dataInicio,
        dataFim,
        prazoEmDias: usePrazoDias ? prazoDias : undefined,
        producaoInicio: producaoInicio || null,
        producaoFim: producaoFim || null,
        entregaInicio: finalEntregaInicio || null,
        entregaFim: finalEntregaFim || null,
        cor,
        status,
        progresso,
        responsavelId,
      }, orderItems);
    } else {
      // For new projects, send essential fields + order items
      onSave({
        nome,
        cliente,
        descricao,
        dataInicio,
        dataFim,
        prazoEmDias: usePrazoDias ? prazoDias : undefined,
        producaoInicio: null,
        producaoFim: null,
        entregaInicio: null,
        entregaFim: null,
        cor,
        status: 'pendente',
        progresso: 0,
        responsavelId: null,
      }, orderItems);
    }
    onOpenChange(false);
  };

  // Render the basic project data form
  const renderDadosSection = () => (
    <div className="space-y-5">
      {/* Nome do Projeto */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Projeto *</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Banner Fachada Loja"
          required
        />
      </div>

      {/* Cliente */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Cliente *</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={() => setClientDialogOpen(true)}
          >
            <Plus className="w-3 h-3" />
            Novo Cliente
          </Button>
        </div>
        
        <Select 
          value={clienteId || "manual"} 
          onValueChange={(v) => {
            if (v === "manual") {
              setClienteId(null);
            } else {
              const selected = clientes.find(c => c.id === v);
              setClienteId(v);
              setClienteNome(selected?.nome || '');
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecionar cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Digitar manualmente</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!clienteId && (
          <Input
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            placeholder="Nome do cliente"
            required={!clienteId}
          />
        )}

        <ClientFormDialog
          open={clientDialogOpen}
          onOpenChange={setClientDialogOpen}
          onSuccess={(newClient) => {
            setClienteId(newClient.id);
            setClienteNome(newClient.nome);
          }}
        />
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva brevemente o projeto..."
          rows={3}
        />
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dataInicio && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataInicio ? format(dataInicio, 'dd/MM/yyyy') : 'Selecionar'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataInicio}
                onSelect={setDataInicio}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{usePrazoDias ? 'Prazo (dias)' : 'Término *'}</Label>
            <div className="flex items-center gap-1">
              <Label htmlFor="usePrazoDias" className="text-xs text-muted-foreground cursor-pointer">
                dias
              </Label>
              <Switch
                id="usePrazoDias"
                checked={usePrazoDias}
                onCheckedChange={setUsePrazoDias}
                className="scale-75"
              />
            </div>
          </div>
          {usePrazoDias ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={prazoDias}
                onChange={(e) => setPrazoDias(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                = {dataFim ? format(dataFim, 'dd/MM') : '-'}
              </span>
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dataFim && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, 'dd/MM/yyyy') : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={setDataFim}
                  locale={ptBR}
                  initialFocus
                  disabled={(date) => dataInicio ? date < dataInicio : false}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Status e Progresso - Only when editing */}
      {isEditing && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.key}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progresso">Progresso (%)</Label>
            <Input
              id="progresso"
              type="number"
              min={0}
              max={100}
              value={progresso}
              onChange={(e) => setProgresso(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {/* Responsável - Only when editing */}
      {isEditing && (
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select 
            value={responsavelId || "none"} 
            onValueChange={(v) => setResponsavelId(v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {funcionarios.map((resp) => (
                <SelectItem key={resp.id} value={resp.id}>
                  {resp.nome} {resp.cargo && <span className="text-muted-foreground">• {resp.cargo}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Order Items Section */}
      <OrderItemsSection items={orderItems} onChange={setOrderItems} />
    </div>
  );

  // Render the schedule section (only for editing)
  const renderCronogramaSection = () => (
    <div className="space-y-6">
      {/* Produção */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <Label className="font-medium text-base">Produção</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Data Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn('w-full justify-start text-left font-normal', !producaoInicio && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {producaoInicio ? format(producaoInicio, 'dd/MM/yyyy') : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={producaoInicio} onSelect={setProducaoInicio} locale={ptBR} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Data Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn('w-full justify-start text-left font-normal', !producaoFim && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {producaoFim ? format(producaoFim, 'dd/MM/yyyy') : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={producaoFim} onSelect={setProducaoFim} locale={ptBR} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Entrega */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center justify-between">
          <Label className="font-medium text-base">Entrega</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="useEntregaPeriodo" className="text-xs text-muted-foreground cursor-pointer">
              Usar período
            </Label>
            <Switch
              id="useEntregaPeriodo"
              checked={useEntregaPeriodo}
              onCheckedChange={(checked) => {
                setUseEntregaPeriodo(checked);
                if (!checked && entregaInicio) {
                  setEntregaData(entregaInicio);
                } else if (checked && entregaData) {
                  setEntregaInicio(entregaData);
                }
              }}
              className="scale-75"
            />
          </div>
        </div>
        
        {useEntregaPeriodo ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn('w-full justify-start text-left font-normal', !entregaInicio && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entregaInicio ? format(entregaInicio, 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={entregaInicio} onSelect={setEntregaInicio} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn('w-full justify-start text-left font-normal', !entregaFim && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entregaFim ? format(entregaFim, 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={entregaFim} onSelect={setEntregaFim} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Data da Entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn('w-full justify-start text-left font-normal', !entregaData && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {entregaData ? format(entregaData, 'dd/MM/yyyy') : 'Selecionar data de entrega'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={entregaData} onSelect={setEntregaData} locale={ptBR} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Resumo visual do cronograma */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <Label className="font-medium text-sm text-primary mb-3 block">Resumo do Cronograma</Label>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Período do Projeto:</span>
            <span className="font-medium">
              {dataInicio && dataFim 
                ? `${format(dataInicio, 'dd/MM')} - ${format(dataFim, 'dd/MM/yyyy')}`
                : '-'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Produção:</span>
            <span className="font-medium">
              {producaoInicio && producaoFim 
                ? `${format(producaoInicio, 'dd/MM')} - ${format(producaoFim, 'dd/MM')}`
                : 'Não definido'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entrega:</span>
            <span className="font-medium">
              {useEntregaPeriodo
                ? (entregaInicio && entregaFim 
                    ? `${format(entregaInicio, 'dd/MM')} - ${format(entregaFim, 'dd/MM')}`
                    : 'Não definido')
                : (entregaData 
                    ? format(entregaData, 'dd/MM/yyyy')
                    : 'Não definido')
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
          {!isEditing && (
            <DialogDescription>
              Preencha as informações básicas. O cronograma pode ser editado após a criação.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEditing ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="dados" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Dados do Projeto
                </TabsTrigger>
                <TabsTrigger value="cronograma" className="gap-2">
                  <CalendarIconLucide className="w-4 h-4" />
                  Cronograma
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="mt-0">
                {renderDadosSection()}
              </TabsContent>

              <TabsContent value="cronograma" className="mt-0">
                {renderCronogramaSection()}
              </TabsContent>
            </Tabs>
          ) : (
            renderDadosSection()
          )}

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
