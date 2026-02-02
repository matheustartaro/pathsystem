import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, User, CheckCircle2, Circle, Clock, Edit, Plus, Paperclip, MessageCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout';
import { useProjects } from '@/hooks/useProjects';
import { getStatusLabel, getStatusColor } from '@/lib/status-utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectFilesSection } from '@/components/projects/ProjectFilesSection';
import { ProjectActivitySection } from '@/components/projects/ProjectActivitySection';
import { ProjectCommentsSection } from '@/components/projects/ProjectCommentsSection';

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { getProjectById, updateProject, isLoading } = useProjects();
  const [activeTab, setActiveTab] = useState('tarefas');

  const project = id ? getProjectById(id) : null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Projeto não encontrado</h2>
          <p className="text-muted-foreground mb-4">O projeto que você está procurando não existe.</p>
          <Button asChild>
            <Link to="/projetos">Voltar para Projetos</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const toggleTask = (taskId: string) => {
    const updatedTarefas = project.tarefas.map((t) =>
      t.id === taskId ? { ...t, concluida: !t.concluida } : t
    );
    const newProgress = Math.round(
      (updatedTarefas.filter((t) => t.concluida).length / updatedTarefas.length) * 100
    );
    updateProject(project.id, { tarefas: updatedTarefas, progresso: newProgress });
  };

  const completedTasks = project.tarefas.filter((t) => t.concluida).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to="/projetos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Projetos
        </Link>

        {/* Header */}
        <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-4 h-16 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.cor }}
              />
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">{project.nome}</h1>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{project.cliente}</span>
                </div>
                <p className="mt-2 text-muted-foreground">{project.descricao}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium text-white',
                  getStatusColor(project.status)
                )}
              >
                {getStatusLabel(project.status)}
              </span>
              <Button variant="outline" size="icon">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress and Dates */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold text-card-foreground">{project.progresso}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${project.progresso}%`,
                    backgroundColor: project.cor,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Início</p>
                  <p className="font-medium text-card-foreground">
                    {format(project.dataInicio, "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="w-8 h-px bg-border" />
              <div>
                <p className="text-muted-foreground">Término</p>
                <p className="font-medium text-card-foreground">
                  {format(project.dataFim, "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="tarefas" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Tarefas</span>
            </TabsTrigger>
            <TabsTrigger value="arquivos" className="gap-2">
              <Paperclip className="w-4 h-4" />
              <span className="hidden sm:inline">Arquivos</span>
            </TabsTrigger>
            <TabsTrigger value="atividades" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Atividades</span>
            </TabsTrigger>
            <TabsTrigger value="comentarios" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Comentários</span>
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tarefas" className="mt-6">
            <div className="bg-card rounded-lg border border-border shadow-card animate-fade-in">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-card-foreground">Tarefas</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedTasks} de {project.tarefas.length} concluídas
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
              </div>

              <div className="divide-y divide-border">
                {project.tarefas.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox
                      checked={task.concluida}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="data-[state=checked]:bg-status-success data-[state=checked]:border-status-success"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'font-medium',
                          task.concluida
                            ? 'text-muted-foreground line-through'
                            : 'text-card-foreground'
                        )}
                      >
                        {task.nome}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {task.responsavel && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.responsavel}
                          </span>
                        )}
                        {task.dataInicio && task.dataFim && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(task.dataInicio, "dd MMM", { locale: ptBR })} -{' '}
                            {format(task.dataFim, "dd MMM", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.concluida ? (
                      <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="arquivos" className="mt-6">
            <ProjectFilesSection projectId={id!} />
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="atividades" className="mt-6">
            <ProjectActivitySection projectId={id!} />
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comentarios" className="mt-6">
            <ProjectCommentsSection projectId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProjectDetailPage;
