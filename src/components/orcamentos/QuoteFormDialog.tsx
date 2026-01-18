import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuotes, Quote } from '@/hooks/useQuotes';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface QuoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: Quote | null;
}

export function QuoteFormDialog({ open, onOpenChange, quote }: QuoteFormDialogProps) {
  const { createQuote, updateQuote } = useQuotes();
  const { responsaveis } = useResponsaveis();
  const clients = responsaveis.filter(r => r.tipo === 'cliente');

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    client_id: '',
    validade: addDays(new Date(), 30),
    status: 'rascunho' as Quote['status'],
    observacoes: '',
    termos_condicoes: '',
    valor_total: 0,
    desconto_total: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (quote) {
      setFormData({
        titulo: quote.titulo,
        descricao: quote.descricao || '',
        client_id: quote.client_id || '',
        validade: new Date(quote.validade),
        status: quote.status,
        observacoes: quote.observacoes || '',
        termos_condicoes: quote.termos_condicoes || '',
        valor_total: quote.valor_total,
        desconto_total: quote.desconto_total,
      });
    } else {
      setFormData({
        titulo: '',
        descricao: '',
        client_id: '',
        validade: addDays(new Date(), 30),
        status: 'rascunho',
        observacoes: '',
        termos_condicoes: '',
        valor_total: 0,
        desconto_total: 0,
      });
    }
  }, [quote, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return;

    setIsSubmitting(true);
    try {
      if (quote) {
        await updateQuote(quote.id, formData);
      } else {
        await createQuote(formData);
      }
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quote ? 'Editar Orçamento' : 'Novo Orçamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Móveis planejados - Cozinha"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Validade</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.validade && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.validade 
                      ? format(formData.validade, "dd/MM/yyyy", { locale: ptBR })
                      : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.validade}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, validade: date }))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Quote['status'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="expirado">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total (R$)</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor_total}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_total: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição do orçamento..."
                rows={3}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações internas..."
                rows={2}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="termos_condicoes">Termos e Condições</Label>
              <Textarea
                id="termos_condicoes"
                value={formData.termos_condicoes}
                onChange={(e) => setFormData(prev => ({ ...prev, termos_condicoes: e.target.value }))}
                placeholder="Condições de pagamento, prazo de entrega, garantias..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : quote ? 'Salvar' : 'Criar Orçamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
