import { useState, memo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  KeyRound, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  ExternalLink,
  Ban,
  RefreshCw,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useClientTokens, ClientAccessToken } from '@/hooks/useClientTokens';
import { cn } from '@/lib/utils';

interface ClientTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    id: string;
    nome: string;
    email: string | null;
  } | null;
}

function ClientTokensDialog({ open, onOpenChange, client }: ClientTokensDialogProps) {
  const { tokens, createToken, revokeToken, deleteToken, reactivateToken, getPortalUrl, isCreating } = useClientTokens();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [email, setEmail] = useState('');
  const [expiresDays, setExpiresDays] = useState<string>('30');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);

  const clientTokens = client ? tokens.filter(t => t.client_id === client.id) : [];

  const handleCreate = async () => {
    if (!client || !email.trim()) return;
    
    await createToken({
      client_id: client.id,
      email: email.trim(),
      expires_days: expiresDays === 'never' ? undefined : parseInt(expiresDays),
    });
    
    setShowCreateForm(false);
    setEmail('');
  };

  const handleCopy = async (token: string, type: 'token' | 'url') => {
    const textToCopy = type === 'url' ? getPortalUrl(token) : token;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedToken(`${token}-${type}`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDelete = async () => {
    if (deleteTokenId) {
      await deleteToken(deleteTokenId);
      setDeleteTokenId(null);
    }
  };

  const getTokenStatus = (token: ClientAccessToken) => {
    if (!token.is_active) return { label: 'Revogado', color: 'bg-muted text-muted-foreground' };
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return { label: 'Expirado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    }
    return { label: 'Ativo', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Tokens de Acesso - {client?.nome}
            </DialogTitle>
            <DialogDescription>
              Gerencie os tokens de acesso do cliente ao portal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Create New Token */}
            {!showCreateForm ? (
              <Button onClick={() => { setShowCreateForm(true); setEmail(client?.email || ''); }} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Criar Novo Token
              </Button>
            ) : (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="space-y-2">
                  <Label>Email do Cliente</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@cliente.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validade</Label>
                  <Select value={expiresDays} onValueChange={setExpiresDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="365">1 ano</SelectItem>
                      <SelectItem value="never">Sem expiração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={isCreating || !email.trim()}>
                    {isCreating ? 'Criando...' : 'Criar Token'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Token List */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Tokens Existentes</h4>
              
              {clientTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <KeyRound className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum token criado para este cliente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientTokens.map((token) => {
                    const status = getTokenStatus(token);
                    const isActive = token.is_active && (!token.expires_at || new Date(token.expires_at) > new Date());
                    
                    return (
                      <div
                        key={token.id}
                        className={cn(
                          'border rounded-lg p-4 space-y-3',
                          !isActive && 'opacity-60'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={status.color}>{status.label}</Badge>
                              <span className="text-sm text-muted-foreground">{token.email}</span>
                            </div>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {token.token.slice(0, 8)}...{token.token.slice(-4)}
                            </code>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(token.token, 'token')}
                              title="Copiar token"
                            >
                              {copiedToken === `${token.token}-token` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(token.token, 'url')}
                              title="Copiar link do portal"
                            >
                              {copiedToken === `${token.token}-url` ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <ExternalLink className="w-4 h-4" />
                              )}
                            </Button>
                            {isActive ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => revokeToken(token.id)}
                                title="Revogar token"
                              >
                                <Ban className="w-4 h-4 text-yellow-500" />
                              </Button>
                            ) : token.is_active === false ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => reactivateToken(token.id)}
                                title="Reativar token"
                              >
                                <RefreshCw className="w-4 h-4 text-green-500" />
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTokenId(token.id)}
                              title="Excluir token"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Criado: {format(new Date(token.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {token.expires_at && (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Expira: {format(new Date(token.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                          {token.last_used_at && (
                            <span>
                              Último uso: {formatDistanceToNow(new Date(token.last_used_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTokenId} onOpenChange={() => setDeleteTokenId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir token?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente não poderá mais acessar o portal com este token.
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
    </>
  );
}

export default memo(ClientTokensDialog);
