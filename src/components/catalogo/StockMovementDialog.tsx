import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDownCircle, ArrowUpCircle, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStockMovements } from '@/hooks/useStockMovements';
import { toast } from 'sonner';

interface Product {
  id: string;
  nome: string;
  estoque_atual: number;
  unidade: string | null;
}

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function StockMovementDialog({ open, onOpenChange, product }: StockMovementDialogProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { movements, addMovement, isLoading } = useStockMovements(product?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !quantidade) return;

    const qty = parseInt(quantidade);
    if (qty <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    if (tipo === 'saida' && qty > product.estoque_atual) {
      toast.error('Quantidade maior que o estoque disponível');
      return;
    }

    setIsSubmitting(true);
    try {
      await addMovement({
        product_id: product.id,
        tipo,
        quantidade: qty,
        motivo: motivo || undefined,
      });
      toast.success(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso`);
      setQuantidade('');
      setMotivo('');
    } catch (error) {
      toast.error('Erro ao registrar movimentação');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Movimentação - {product.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Stock */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Estoque Atual</span>
            <span className="text-2xl font-bold">
              {product.estoque_atual} {product.unidade || 'un'}
            </span>
          </div>

          {/* Movement Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo de Movimentação</Label>
              <Tabs value={tipo} onValueChange={(v) => setTipo(v as 'entrada' | 'saida')}>
                <TabsList className="grid w-full grid-cols-2 mt-2">
                  <TabsTrigger value="entrada" className="gap-2">
                    <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--status-success))]" />
                    Entrada
                  </TabsTrigger>
                  <TabsTrigger value="saida" className="gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-destructive" />
                    Saída
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Input
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Compra, ajuste, perda..."
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar Movimentação'}
            </Button>
          </form>

          {/* Movement History */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Histórico de Movimentações</h4>
            <ScrollArea className="h-[200px] border rounded-lg">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma movimentação registrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-sm">
                          {format(new Date(mov.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {mov.tipo === 'entrada' ? (
                            <Badge className="bg-[hsl(var(--status-success))]">Entrada</Badge>
                          ) : (
                            <Badge variant="destructive">Saída</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {mov.motivo || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
