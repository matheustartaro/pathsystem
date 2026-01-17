import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { 
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar
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
import { format, differenceInDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
];

const STATUS_COLORS: Record<string, string> = {
  'orcamento': 'hsl(45, 93%, 47%)',
  'producao': 'hsl(199, 89%, 48%)',
  'entrega': 'hsl(262, 83%, 58%)',
  'concluido': 'hsl(142, 76%, 36%)',
  'cancelado': 'hsl(var(--destructive))',
};

export function ProjetosTab() {
  const { projects } = useProjects();
  const { transactions } = useFinanceiro();
  const { responsaveis } = useResponsaveis();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Project KPIs
  const projectKPIs = useMemo(() => {
    const now = new Date();
    const total = projects.length;
    const ativos = projects.filter(p => p.status !== 'concluido' && p.status !== 'cancelado').length;
    const concluidos = projects.filter(p => p.status === 'concluido').length;
    const atrasados = projects.filter(p => {
      const dataFim = new Date(p.dataFim);
      return p.status !== 'concluido' && p.status !== 'cancelado' && isBefore(dataFim, now);
    }).length;

    const valorTotal = projects.reduce((s, p) => s + p.valor, 0);
    const valorConcluido = projects.filter(p => p.status === 'concluido').reduce((s, p) => s + p.valor, 0);

    return { total, ativos, concluidos, atrasados, valorTotal, valorConcluido };
  }, [projects]);

  // Projects by status
  const projectsByStatus = useMemo(() => {
    const byStatus: Record<string, { name: string; value: number; color: string }> = {};
    projects.forEach(p => {
      if (!byStatus[p.status]) {
        byStatus[p.status] = { name: p.status, value: 0, color: STATUS_COLORS[p.status] || COLORS[0] };
      }
      byStatus[p.status].value += 1;
    });
    return Object.values(byStatus);
  }, [projects]);

  // Projects by client
  const projectsByClient = useMemo(() => {
    const byClient: Record<string, { nome: string; quantidade: number; valor: number }> = {};
    projects.forEach(p => {
      const client = responsaveis.find(r => r.id === p.clientId);
      const nome = client?.nome || p.cliente || 'Sem cliente';
      if (!byClient[nome]) byClient[nome] = { nome, quantidade: 0, valor: 0 };
      byClient[nome].quantidade += 1;
      byClient[nome].valor += p.valor;
    });
    return Object.values(byClient).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [projects, responsaveis]);

  // Revenue by project (from transactions)
  const revenueByProject = useMemo(() => {
    const projectRevenue: Record<string, { nome: string; receita: number; despesa: number }> = {};
    
    transactions.forEach(t => {
      if (t.project_id && t.status === 'pago') {
        const project = projects.find(p => p.id === t.project_id);
        if (project) {
          const nome = project.nome;
          if (!projectRevenue[nome]) projectRevenue[nome] = { nome, receita: 0, despesa: 0 };
          if (t.tipo === 'receita') projectRevenue[nome].receita += t.valor;
          else projectRevenue[nome].despesa += t.valor;
        }
      }
    });

    return Object.values(projectRevenue)
      .map(p => ({ ...p, lucro: p.receita - p.despesa }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 8);
  }, [transactions, projects]);

  // Recent projects
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{projectKPIs.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
                <p className="text-lg font-bold">{projectKPIs.ativos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concluídos</p>
                <p className="text-lg font-bold">{projectKPIs.concluidos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atrasados</p>
                <p className="text-lg font-bold text-destructive">{projectKPIs.atrasados}</p>
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
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold">{formatCurrency(projectKPIs.valorTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Faturado</p>
                <p className="text-lg font-bold">{formatCurrency(projectKPIs.valorConcluido)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projetos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {projectsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Project */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento por Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByProject.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByProject} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="nome" fontSize={10} width={100} tickLine={false} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="receita" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum projeto com faturamento</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Clientes por Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            {projectsByClient.length > 0 ? (
              <div className="space-y-4">
                {projectsByClient.map((client, index) => (
                  <div key={client.nome} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-sm font-medium">{client.nome}</span>
                        <p className="text-xs text-muted-foreground">{client.quantidade} projetos</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(client.valor)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum cliente com projetos</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Projetos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[180px]">{project.nome}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progresso} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-10">{project.progresso}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum projeto recente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
