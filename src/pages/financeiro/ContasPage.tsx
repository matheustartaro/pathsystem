import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Building2, Wallet, Pencil, Trash2 } from 'lucide-react';
import { useFinanceiro, Account } from '@/hooks/useFinanceiro';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function ContasPage() {
  const { accounts, isLoading, addAccount, updateAccount, deleteAccount } = useFinanceiro();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'banco' as 'banco' | 'caixa' | 'cartao',
    banco: '',
    agencia: '',
    conta: '',
    saldo_inicial: 0,
  });

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        nome: account.nome,
        tipo: account.tipo,
        banco: account.banco || '',
        agencia: account.agencia || '',
        conta: account.conta || '',
        saldo_inicial: account.saldo_inicial,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        nome: '',
        tipo: 'banco',
        banco: '',
        agencia: '',
        conta: '',
        saldo_inicial: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount({ id: editingAccount.id, ...formData });
        toast.success('Conta atualizada!');
      } else {
        await addAccount({ 
          ...formData, 
          saldo_atual: formData.saldo_inicial, 
          ativo: true 
        });
        toast.success('Conta cadastrada!');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar conta');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await deleteAccount(id);
        toast.success('Conta excluída!');
      } catch (error) {
        toast.error('Erro ao excluir conta');
      }
    }
  };

  const handleToggleActive = async (account: Account) => {
    try {
      await updateAccount({ id: account.id, ativo: !account.ativo });
      toast.success(account.ativo ? 'Conta desativada' : 'Conta ativada');
    } catch (error) {
      toast.error('Erro ao atualizar conta');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const saldoBancos = accounts.filter(a => a.tipo === 'banco' && a.ativo).reduce((sum, a) => sum + a.saldo_atual, 0);
  const saldoCaixa = accounts.filter(a => a.tipo === 'caixa' && a.ativo).reduce((sum, a) => sum + a.saldo_atual, 0);
  const saldoCartoes = accounts.filter(a => a.tipo === 'cartao' && a.ativo).reduce((sum, a) => sum + a.saldo_atual, 0);

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'banco': return <Building2 className="h-4 w-4" />;
      case 'caixa': return <Wallet className="h-4 w-4" />;
      case 'cartao': return <CreditCard className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas</h1>
            <p className="text-muted-foreground">Gerencie suas contas bancárias e caixas</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo em Bancos</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(saldoBancos)}</div>
              <p className="text-xs text-muted-foreground">
                {accounts.filter(a => a.tipo === 'banco' && a.ativo).length} contas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(saldoCaixa)}</div>
              <p className="text-xs text-muted-foreground">
                {accounts.filter(a => a.tipo === 'caixa' && a.ativo).length} caixas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cartões</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(saldoCartoes)}</div>
              <p className="text-xs text-muted-foreground">
                {accounts.filter(a => a.tipo === 'cartao' && a.ativo).length} cartões
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Minhas Contas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conta cadastrada</p>
                <p className="text-sm">Clique em "Nova Conta" para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Banco/Instituição</TableHead>
                    <TableHead className="text-right">Saldo Atual</TableHead>
                    <TableHead>Ativa</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id} className={!account.ativo ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(account.tipo)}
                          {account.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {account.tipo === 'banco' ? 'Banco' : 
                           account.tipo === 'caixa' ? 'Caixa' : 'Cartão'}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.banco || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        account.saldo_atual >= 0 ? 'text-green-600' : 'text-destructive'
                      }`}>
                        {formatCurrency(account.saldo_atual)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={account.ativo}
                          onCheckedChange={() => handleToggleActive(account)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(account)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(account.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da conta"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: 'banco' | 'caixa' | 'cartao') => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banco">Banco</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.tipo === 'banco' && (
              <>
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Nome do banco"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input
                      value={formData.agencia}
                      onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                      placeholder="0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input
                      value={formData.conta}
                      onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                      placeholder="00000-0"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Saldo Inicial</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.saldo_inicial}
                onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingAccount ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
