import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Responsavel {
  id: string;
  nome: string;
  tipo: string | null;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  cnpj_cpf: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  origem: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DbResponsavel {
  id: string;
  nome: string;
  tipo: string | null;
  email: string | null;
  telefone: string | null;
  cargo: string | null;
  cnpj_cpf: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  origem: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchResponsaveis(): Promise<Responsavel[]> {
  const { data, error } = await supabase
    .from('responsaveis')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;

  return (data as DbResponsavel[]).map(r => ({
    id: r.id,
    nome: r.nome,
    tipo: r.tipo,
    email: r.email,
    telefone: r.telefone,
    cargo: r.cargo,
    cnpj_cpf: r.cnpj_cpf,
    endereco: r.endereco,
    cidade: r.cidade,
    estado: r.estado,
    cep: r.cep,
    origem: r.origem,
    observacoes: r.observacoes,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  }));
}

async function addResponsavelToDb(responsavel: Partial<Omit<Responsavel, 'id' | 'createdAt' | 'updatedAt'>> & { nome: string }): Promise<Responsavel> {
  const { data, error } = await supabase
    .from('responsaveis')
    .insert({
      nome: responsavel.nome,
      tipo: responsavel.tipo,
      email: responsavel.email,
      telefone: responsavel.telefone,
      cargo: responsavel.cargo,
      cnpj_cpf: responsavel.cnpj_cpf,
      endereco: responsavel.endereco,
      cidade: responsavel.cidade,
      estado: responsavel.estado,
      cep: responsavel.cep,
      origem: responsavel.origem,
      observacoes: responsavel.observacoes,
    })
    .select()
    .single();

  if (error) throw error;

  const d = data as DbResponsavel;
  return {
    id: d.id,
    nome: d.nome,
    tipo: d.tipo,
    email: d.email,
    telefone: d.telefone,
    cargo: d.cargo,
    cnpj_cpf: d.cnpj_cpf,
    endereco: d.endereco,
    cidade: d.cidade,
    estado: d.estado,
    cep: d.cep,
    origem: d.origem,
    observacoes: d.observacoes,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
  };
}

async function updateResponsavelInDb(id: string, updates: Partial<Responsavel>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (updates.nome !== undefined) updateData.nome = updates.nome;
  if (updates.tipo !== undefined) updateData.tipo = updates.tipo;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
  if (updates.cargo !== undefined) updateData.cargo = updates.cargo;
  if (updates.cnpj_cpf !== undefined) updateData.cnpj_cpf = updates.cnpj_cpf;
  if (updates.endereco !== undefined) updateData.endereco = updates.endereco;
  if (updates.cidade !== undefined) updateData.cidade = updates.cidade;
  if (updates.estado !== undefined) updateData.estado = updates.estado;
  if (updates.cep !== undefined) updateData.cep = updates.cep;
  if (updates.origem !== undefined) updateData.origem = updates.origem;
  if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

  const { error } = await supabase
    .from('responsaveis')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

async function deleteResponsavelFromDb(id: string): Promise<void> {
  const { error } = await supabase
    .from('responsaveis')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useResponsaveis(tipo?: string) {
  const queryClient = useQueryClient();

  const { data: allResponsaveis = [], isLoading, refetch } = useQuery({
    queryKey: ['responsaveis'],
    queryFn: fetchResponsaveis,
    staleTime: 0,
  });

  const responsaveis = tipo 
    ? allResponsaveis.filter(r => r.tipo === tipo)
    : allResponsaveis;

  const clientes = allResponsaveis.filter(r => r.tipo === 'cliente');
  const funcionarios = allResponsaveis.filter(r => r.tipo === 'funcionario');

  const addMutation = useMutation({
    mutationFn: addResponsavelToDb,
    onSuccess: (newResponsavel) => {
      queryClient.setQueryData<Responsavel[]>(['responsaveis'], (old = []) => [...old, newResponsavel]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Responsavel> }) =>
      updateResponsavelInDb(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['responsaveis'] });
      const previous = queryClient.getQueryData<Responsavel[]>(['responsaveis']);
      queryClient.setQueryData<Responsavel[]>(['responsaveis'], (old = []) =>
        old.map(r => r.id === id ? { ...r, ...updates } : r)
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['responsaveis'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['responsaveis'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResponsavelFromDb,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['responsaveis'] });
      const previous = queryClient.getQueryData<Responsavel[]>(['responsaveis']);
      queryClient.setQueryData<Responsavel[]>(['responsaveis'], (old = []) =>
        old.filter(r => r.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['responsaveis'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['responsaveis'] });
    },
  });

  return {
    responsaveis,
    clientes,
    funcionarios,
    isLoading,
    addResponsavel: (data: Partial<Omit<Responsavel, 'id' | 'createdAt' | 'updatedAt'>> & { nome: string }) => addMutation.mutateAsync(data),
    updateResponsavel: (id: string, updates: Partial<Responsavel>) => updateMutation.mutateAsync({ id, updates }),
    deleteResponsavel: (id: string) => deleteMutation.mutateAsync(id),
    getResponsavelById: (id: string) => allResponsaveis.find(r => r.id === id),
    refetch,
  };
}
