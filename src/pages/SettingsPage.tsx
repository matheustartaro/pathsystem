import { useState, useRef } from 'react';
import { 
  Moon, Sun, Bell, Download, Trash2, Plus, Edit2, GripVertical, 
  Users, AlertTriangle, Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { useStatusCategories } from '@/hooks/useStatusCategories';
import { useResponsaveis, Responsavel } from '@/hooks/useResponsaveis';
import { StatusCategory } from '@/types/project';
import { ColorPalettePicker } from '@/components/ui/color-palette-picker';
import { SuppliersSection } from '@/components/database/SuppliersSection';
import { ProductCategoriesSection } from '@/components/database/ProductCategoriesSection';
import { FinancialCategoriesSection } from '@/components/database/FinancialCategoriesSection';
import { SystemSettingsSection } from '@/components/database/SystemSettingsSection';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast as sonnerToast } from 'sonner';

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories, isLoading } = useStatusCategories();
  const { responsaveis, addResponsavel, updateResponsavel, deleteResponsavel, isLoading: loadingResponsaveis } = useResponsaveis();
  
  // Status dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StatusCategory | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('hsl(220, 15%, 55%)');
  const [showDelayTag, setShowDelayTag] = useState(true);
  const [openColorPopover, setOpenColorPopover] = useState<string | null>(null);

  // Responsavel dialog state
  const [responsavelDialogOpen, setResponsavelDialogOpen] = useState(false);
  const [editingResponsavel, setEditingResponsavel] = useState<Responsavel | null>(null);
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelEmail, setResponsavelEmail] = useState('');
  const [responsavelTelefone, setResponsavelTelefone] = useState('');
  const [responsavelCargo, setResponsavelCargo] = useState('');

  const [deletingExampleData, setDeletingExampleData] = useState(false);

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      toast({
        title: 'Dados limpos',
        description: 'Todos os dados foram removidos. A página será recarregada.',
      });
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleExportData = () => {
    const data = localStorage.getItem('projetos-jm-data');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projetos-jm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Exportação concluída',
        description: 'Os dados foram exportados com sucesso.',
      });
    } else {
      toast({
        title: 'Nenhum dado encontrado',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (category?: StatusCategory) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setColor(category.color);
      setShowDelayTag(category.showDelayTag ?? true);
    } else {
      setEditingCategory(null);
      setName('');
      setColor('hsl(220, 15%, 55%)');
      setShowDelayTag(true);
    }
    setDialogOpen(true);
  };

  const handleOpenResponsavelDialog = (responsavel?: Responsavel) => {
    if (responsavel) {
      setEditingResponsavel(responsavel);
      setResponsavelNome(responsavel.nome);
      setResponsavelEmail(responsavel.email || '');
      setResponsavelTelefone(responsavel.telefone || '');
      setResponsavelCargo(responsavel.cargo || '');
    } else {
      setEditingResponsavel(null);
      setResponsavelNome('');
      setResponsavelEmail('');
      setResponsavelTelefone('');
      setResponsavelCargo('');
    }
    setResponsavelDialogOpen(true);
  };

  const generateKey = (name: string): string => {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const handleSave = () => {
    if (!name.trim()) { sonnerToast.error('Nome é obrigatório'); return; }
    const key = editingCategory ? editingCategory.key : generateKey(name);
    if (editingCategory) {
      updateCategory(editingCategory.id, { name, color, showDelayTag });
      sonnerToast.success('Status atualizado');
    } else {
      addCategory({ name, color, key, showDelayTag });
      sonnerToast.success('Status criado');
    }
    setDialogOpen(false);
  };

  const handleSaveResponsavel = async () => {
    if (!responsavelNome.trim()) { sonnerToast.error('Nome é obrigatório'); return; }
    try {
      if (editingResponsavel) {
        await updateResponsavel(editingResponsavel.id, { nome: responsavelNome, email: responsavelEmail || null, telefone: responsavelTelefone || null, cargo: responsavelCargo || null });
        sonnerToast.success('Responsável atualizado');
      } else {
        await addResponsavel({ nome: responsavelNome, email: responsavelEmail || null, telefone: responsavelTelefone || null, cargo: responsavelCargo || null, tipo: 'funcionario', cnpj_cpf: null, endereco: null, cidade: null, estado: null, cep: null, origem: null, observacoes: null });
        sonnerToast.success('Responsável criado');
      }
      setResponsavelDialogOpen(false);
    } catch { sonnerToast.error('Erro ao salvar responsável'); }
  };

  const handleDelete = (id: string) => { deleteCategory(id); sonnerToast.success('Status excluído'); };
  const handleDeleteResponsavel = async (id: string) => { try { await deleteResponsavel(id); sonnerToast.success('Responsável excluído'); } catch { sonnerToast.error('Erro ao excluir'); } };
  const handleColorChange = (categoryId: string, newColor: string) => { updateCategory(categoryId, { color: newColor }); setOpenColorPopover(null); sonnerToast.success('Cor atualizada'); };
  const handleToggleShowDelayTag = (categoryId: string, value: boolean) => { updateCategory(categoryId, { showDelayTag: value }); sonnerToast.success('Configuração atualizada'); };
  const handleDragEnd = (result: DropResult) => { if (!result.destination || result.source.index === result.destination.index) return; reorderCategories(result.source.index, result.destination.index); sonnerToast.success('Ordem atualizada'); };

  const handleDeleteExampleData = async () => {
    if (!window.confirm('Tem certeza que deseja excluir TODOS os dados de exemplo? Esta ação não pode ser desfeita.')) return;
    
    setDeletingExampleData(true);
    try {
      await supabase.from('transactions').delete().eq('observacoes', 'Dados de exemplo');
      await supabase.from('events').delete().ilike('descricao', '%Dados de exemplo%');
      await supabase.from('projects').delete().ilike('descricao', '%Dados de exemplo%');
      await supabase.from('responsaveis').delete().eq('observacoes', 'Dados de exemplo');
      await supabase.from('suppliers').delete().in('nome', ['Fornecedor ABC Ltda', 'Distribuidora XYZ', 'Materiais Premium']);
      await supabase.from('product_categories').delete().in('nome', ['Impressão Digital', 'Acabamentos', 'Materiais Gráficos', 'Design Gráfico', 'Instalação']);
      await supabase.from('financial_categories').delete().in('nome', ['Vendas', 'Serviços', 'Aluguel', 'Materiais', 'Funcionários']);
      await supabase.from('products').delete().in('nome', ['Banner Lona 440g', 'Adesivo Vinil', 'Papel Fotográfico A4', 'Placa PS 2mm', 'Ilhós Metálico']);
      await supabase.from('services').delete().in('nome', ['Criação de Logo', 'Design de Banner', 'Instalação de Adesivo', 'Diagramação']);
      await supabase.from('accounts').delete().in('nome', ['Conta Principal', 'Caixa Loja', 'Cartão Empresarial']);
      await supabase.from('status_categories').delete().in('key', ['pendente', 'em_producao', 'concluido', 'entregue', 'cancelado']);
      
      sonnerToast.success('Dados de exemplo excluídos com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao excluir dados de exemplo:', error);
      sonnerToast.error('Erro ao excluir dados de exemplo');
    } finally {
      setDeletingExampleData(false);
    }
  };

  if (isLoading || loadingResponsaveis) {
    return <AppLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configurações
            </h1>
            <p className="text-muted-foreground">Personalize o aplicativo e gerencie dados do sistema</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeleteExampleData}
            disabled={deletingExampleData}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <AlertTriangle className="w-4 h-4" />
            {deletingExampleData ? 'Excluindo...' : 'Excluir Dados de Exemplo'}
          </Button>
        </div>

        <Tabs defaultValue="aparencia" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="responsaveis">Responsáveis</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
          </TabsList>

          {/* Aparência Tab */}
          <TabsContent value="aparencia" className="space-y-4">
            <div className="max-w-2xl space-y-6">
              {/* Appearance */}
              <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
                <h3 className="font-semibold text-card-foreground mb-4">Tema</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                        <Sun className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">Modo Claro</p>
                        <p className="text-sm text-muted-foreground">Interface com fundo claro</p>
                      </div>
                    </div>
                    <Switch checked={theme === 'light'} onCheckedChange={() => setTheme('light')} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                        <Moon className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">Modo Escuro</p>
                        <p className="text-sm text-muted-foreground">Interface com fundo escuro</p>
                      </div>
                    </div>
                    <Switch checked={theme === 'dark'} onCheckedChange={() => setTheme('dark')} />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
                <h3 className="font-semibold text-card-foreground mb-4">Notificações</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <Bell className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">Lembretes de Prazo</p>
                      <p className="text-sm text-muted-foreground">Receba alertas sobre projetos próximos do vencimento</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              {/* Data Management */}
              <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
                <h3 className="font-semibold text-card-foreground mb-4">Gerenciamento de Dados</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                        <Download className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">Exportar Dados</p>
                        <p className="text-sm text-muted-foreground">Baixe uma cópia de todos os seus projetos</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleExportData}>
                      Exportar
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">Limpar Dados</p>
                        <p className="text-sm text-muted-foreground">Remove todos os projetos e configurações</p>
                      </div>
                    </div>
                    <Button variant="destructive" onClick={handleClearData}>
                      Limpar
                    </Button>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
                <h3 className="font-semibold text-card-foreground mb-4">Sobre</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-card-foreground">Versão:</span> 1.0.0</p>
                  <p><span className="font-medium text-card-foreground">Desenvolvido por:</span> JM</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="bg-card rounded-lg border border-border shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div><h2 className="text-lg font-semibold">Categorias de Status</h2><p className="text-sm text-muted-foreground">Arraste para reordenar</p></div>
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2"><Plus className="w-4 h-4" />Novo Status</Button>
              </div>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="status-categories">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                      {categories.map((cat, index) => (
                        <Draggable key={cat.id} draggableId={cat.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center justify-between p-4 bg-background rounded-lg border ${snapshot.isDragging ? 'ring-2 ring-primary' : ''}`}>
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps} className="cursor-grab"><GripVertical className="w-4 h-4" /></div>
                                <Popover open={openColorPopover === cat.id} onOpenChange={(open) => setOpenColorPopover(open ? cat.id : null)}>
                                  <PopoverTrigger asChild><button className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: cat.color }} /></PopoverTrigger>
                                  <PopoverContent className="w-80"><ColorPalettePicker selectedColor={cat.color} onColorSelect={(c) => handleColorChange(cat.id, c)} /></PopoverContent>
                                </Popover>
                                <div><p className="font-medium">{cat.name}</p><p className="text-xs text-muted-foreground">Chave: {cat.key}</p></div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2"><Label className="text-xs">Tag atraso</Label><Switch checked={cat.showDelayTag ?? true} onCheckedChange={(v) => handleToggleShowDelayTag(cat.id, v)} /></div>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(cat)}><Edit2 className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => window.confirm('Excluir?') && handleDelete(cat.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </TabsContent>

          {/* Responsáveis Tab */}
          <TabsContent value="responsaveis" className="space-y-4">
            <div className="bg-card rounded-lg border border-border shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h2 className="text-lg font-semibold">Responsáveis</h2>
                    <p className="text-sm text-muted-foreground">Cadastre pessoas para atribuir aos projetos</p>
                  </div>
                </div>
                <Button onClick={() => handleOpenResponsavelDialog()} size="sm" className="gap-2"><Plus className="w-4 h-4" />Novo</Button>
              </div>
              <div className="space-y-3">
                {responsaveis.filter(r => r.tipo === 'funcionario').map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-sm font-medium text-primary">{r.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}</span></div>
                      <div><p className="font-medium">{r.nome}</p><p className="text-xs text-muted-foreground">{r.cargo || 'Sem cargo'} {r.email && `• ${r.email}`}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenResponsavelDialog(r)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => window.confirm('Excluir?') && handleDeleteResponsavel(r.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {responsaveis.filter(r => r.tipo === 'funcionario').length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Users className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-medium text-foreground mb-1">Nenhum responsável</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Cadastre responsáveis para atribuir aos projetos
                    </p>
                    <Button onClick={() => handleOpenResponsavelDialog()} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Responsável
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Categorias Tab */}
          <TabsContent value="categorias" className="space-y-4">
            <ProductCategoriesSection />
            <FinancialCategoriesSection />
          </TabsContent>

          {/* Fornecedores Tab */}
          <TabsContent value="fornecedores"><SuppliersSection /></TabsContent>

          {/* Sistema Tab */}
          <TabsContent value="sistema"><SystemSettingsSection /></TabsContent>
        </Tabs>

        {/* Status Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>{editingCategory ? 'Editar Status' : 'Novo Status'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Em Análise" />{!editingCategory && name && <p className="text-xs text-muted-foreground">Chave: {generateKey(name)}</p>}</div>
              <div className="space-y-2"><Label>Cor</Label><ColorPalettePicker selectedColor={color} onColorSelect={setColor} /></div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><div><Label>Exibir tag de atraso</Label><p className="text-xs text-muted-foreground">Mostrar indicador quando projeto atrasar</p></div><Switch checked={showDelayTag} onCheckedChange={setShowDelayTag} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSave}>{editingCategory ? 'Salvar' : 'Criar'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Responsavel Dialog */}
        <Dialog open={responsavelDialogOpen} onOpenChange={setResponsavelDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>{editingResponsavel ? 'Editar Responsável' : 'Novo Responsável'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} placeholder="Ex: João Silva" /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={responsavelEmail} onChange={(e) => setResponsavelEmail(e.target.value)} placeholder="joao@empresa.com" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={responsavelTelefone} onChange={(e) => setResponsavelTelefone(e.target.value)} placeholder="(11) 99999-9999" /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input value={responsavelCargo} onChange={(e) => setResponsavelCargo(e.target.value)} placeholder="Ex: Designer" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setResponsavelDialogOpen(false)}>Cancelar</Button><Button onClick={handleSaveResponsavel}>{editingResponsavel ? 'Salvar' : 'Criar'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;