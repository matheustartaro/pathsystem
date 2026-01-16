import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Event } from '@/hooks/useEvents';
import { useProjects } from '@/hooks/useProjects';
import { useResponsaveis } from '@/hooks/useResponsaveis';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  initialDate?: Date;
  onSave: (data: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
];

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  initialDate,
  onSave,
  onDelete,
}: EventFormDialogProps) {
  const { projects } = useProjects();
  const { responsaveis } = useResponsaveis();
  const clients = responsaveis.filter(r => r.tipo === 'cliente');

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [horaFim, setHoraFim] = useState('10:00');
  const [diaTodo, setDiaTodo] = useState(false);
  const [cor, setCor] = useState('#6366f1');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!event;

  useEffect(() => {
    if (event) {
      setTitulo(event.titulo);
      setDescricao(event.descricao || '');
      const start = new Date(event.data_inicio);
      setDataInicio(start);
      setHoraInicio(format(start, 'HH:mm'));
      if (event.data_fim) {
        const end = new Date(event.data_fim);
        setDataFim(end);
        setHoraFim(format(end, 'HH:mm'));
      } else {
        setDataFim(null);
        setHoraFim('10:00');
      }
      setDiaTodo(event.dia_todo);
      setCor(event.cor);
      setProjectId(event.project_id);
      setClientId(event.client_id);
    } else {
      setTitulo('');
      setDescricao('');
      setDataInicio(initialDate || new Date());
      setHoraInicio('09:00');
      setDataFim(null);
      setHoraFim('10:00');
      setDiaTodo(false);
      setCor('#6366f1');
      setProjectId(null);
      setClientId(null);
    }
  }, [event, open, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startDate = new Date(dataInicio);
      if (!diaTodo) {
        const [h, m] = horaInicio.split(':');
        startDate.setHours(parseInt(h), parseInt(m), 0, 0);
      } else {
        startDate.setHours(0, 0, 0, 0);
      }

      let endDate: string | null = null;
      if (dataFim && !diaTodo) {
        const end = new Date(dataFim);
        const [h, m] = horaFim.split(':');
        end.setHours(parseInt(h), parseInt(m), 0, 0);
        endDate = end.toISOString();
      }

      await onSave({
        titulo,
        descricao: descricao || null,
        data_inicio: startDate.toISOString(),
        data_fim: endDate,
        dia_todo: diaTodo,
        cor,
        project_id: projectId,
        client_id: clientId,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(event.id);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião com cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes do evento..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="diaTodo" className="cursor-pointer">Dia inteiro</Label>
            <Switch id="diaTodo" checked={diaTodo} onCheckedChange={setDiaTodo} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataInicio, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(d) => d && setDataInicio(d)}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {!diaTodo && (
              <div className="space-y-2">
                <Label>Hora Início</Label>
                <Input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>
            )}
          </div>

          {!diaTodo && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, 'dd/MM/yyyy') : 'Opcional'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataFim || undefined}
                      onSelect={setDataFim}
                      locale={ptBR}
                      initialFocus
                      disabled={(date) => date < dataInicio}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Hora Fim</Label>
                <Input
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    cor === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setCor(c)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientId || "none"} onValueChange={(v) => setClientId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
