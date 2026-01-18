export type ProjectStatus = string;

export interface StatusCategory {
  id: string;
  name: string;
  color: string;
  key: string;
  order?: number;
  showDelayTag?: boolean;
}

export interface Task {
  id: string;
  nome: string;
  dataInicio?: Date;
  dataFim?: Date;
  responsavel: string;
  concluida: boolean;
}

export interface Project {
  id: string;
  nome: string;
  cliente: string;
  clientId?: string | null;
  descricao: string;
  dataInicio: Date;
  dataFim: Date;
  prazoEmDias?: number;
  producaoInicio?: Date | null;
  producaoFim?: Date | null;
  entregaInicio?: Date | null;
  entregaFim?: Date | null;
  cor: string;
  status: ProjectStatus;
  progresso: number;
  tarefas: Task[];
  responsavelId?: string | null;
  valor?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Fixed task order - order field ensures tasks stay in this order
export const DEFAULT_TASKS: (Omit<Task, 'id'> & { order: number })[] = [
  { nome: 'Pedido Retirado', responsavel: '', concluida: false, order: 1 },
  { nome: 'Compra de Materiais', responsavel: '', concluida: false, order: 2 },
  { nome: 'Início da Produção', responsavel: '', concluida: false, order: 3 },
  { nome: 'Montagem Final', responsavel: '', concluida: false, order: 4 },
  { nome: 'Entrega', responsavel: '', concluida: false, order: 5 },
];

// Fixed task order for sorting
export const TASK_ORDER: Record<string, number> = {
  'Pedido Retirado': 1,
  'Compra de Materiais': 2,
  'Início da Produção': 3,
  'Montagem Final': 4,
  'Entrega': 5,
};
