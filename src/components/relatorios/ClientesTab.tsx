import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useProjects } from '@/hooks/useProjects';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { 
  UsersRound,
  TrendingUp,
  Layers,
  MapPin,
  UserPlus,
  Crown
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
import { format, subMonths, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
];

export function ClientesTab() {
  const { responsaveis } = useResponsaveis();
  const { projects } = useProjects();
  const { transactions } = useFinanceiro();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Filter only clients
  const clientes = useMemo(() => {
    return responsaveis.filter(r => r.tipo === 'cliente' || !r.tipo);
  }, [responsaveis]);

  // KPIs
  const clientKPIs = useMemo(() => {
    const total = clientes.length;
    const threeMonthsAgo = subMonths(new Date(), 3);
    const novos = clientes.filter(c => isAfter(new Date(c.createdAt), threeMonthsAgo)).length;

    // Clients with projects
    const comProjetos = new Set(projects.map(p => p.clientId).filter(Boolean)).size;

    // Total revenue from clients
    const receitaTotal = transactions
      .filter(t => t.tipo === 'receita' && t.status === 'pago' && t.client_id)
      .reduce((s, t) => s + t.valor, 0);

    return { total, novos, comProjetos, receitaTotal };
  }, [clientes, projects, transactions]);

  // Top clients by revenue
  const topClientsByRevenue = useMemo(() => {
    const byClient: Record<string, { nome: string; valor: number; transacoes: number }> = {};

    transactions.filter(t => t.tipo === 'receita' && t.status === 'pago' && t.client_id).forEach(t => {
      const client = responsaveis.find(r => r.id === t.client_id);
      if (client) {
        if (!byClient[client.id]) byClient[client.id] = { nome: client.nome, valor: 0, transacoes: 0 };
        byClient[client.id].valor += t.valor;
        byClient[client.id].transacoes += 1;
      }
    });

    return Object.values(byClient).sort((a, b) => b.valor - a.valor).slice(0, 8);
  }, [transactions, responsaveis]);

  // Clients by projects count
  const clientsByProjects = useMemo(() => {
    const byClient: Record<string, { nome: string; projetos: number; valor: number }> = {};

    projects.forEach(p => {
      if (p.clientId) {
        const client = responsaveis.find(r => r.id === p.clientId);
        if (client) {
          if (!byClient[client.id]) byClient[client.id] = { nome: client.nome, projetos: 0, valor: 0 };
          byClient[client.id].projetos += 1;
          byClient[client.id].valor += p.valor;
        }
      }
    });

    return Object.values(byClient).sort((a, b) => b.projetos - a.projetos).slice(0, 5);
  }, [projects, responsaveis]);

  // Clients by state
  const clientsByState = useMemo(() => {
    const byState: Record<string, { name: string; value: number }> = {};
    clientes.forEach(c => {
      const estado = c.estado || 'Não informado';
      if (!byState[estado]) byState[estado] = { name: estado, value: 0 };
      byState[estado].value += 1;
    });
    return Object.values(byState).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [clientes]);

  // Clients by origin
  const clientsByOrigin = useMemo(() => {
    const byOrigin: Record<string, { name: string; value: number }> = {};
    clientes.forEach(c => {
      const origem = c.origem || 'Não informado';
      if (!byOrigin[origem]) byOrigin[origem] = { name: origem, value: 0 };
      byOrigin[origem].value += 1;
    });
    return Object.values(byOrigin).sort((a, b) => b.value - a.value);
  }, [clientes]);

  // Recent clients
  const recentClients = useMemo(() => {
    return [...clientes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [clientes]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UsersRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Clientes</p>
                <p className="text-lg font-bold">{clientKPIs.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Novos (3 meses)</p>
                <p className="text-lg font-bold text-green-600">{clientKPIs.novos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Com Projetos</p>
                <p className="text-lg font-bold">{clientKPIs.comProjetos}</p>
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
                <p className="text-xs text-muted-foreground">Receita Total</p>
                <p className="text-lg font-bold">{formatCurrency(clientKPIs.receitaTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Top Clientes por Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClientsByRevenue.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClientsByRevenue} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                    <YAxis type="category" dataKey="nome" fontSize={10} width={100} tickLine={false} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="valor" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} name="Faturamento" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum faturamento registrado</p>
            )}
          </CardContent>
        </Card>

        {/* Clients by State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Clientes por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientsByState.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientsByState}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {clientsByState.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum cliente com estado informado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients by Projects & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients by Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Top Clientes por Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientsByProjects.length > 0 ? (
              <div className="space-y-4">
                {clientsByProjects.map((client, index) => (
                  <div key={client.nome} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-sm font-medium">{client.nome}</span>
                        <p className="text-xs text-muted-foreground">{client.projetos} projetos</p>
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

        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              Clientes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentClients.length > 0 ? (
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{client.nome}</span>
                      <p className="text-xs text-muted-foreground">{client.email || client.telefone || 'Sem contato'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clients by Origin */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clientes por Origem</CardTitle>
        </CardHeader>
        <CardContent>
          {clientsByOrigin.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientsByOrigin}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Clientes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum cliente com origem informada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
