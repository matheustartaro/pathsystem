import { useState, useEffect, memo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  KeyRound, 
  LogOut, 
  Briefcase, 
  FileText, 
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  DollarSign,
  Moon,
  Sun,
  User,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClientData {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cnpj_cpf: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

interface Project {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  progresso: number;
  data_inicio: string;
  data_fim: string;
  valor: number;
}

interface Quote {
  id: string;
  numero: string;
  titulo: string;
  status: string;
  valor_total: number;
  validade: string;
  created_at: string;
}

interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  data_vencimento: string;
  data_pagamento: string | null;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  em_andamento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  producao: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  entregue: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  finalizado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  rascunho: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  enviado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  recusado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pago: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  atrasado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  producao: 'Produção',
  entregue: 'Entregue',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  pago: 'Pago',
  atrasado: 'Atrasado',
};

function ClientPortalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState<ClientData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Auto-authenticate if token in URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && !isAuthenticated) {
      handleLogin(urlToken);
    }
  }, [searchParams]);

  const handleLogin = async (tokenValue?: string) => {
    const accessToken = tokenValue || token;
    if (!accessToken.trim()) {
      toast.error('Digite o token de acesso');
      return;
    }

    setIsLoading(true);
    try {
      // Validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from('client_access_tokens')
        .select(`
          *,
          client:responsaveis(*)
        `)
        .eq('token', accessToken)
        .eq('is_active', true)
        .single();

      if (tokenError || !tokenData) {
        toast.error('Token inválido ou expirado');
        setIsLoading(false);
        return;
      }

      // Check expiration
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        toast.error('Token expirado');
        setIsLoading(false);
        return;
      }

      // Update last_used_at
      await supabase
        .from('client_access_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      const clientData = tokenData.client as unknown as ClientData;
      setClient(clientData);

      // Fetch client data
      const [projectsRes, quotesRes, transactionsRes] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('client_id', tokenData.client_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('quotes')
          .select('*')
          .eq('client_id', tokenData.client_id)
          .neq('status', 'rascunho')
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('*')
          .eq('client_id', tokenData.client_id)
          .eq('tipo', 'receita')
          .order('data_vencimento', { ascending: false }),
      ]);

      setProjects((projectsRes.data || []) as Project[]);
      setQuotes((quotesRes.data || []) as Quote[]);
      setTransactions((transactionsRes.data || []) as Transaction[]);
      setIsAuthenticated(true);
      
      // Update URL with token
      if (!searchParams.get('token')) {
        navigate(`/portal?token=${accessToken}`, { replace: true });
      }

      toast.success(`Bem-vindo, ${clientData.nome}!`);
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Erro ao acessar o portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClient(null);
    setProjects([]);
    setQuotes([]);
    setTransactions([]);
    setToken('');
    navigate('/portal', { replace: true });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTransactionStatus = (transaction: Transaction) => {
    if (transaction.status === 'pago') return 'pago';
    if (new Date(transaction.data_vencimento) < new Date()) return 'atrasado';
    return 'pendente';
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Portal do Cliente</CardTitle>
              <CardDescription className="mt-2">
                Acesse para acompanhar seus projetos, orçamentos e faturas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Digite seu token de acesso"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="text-center font-mono"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => handleLogin()}
              disabled={isLoading}
            >
              {isLoading ? 'Verificando...' : 'Acessar Portal'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Não possui um token? Entre em contato conosco.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Portal Dashboard
  const activeProjects = projects.filter(p => !['entregue', 'finalizado', 'cancelado'].includes(p.status));
  const pendingQuotes = quotes.filter(q => q.status === 'enviado');
  const pendingPayments = transactions.filter(t => getTransactionStatus(t) !== 'pago');
  const totalPending = pendingPayments.reduce((sum, t) => sum + t.valor, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{client?.nome}</p>
              <p className="text-xs text-muted-foreground">{client?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Bem-vindo ao Portal!</h1>
                <p className="text-muted-foreground mt-1">
                  Acompanhe o andamento de seus projetos e pendências
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {client?.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {client.telefone}
                  </div>
                )}
                {client?.cidade && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    {client.cidade}{client.estado ? `, ${client.estado}` : ''}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeProjects.length}</p>
                  <p className="text-xs text-muted-foreground">Projetos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingQuotes.length}</p>
                  <p className="text-xs text-muted-foreground">Orçamentos Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingPayments.length}</p>
                  <p className="text-xs text-muted-foreground">Faturas Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                  <p className="text-xs text-muted-foreground">Total em Aberto</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="projetos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="projetos" className="gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Projetos</span>
            </TabsTrigger>
            <TabsTrigger value="orcamentos" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Orçamentos</span>
            </TabsTrigger>
            <TabsTrigger value="faturas" className="gap-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Faturas</span>
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projetos" className="space-y-4">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">Nenhum projeto encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seus projetos aparecerão aqui quando iniciados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{project.nome}</h3>
                              {project.descricao && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {project.descricao}
                                </p>
                              )}
                            </div>
                            <Badge className={cn('ml-2', statusColors[project.status] || statusColors.pendente)}>
                              {statusLabels[project.status] || project.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-medium">{project.progresso}%</span>
                            </div>
                            <Progress value={project.progresso} className="h-2" />
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(new Date(project.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(project.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(project.valor)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="orcamentos" className="space-y-4">
            {quotes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">Nenhum orçamento encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seus orçamentos aparecerão aqui quando enviados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {quotes.map((quote) => (
                  <Card key={quote.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-muted-foreground">
                              #{quote.numero}
                            </span>
                            <Badge className={cn(statusColors[quote.status] || statusColors.pendente)}>
                              {statusLabels[quote.status] || quote.status}
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{quote.titulo}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Criado em {format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <span>
                              Válido até {format(new Date(quote.validade), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(quote.valor_total)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="faturas" className="space-y-4">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold">Nenhuma fatura encontrada</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Suas faturas aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {transactions.map((transaction) => {
                  const status = getTransactionStatus(transaction);
                  return (
                    <Card key={transaction.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center',
                              status === 'pago' && 'bg-green-100 dark:bg-green-900/30',
                              status === 'pendente' && 'bg-yellow-100 dark:bg-yellow-900/30',
                              status === 'atrasado' && 'bg-red-100 dark:bg-red-900/30'
                            )}>
                              {status === 'pago' && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
                              {status === 'pendente' && <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
                              {status === 'atrasado' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.descricao}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                  Vencimento: {format(new Date(transaction.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                {transaction.data_pagamento && (
                                  <span className="text-green-600">
                                    • Pago em {format(new Date(transaction.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={cn(statusColors[status])}>
                              {statusLabels[status]}
                            </Badge>
                            <p className={cn(
                              'text-xl font-bold',
                              status === 'pago' && 'text-green-600 dark:text-green-400',
                              status === 'atrasado' && 'text-red-600 dark:text-red-400'
                            )}>
                              {formatCurrency(transaction.valor)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Portal do Cliente • Acesso seguro via token</p>
        </div>
      </footer>
    </div>
  );
}

export default memo(ClientPortalPage);
