import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, FileText, Send, Check, X, Clock, ArrowRight, Trash2, Edit } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuotes, Quote } from '@/hooks/useQuotes';
import { QuoteFormDialog } from '@/components/orcamentos/QuoteFormDialog';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: 'Rascunho', color: 'bg-muted text-muted-foreground', icon: FileText },
  enviado: { label: 'Enviado', color: 'bg-blue-500/10 text-blue-500', icon: Send },
  aprovado: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500', icon: Check },
  rejeitado: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-500', icon: X },
  expirado: { label: 'Expirado', color: 'bg-orange-500/10 text-orange-500', icon: Clock },
};

export default function OrcamentosPage() {
  const { quotes, isLoading, deleteQuote } = useQuotes();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

  const filteredQuotes = quotes.filter(q =>
    q.titulo.toLowerCase().includes(search.toLowerCase()) ||
    q.numero.toLowerCase().includes(search.toLowerCase()) ||
    q.client?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: quotes.length,
    rascunho: quotes.filter(q => q.status === 'rascunho').length,
    enviados: quotes.filter(q => q.status === 'enviado').length,
    aprovados: quotes.filter(q => q.status === 'aprovado').length,
    valorTotal: quotes.filter(q => q.status === 'aprovado').reduce((sum, q) => sum + q.valor_total, 0),
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteQuoteId) {
      await deleteQuote(deleteQuoteId);
      setDeleteQuoteId(null);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
            <p className="text-muted-foreground">Gerencie propostas e orçamentos para clientes</p>
          </div>
          <Button onClick={() => { setEditingQuote(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rascunhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.rascunho}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Enviados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.enviados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.aprovados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Aprovado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-500">{formatCurrency(stats.valorTotal)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar orçamentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Carregando...</div>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground">Nenhum orçamento encontrado</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {search ? 'Tente ajustar sua busca' : 'Crie seu primeiro orçamento'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => {
                    const status = statusConfig[quote.status];
                    const StatusIcon = status.icon;
                    const isExpired = new Date(quote.validade) < new Date() && quote.status === 'enviado';

                    return (
                      <TableRow key={quote.id}>
                        <TableCell className="font-mono text-sm">{quote.numero}</TableCell>
                        <TableCell className="font-medium">{quote.titulo}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {quote.client?.nome || '-'}
                        </TableCell>
                        <TableCell>{formatCurrency(quote.valor_total)}</TableCell>
                        <TableCell className={cn(isExpired && 'text-red-500')}>
                          {format(quote.validade, "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1', status.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(quote)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {quote.status === 'aprovado' && !quote.converted_project_id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Converter em projeto"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteQuoteId(quote.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <QuoteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        quote={editingQuote}
      />

      <AlertDialog open={!!deleteQuoteId} onOpenChange={() => setDeleteQuoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O orçamento e todos os itens serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
