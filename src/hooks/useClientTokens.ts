import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientAccessToken {
  id: string;
  client_id: string;
  email: string;
  token: string;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  created_by: string | null;
  client?: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
  };
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function fetchClientTokens(): Promise<ClientAccessToken[]> {
  const { data, error } = await supabase
    .from('client_access_tokens')
    .select(`
      *,
      client:responsaveis!client_access_tokens_client_id_fkey(id, nome, email, telefone)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ClientAccessToken[];
}

async function createToken(params: {
  client_id: string;
  email: string;
  expires_days?: number;
}): Promise<ClientAccessToken> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const token = generateToken();
  const expires_at = params.expires_days 
    ? new Date(Date.now() + params.expires_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('client_access_tokens')
    .insert({
      client_id: params.client_id,
      email: params.email,
      token,
      expires_at,
      created_by: user?.id,
    })
    .select(`
      *,
      client:responsaveis!client_access_tokens_client_id_fkey(id, nome, email, telefone)
    `)
    .single();

  if (error) throw error;
  return data as ClientAccessToken;
}

async function revokeToken(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_access_tokens')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

async function deleteToken(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_access_tokens')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function reactivateToken(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_access_tokens')
    .update({ is_active: true })
    .eq('id', id);

  if (error) throw error;
}

export function useClientTokens() {
  const queryClient = useQueryClient();

  const { data: tokens = [], isLoading, refetch } = useQuery({
    queryKey: ['client-access-tokens'],
    queryFn: fetchClientTokens,
  });

  const createMutation = useMutation({
    mutationFn: createToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-tokens'] });
      toast.success('Token criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar token: ' + (error as Error).message);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-tokens'] });
      toast.success('Token revogado!');
    },
    onError: (error) => {
      toast.error('Erro ao revogar token: ' + (error as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-tokens'] });
      toast.success('Token excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir token: ' + (error as Error).message);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-tokens'] });
      toast.success('Token reativado!');
    },
    onError: (error) => {
      toast.error('Erro ao reativar token: ' + (error as Error).message);
    },
  });

  // Get tokens for a specific client
  const getTokensForClient = (clientId: string) => {
    return tokens.filter(t => t.client_id === clientId);
  };

  // Generate portal URL
  const getPortalUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/portal?token=${token}`;
  };

  return {
    tokens,
    isLoading,
    refetch,
    createToken: createMutation.mutateAsync,
    revokeToken: revokeMutation.mutateAsync,
    deleteToken: deleteMutation.mutateAsync,
    reactivateToken: reactivateMutation.mutateAsync,
    getTokensForClient,
    getPortalUrl,
    isCreating: createMutation.isPending,
  };
}
