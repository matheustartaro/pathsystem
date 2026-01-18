import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ClientAccessToken {
  id: string;
  client_id: string;
  token: string;
  email: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  // Joined data
  client?: {
    nome: string;
    email: string | null;
    telefone: string | null;
  };
}

function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function useClientPortal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all access tokens
  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['client-access-tokens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_access_tokens')
        .select(`
          *,
          client:responsaveis(nome, email, telefone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tokens:', error);
        return [];
      }

      return data as ClientAccessToken[];
    },
  });

  // Create access token for client
  const createTokenMutation = useMutation({
    mutationFn: async ({ clientId, email, expiresAt }: { 
      clientId: string; 
      email: string; 
      expiresAt?: string;
    }) => {
      const token = generateSecureToken();
      
      const { data, error } = await supabase
        .from('client_access_tokens')
        .insert({
          client_id: clientId,
          token,
          email,
          expires_at: expiresAt || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, token }; // Return token for display
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-tokens'] });
      toast.success('Token de acesso criado!');
    },
    onError: () => {
      toast.error('Erro ao criar token');
    },
  });

  // Revoke token
  const revokeTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from('client_access_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-tokens'] });
      toast.success('Token revogado!');
    },
    onError: () => {
      toast.error('Erro ao revogar token');
    },
  });

  // Delete token
  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from('client_access_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-access-tokens'] });
      toast.success('Token excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir token');
    },
  });

  // Validate token (for client portal access)
  const validateToken = async (token: string) => {
    const { data, error } = await supabase
      .from('client_access_tokens')
      .select(`
        *,
        client:responsaveis(*)
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false, client: null };
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, client: null, expired: true };
    }

    // Update last_used_at
    await supabase
      .from('client_access_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    return { valid: true, client: data.client, tokenData: data };
  };

  // Get client portal data by client ID
  const getClientPortalData = async (clientId: string) => {
    // Get projects for this client
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Get quotes for this client
    const { data: quotes } = await supabase
      .from('quotes')
      .select('*, items:quote_items(*)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Get transactions for this client
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('data_vencimento', { ascending: false });

    return {
      projects: projects || [],
      quotes: quotes || [],
      transactions: transactions || [],
    };
  };

  return {
    tokens,
    isLoading,
    createToken: createTokenMutation.mutateAsync,
    revokeToken: revokeTokenMutation.mutateAsync,
    deleteToken: deleteTokenMutation.mutateAsync,
    validateToken,
    getClientPortalData,
  };
}
