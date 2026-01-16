import { Project, ProjectStatus } from '@/types/project';
import { addDays, subDays } from 'date-fns';

const today = new Date();

export const mockProjects: Project[] = [
  {
    id: '1',
    nome: 'Residência Silva',
    cliente: 'João Silva',
    descricao: 'Construção de casa térrea com 3 quartos',
    dataInicio: subDays(today, 30),
    dataFim: addDays(today, 60),
    cor: '#3b82f6',
    status: 'em_andamento',
    progresso: 45,
    tarefas: [
      { id: '1-1', nome: 'Fundação', dataInicio: subDays(today, 30), dataFim: subDays(today, 15), responsavel: 'Carlos', concluida: true },
      { id: '1-2', nome: 'Estrutura', dataInicio: subDays(today, 15), dataFim: addDays(today, 10), responsavel: 'Pedro', concluida: false },
      { id: '1-3', nome: 'Alvenaria', dataInicio: addDays(today, 10), dataFim: addDays(today, 40), responsavel: 'Marcos', concluida: false },
      { id: '1-4', nome: 'Acabamento', dataInicio: addDays(today, 40), dataFim: addDays(today, 60), responsavel: 'Ana', concluida: false },
    ],
    createdAt: subDays(today, 35),
    updatedAt: today,
  },
  {
    id: '2',
    nome: 'Reforma Comercial',
    cliente: 'Maria Santos',
    descricao: 'Reforma completa de loja no centro',
    dataInicio: subDays(today, 10),
    dataFim: addDays(today, 20),
    cor: '#22c55e',
    status: 'em_andamento',
    progresso: 30,
    tarefas: [
      { id: '2-1', nome: 'Demolição', dataInicio: subDays(today, 10), dataFim: subDays(today, 5), responsavel: 'Carlos', concluida: true },
      { id: '2-2', nome: 'Elétrica', dataInicio: subDays(today, 5), dataFim: addDays(today, 5), responsavel: 'José', concluida: false },
      { id: '2-3', nome: 'Pintura', dataInicio: addDays(today, 5), dataFim: addDays(today, 20), responsavel: 'Ana', concluida: false },
    ],
    createdAt: subDays(today, 15),
    updatedAt: today,
  },
  {
    id: '3',
    nome: 'Edifício Horizonte',
    cliente: 'Construtora ABC',
    descricao: 'Construção de edifício residencial de 8 andares',
    dataInicio: subDays(today, 90),
    dataFim: addDays(today, 180),
    cor: '#eab308',
    status: 'em_andamento',
    progresso: 25,
    tarefas: [
      { id: '3-1', nome: 'Terraplanagem', dataInicio: subDays(today, 90), dataFim: subDays(today, 75), responsavel: 'Carlos', concluida: true },
      { id: '3-2', nome: 'Fundação', dataInicio: subDays(today, 75), dataFim: subDays(today, 45), responsavel: 'Pedro', concluida: true },
      { id: '3-3', nome: 'Estrutura', dataInicio: subDays(today, 45), dataFim: addDays(today, 30), responsavel: 'Marcos', concluida: false },
      { id: '3-4', nome: 'Alvenaria', dataInicio: addDays(today, 30), dataFim: addDays(today, 90), responsavel: 'José', concluida: false },
      { id: '3-5', nome: 'Instalações', dataInicio: addDays(today, 90), dataFim: addDays(today, 150), responsavel: 'Ana', concluida: false },
      { id: '3-6', nome: 'Acabamento', dataInicio: addDays(today, 150), dataFim: addDays(today, 180), responsavel: 'Maria', concluida: false },
    ],
    createdAt: subDays(today, 100),
    updatedAt: subDays(today, 2),
  },
  {
    id: '4',
    nome: 'Ampliação Escola',
    cliente: 'Prefeitura Municipal',
    descricao: 'Construção de 4 novas salas de aula',
    dataInicio: addDays(today, 15),
    dataFim: addDays(today, 90),
    cor: '#8b5cf6',
    status: 'pendente',
    progresso: 0,
    tarefas: [
      { id: '4-1', nome: 'Projeto Executivo', dataInicio: addDays(today, 15), dataFim: addDays(today, 25), responsavel: 'Ana', concluida: false },
      { id: '4-2', nome: 'Fundação', dataInicio: addDays(today, 25), dataFim: addDays(today, 40), responsavel: 'Carlos', concluida: false },
      { id: '4-3', nome: 'Estrutura', dataInicio: addDays(today, 40), dataFim: addDays(today, 70), responsavel: 'Pedro', concluida: false },
      { id: '4-4', nome: 'Acabamento', dataInicio: addDays(today, 70), dataFim: addDays(today, 90), responsavel: 'Maria', concluida: false },
    ],
    createdAt: subDays(today, 5),
    updatedAt: subDays(today, 1),
  },
  {
    id: '5',
    nome: 'Galpão Industrial',
    cliente: 'Indústrias XYZ',
    descricao: 'Construção de galpão de 2000m²',
    dataInicio: subDays(today, 120),
    dataFim: subDays(today, 10),
    cor: '#06b6d4',
    status: 'concluido',
    progresso: 100,
    tarefas: [
      { id: '5-1', nome: 'Fundação', dataInicio: subDays(today, 120), dataFim: subDays(today, 100), responsavel: 'Carlos', concluida: true },
      { id: '5-2', nome: 'Estrutura Metálica', dataInicio: subDays(today, 100), dataFim: subDays(today, 60), responsavel: 'Pedro', concluida: true },
      { id: '5-3', nome: 'Cobertura', dataInicio: subDays(today, 60), dataFim: subDays(today, 40), responsavel: 'Marcos', concluida: true },
      { id: '5-4', nome: 'Piso Industrial', dataInicio: subDays(today, 40), dataFim: subDays(today, 10), responsavel: 'José', concluida: true },
    ],
    createdAt: subDays(today, 130),
    updatedAt: subDays(today, 10),
  },
];

export const getStatusLabel = (status: ProjectStatus): string => {
  const labels: Record<ProjectStatus, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    pausado: 'Pausado',
    concluido: 'Concluído',
  };
  return labels[status];
};

export const getStatusColor = (status: ProjectStatus): string => {
  const colors: Record<ProjectStatus, string> = {
    pendente: 'bg-status-info',
    em_andamento: 'bg-status-success',
    pausado: 'bg-status-warning',
    concluido: 'bg-muted-foreground',
  };
  return colors[status];
};
