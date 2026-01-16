import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Task } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projectDates?: { dataInicio: Date; dataFim: Date };
  onSave: (data: Omit<Task, 'id'> | Task) => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  projectDates,
  onSave,
}: TaskFormDialogProps) {
  const [nome, setNome] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [concluida, setConcluida] = useState(false);
  const [useDates, setUseDates] = useState(false);
  const [useSingleDate, setUseSingleDate] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setNome(task.nome);
      setResponsavel(task.responsavel);
      setConcluida(task.concluida);
      setUseDates(!!(task.dataInicio || task.dataFim));
      const isSingleDate = task.dataInicio && task.dataFim && 
        new Date(task.dataInicio).toDateString() === new Date(task.dataFim).toDateString();
      setUseSingleDate(!!isSingleDate);
      setDataInicio(task.dataInicio ? new Date(task.dataInicio) : undefined);
      setDataFim(task.dataFim ? new Date(task.dataFim) : undefined);
    } else {
      setNome('');
      setResponsavel('');
      setConcluida(false);
      setUseDates(false);
      setUseSingleDate(false);
      setDataInicio(undefined);
      setDataFim(undefined);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    // If single date, use same date for start and end
    const finalDataFim = useSingleDate ? dataInicio : dataFim;

    const taskData = {
      nome,
      responsavel,
      concluida,
      dataInicio: useDates ? dataInicio : undefined,
      dataFim: useDates ? finalDataFim : undefined,
    };

    if (isEditing && task) {
      onSave({ ...taskData, id: task.id });
    } else {
      onSave(taskData as Omit<Task, 'id'>);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Tarefa *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fundação"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Ex: João"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useDates"
              checked={useDates}
              onCheckedChange={(checked) => setUseDates(!!checked)}
            />
            <Label htmlFor="useDates" className="text-sm font-normal cursor-pointer">
              Definir datas para esta tarefa
            </Label>
          </div>

          {useDates && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useSingleDate"
                checked={useSingleDate}
                onCheckedChange={(checked) => setUseSingleDate(!!checked)}
              />
              <Label htmlFor="useSingleDate" className="text-sm font-normal cursor-pointer">
                Usar apenas 1 dia (sem período)
              </Label>
            </div>
          )}

          {useDates && (
            <div className={cn("grid gap-4", useSingleDate ? "grid-cols-1" : "grid-cols-2")}>
              <div className="space-y-2">
                <Label>{useSingleDate ? 'Data' : 'Data de Início'}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dataInicio && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, 'dd/MM/yy') : (useSingleDate ? 'Selecione' : 'Início')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataInicio}
                      onSelect={setDataInicio}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!useSingleDate && (
                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dataFim && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFim ? format(dataFim, 'dd/MM/yy') : 'Término'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataFim}
                        onSelect={setDataFim}
                        locale={ptBR}
                        initialFocus
                        disabled={(date) => dataInicio ? date < dataInicio : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="concluida"
              checked={concluida}
              onCheckedChange={(checked) => setConcluida(!!checked)}
            />
            <Label htmlFor="concluida" className="text-sm font-normal cursor-pointer">
              Tarefa concluída
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar' : 'Adicionar Tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
