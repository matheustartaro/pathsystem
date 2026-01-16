import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, Plus, User, Pencil, Trash2,
  Package, Wrench, DollarSign, FileText, ListTodo, BarChart3, PackageMinus, Loader2
} from 'lucide-react';
import { Project, Task, ProjectStatus } from '@/types/project';
import { useStatusCategories } from '@/hooks/useStatusCategories';
import { useOrderItems } from '@/hooks/useOrderItems';
import { useProducts } from '@/hooks/useProducts';
import { useServices } from '@/hooks/useServices';
import { useStockMovements } from '@/hooks/useStockMovements';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ProjectFinanceSection } from '@/components/projects/ProjectFinanceSection';
import { toast } from 'sonner';

interface ProjectDetailDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTask?: (projectId: string) => void;
  onToggleTask?: (projectId: string, taskId: string, completed: boolean) => void;
  onEditProject?: (project: Project) => void;
  onUpdateStatus?: (projectId: string, newStatus: ProjectStatus) => void;
  onUpdateTask?: (projectId: string, task: Task) => void;
  onDeleteTask?: (projectId: string, taskId: string) => void;
}

export function ProjectDetailDialog({
  project,
  open,
  onOpenChange,
  onAddTask,
  onToggleTask,
  onEditProject,
  onUpdateStatus,
  onUpdateTask,
  onDeleteTask,
}: ProjectDetailDialogProps) {
  const { categories, getColorByStatus, getCategoryByStatus } = useStatusCategories();
  const { products } = useProducts();
  const { services } = useServices();
  
  // Local state for real-time updates
  const [localProject, setLocalProject] = useState<Project | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  const [isProcessingStock, setIsProcessingStock] = useState(false);

  // Order items for this project - use project?.id to ensure stable hook call
  const { orderItems } = useOrderItems(project?.id);
  const { processProjectStock, movements } = useStockMovements();

  // Sync local state with project prop
  useEffect(() => {
    if (project) {
      setLocalProject({ ...project });
    }
  }, [project]);

  // Order items summary - moved before early return and uses stable dependencies
  const orderSummary = useMemo(() => {
    if (!orderItems || orderItems.length === 0) {
      return {
        serviceItems: [],
        productItems: [],
        foamItems: [],
        servicesList: [],
        productsList: [],
        foamsList: [],
        total: 0,
      };
    }

    const serviceItems = orderItems.filter(i => i.item_type === 'service');
    const productItems = orderItems.filter(i => i.item_type === 'product');
    const foamItems = orderItems.filter(i => i.item_type === 'foam');
    const total = orderItems.reduce((sum, item) => sum + item.total, 0);

    // Get names for items
    const servicesList = serviceItems.map(item => {
      if (item.nome) return item.nome;
      const service = services.find(s => s.id === item.service_id);
      return service?.nome || 'Serviço';
    });

    const productsList = productItems.map(item => {
      if (item.nome) return item.nome;
      const product = products.find(p => p.id === item.product_id);
      return product?.nome || 'Produto';
    });

    const foamsList = foamItems.map(item => item.nome || 'Espuma');

    return {
      serviceItems,
      productItems,
      foamItems,
      servicesList,
      productsList,
      foamsList,
      total,
    };
  }, [orderItems, products, services]);

  // Check if stock has already been deducted for this project
  const stockAlreadyDeducted = useMemo(() => {
    return movements.some(m => m.project_id === localProject?.id);
  }, [movements, localProject?.id]);

  // Products that can be deducted (from order items)
  const productsToDeduct = useMemo(() => {
    if (!orderItems || !localProject) return [];
    return orderItems
      .filter(item => item.product_id && item.item_type === 'product')
      .map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
          id: item.product_id!,
          nome: item.nome || product?.nome || 'Produto',
          quantidade: item.quantidade,
          estoqueAtual: product?.estoque_atual || 0,
        };
      });
  }, [orderItems, products, localProject]);

  // Early return AFTER all hooks
  if (!localProject) return null;

  const statusCategory = getCategoryByStatus(localProject.status);
  
  const getDeadlineStatus = (): 'on_time' | 'delayed' | 'completed' | 'no_tag' => {
    if (localProject.status === 'concluido') return 'completed';
    // Check if this status should show delay tag based on DB setting
    if (statusCategory && statusCategory.showDelayTag === false) return 'no_tag';
    const today = new Date();
    const endDate = new Date(localProject.dataFim);
    return endDate < today ? 'delayed' : 'on_time';
  };

  const calculateProgress = (tasks: Task[]): number => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.concluida).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const deadlineStatus = getDeadlineStatus();
  const statusColor = getColorByStatus(localProject.status);

  const completedTasks = localProject.tarefas.filter(t => t.concluida).length;
  const totalTasks = localProject.tarefas.length;
  const currentProgress = calculateProgress(localProject.tarefas);

  const handleStatusChange = (newStatus: ProjectStatus) => {
    // Update local state immediately
    setLocalProject(prev => prev ? { ...prev, status: newStatus } : null);
    // Call the update handler
    onUpdateStatus?.(localProject.id, newStatus);
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    // Update local state immediately for real-time feedback
    setLocalProject(prev => {
      if (!prev) return null;
      const updatedTasks = prev.tarefas.map(t =>
        t.id === taskId ? { ...t, concluida: completed } : t
      );
      return {
        ...prev,
        tarefas: updatedTasks,
        progresso: calculateProgress(updatedTasks),
      };
    });
    // Call the external handler
    onToggleTask?.(localProject.id, taskId, completed);
  };

  const handleStartEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskName(task.nome);
  };

  const handleSaveTaskEdit = (task: Task) => {
    if (!editingTaskName.trim()) return;
    
    const updatedTask = { ...task, nome: editingTaskName };
    
    // Update local state
    setLocalProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tarefas: prev.tarefas.map(t => t.id === task.id ? updatedTask : t),
      };
    });
    
    onUpdateTask?.(localProject.id, updatedTask);
    setEditingTaskId(null);
    setEditingTaskName('');
  };

  const handleDeleteTask = (taskId: string) => {
    // Update local state
    setLocalProject(prev => {
      if (!prev) return null;
      const updatedTasks = prev.tarefas.filter(t => t.id !== taskId);
      return {
        ...prev,
        tarefas: updatedTasks,
        progresso: calculateProgress(updatedTasks),
      };
    });
    
    onDeleteTask?.(localProject.id, taskId);
  };

  const handleProcessStock = async () => {
    if (!localProject) return;
    
    setIsProcessingStock(true);
    try {
      await processProjectStock(localProject.id);
      toast.success('Baixa de estoque realizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao processar baixa de estoque');
    } finally {
      setIsProcessingStock(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-foreground truncate">
                {localProject.nome}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{localProject.cliente}</p>
            </div>
          </div>
          
          {/* Status Select - Moved below title */}
          <div className="mt-3">
            {onUpdateStatus ? (
              <Select 
                value={localProject.status} 
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.key}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div 
                className="px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-2"
                style={{ 
                  backgroundColor: `${statusColor}20`,
                  color: statusColor
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                {statusCategory?.name || localProject.status}
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="resumo" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="resumo" className="gap-1 text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="cronograma" className="gap-1 text-xs sm:text-sm">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cronograma</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1 text-xs sm:text-sm">
              <ListTodo className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Tarefas</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-1 text-xs sm:text-sm">
              <PackageMinus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="gap-1 text-xs sm:text-sm">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
          </TabsList>
          
          {/* RESUMO TAB */}
          <TabsContent value="resumo" className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Description */}
            {localProject.descricao && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground">{localProject.descricao}</p>
              </div>
            )}

            {/* Order Value */}
            <div className="bg-primary/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Valor do Pedido</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(orderSummary.total)}
                </span>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Data de Entrega</span>
              </div>
              <p className={cn(
                "text-lg font-semibold",
                deadlineStatus === 'delayed' ? 'text-destructive' : 'text-foreground'
              )}>
                {format(new Date(localProject.dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            {/* Services */}
            {orderSummary.servicesList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  Serviços ({orderSummary.serviceItems.length})
                </h4>
                <div className="space-y-1.5">
                  {orderSummary.serviceItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                      <span>{orderSummary.servicesList[idx]}</span>
                      <span className="text-muted-foreground">
                        {item.quantidade}x {formatCurrency(item.preco_unitario)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {orderSummary.productsList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  Produtos ({orderSummary.productItems.length})
                </h4>
                <div className="space-y-1.5">
                  {orderSummary.productItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                      <span>{orderSummary.productsList[idx]}</span>
                      <span className="text-muted-foreground">
                        {item.quantidade}x {formatCurrency(item.preco_unitario)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Foams */}
            {orderSummary.foamsList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-500" />
                  Espumas ({orderSummary.foamItems.length})
                </h4>
                <div className="space-y-1.5">
                  {orderSummary.foamItems.map((item, idx) => (
                    <div key={item.id} className="flex flex-col text-sm p-2 bg-muted/30 rounded">
                      <div className="flex items-center justify-between">
                        <span>{orderSummary.foamsList[idx]}</span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                      {item.metro_cubico && (
                        <span className="text-xs text-muted-foreground">
                          {item.largura}cm × {item.comprimento}cm × {item.altura}cm = {item.metro_cubico.toFixed(4)} m³
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orderItems.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum item cadastrado no pedido
              </div>
            )}
          </TabsContent>

          {/* CRONOGRAMA TAB */}
          <TabsContent value="cronograma" className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Início</span>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(localProject.dataInicio), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Prazo</span>
                </div>
                <p className={cn(
                  "text-sm font-medium",
                  deadlineStatus === 'delayed' ? 'text-destructive' : 'text-foreground'
                )}>
                  {format(new Date(localProject.dataFim), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Production Period */}
            {(localProject.producaoInicio || localProject.producaoFim) && (
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Período de Produção</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {localProject.producaoInicio 
                      ? format(new Date(localProject.producaoInicio), "dd MMM", { locale: ptBR })
                      : '-'
                    }
                  </span>
                  <span className="text-muted-foreground">até</span>
                  <span className="font-medium">
                    {localProject.producaoFim 
                      ? format(new Date(localProject.producaoFim), "dd MMM", { locale: ptBR })
                      : '-'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Delivery Period */}
            {(localProject.entregaInicio || localProject.entregaFim) && (
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Período de Entrega</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {localProject.entregaInicio 
                      ? format(new Date(localProject.entregaInicio), "dd MMM", { locale: ptBR })
                      : '-'
                    }
                  </span>
                  <span className="text-muted-foreground">até</span>
                  <span className="font-medium">
                    {localProject.entregaFim 
                      ? format(new Date(localProject.entregaFim), "dd MMM", { locale: ptBR })
                      : '-'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Status Indicator - Only show for active projects */}
            {deadlineStatus !== 'no_tag' && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {deadlineStatus === 'delayed' && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Projeto atrasado</span>
                  </>
                )}
                {deadlineStatus === 'completed' && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-success))]" />
                    <span className="text-sm font-medium text-[hsl(var(--status-success))]">Projeto concluído</span>
                  </>
                )}
                {deadlineStatus === 'on_time' && (
                  <>
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">Projeto em dia</span>
                  </>
                )}
              </div>
            )}

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">Progresso</h4>
                <span className="text-sm text-muted-foreground">{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {completedTasks} de {totalTasks} tarefas concluídas
              </p>
            </div>
          </TabsContent>

          {/* TAREFAS TAB */}
          <TabsContent value="tasks" className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground">
                Tarefas ({completedTasks}/{totalTasks})
              </h4>
              {onAddTask && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs gap-1"
                  onClick={() => onAddTask(localProject.id)}
                >
                  <Plus className="w-3 h-3" />
                  Nova
                </Button>
              )}
            </div>

            {localProject.tarefas.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhuma tarefa cadastrada
              </div>
            ) : (
              <div className="space-y-2">
                {localProject.tarefas.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <Checkbox
                      checked={task.concluida}
                      onCheckedChange={(checked) => {
                        handleToggleTask(task.id, checked as boolean);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      {editingTaskId === task.id ? (
                        <Input
                          value={editingTaskName}
                          onChange={(e) => setEditingTaskName(e.target.value)}
                          onBlur={() => handleSaveTaskEdit(task)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTaskEdit(task);
                            if (e.key === 'Escape') {
                              setEditingTaskId(null);
                              setEditingTaskName('');
                            }
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          <p className={cn(
                            "text-sm truncate",
                            task.concluida && "line-through text-muted-foreground"
                          )}>
                            {task.nome}
                          </p>
                          {task.responsavel && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <User className="w-3 h-3" />
                              <span>{task.responsavel}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Edit/Delete buttons */}
                    {editingTaskId !== task.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditTask(task);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Excluir esta tarefa?')) {
                              handleDeleteTask(task.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    
                    {task.dataFim && editingTaskId !== task.id && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(task.dataFim), "dd/MM", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ESTOQUE TAB */}
          <TabsContent value="stock" className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground">
                Baixa de Estoque
              </h4>
              {stockAlreadyDeducted && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Baixa realizada
                </span>
              )}
            </div>

            {productsToDeduct.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto no pedido</p>
                <p className="text-xs">Adicione produtos ao pedido para dar baixa no estoque</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {productsToDeduct.map((product) => (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Estoque atual: {product.estoqueAtual} un
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-destructive">
                          -{product.quantidade} un
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {!stockAlreadyDeducted && (
                  <Button 
                    onClick={handleProcessStock} 
                    disabled={isProcessingStock}
                    className="w-full gap-2"
                    variant="destructive"
                  >
                    {isProcessingStock ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PackageMinus className="w-4 h-4" />
                    )}
                    Dar Baixa no Estoque
                  </Button>
                )}

                {stockAlreadyDeducted && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Estoque já foi baixado</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      A baixa de estoque para este projeto já foi realizada anteriormente.
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* FINANCEIRO TAB */}
          <TabsContent value="finance" className="flex-1 overflow-y-auto py-4">
            <ProjectFinanceSection projectId={localProject.id} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex justify-between gap-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Fechar
          </Button>
          {onEditProject && (
            <Button onClick={() => {
              onEditProject(localProject);
              onOpenChange(false);
            }}>
              Editar Projeto
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
