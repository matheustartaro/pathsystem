import { useState, useMemo, memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  Eye, 
  MoreVertical,
  Search 
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';

const roleIcons: Record<AppRole, typeof Shield> = {
  admin: ShieldCheck,
  funcionario: Shield,
  visualizador: Eye,
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  funcionario: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  visualizador: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

function TeamManagementPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { members, isLoading, updateRole, removeRole, getRoleLabel, getRoleDescription } = useTeamManagement();
  const [search, setSearch] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const filteredMembers = useMemo(() => 
    members.filter(m => 
      m.profile?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      m.profile?.email?.toLowerCase().includes(search.toLowerCase())
    ), [members, search]);

  const stats = useMemo(() => ({
    total: members.length,
    admins: members.filter(m => m.role === 'admin').length,
    funcionarios: members.filter(m => m.role === 'funcionario').length,
    visualizadores: members.filter(m => m.role === 'visualizador').length,
  }), [members]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (!isAdmin) return;
    await updateRole({ userId, role: newRole });
  };

  const handleRemove = async () => {
    if (!confirmRemove || !isAdmin) return;
    await removeRole(confirmRemove);
    setConfirmRemove(null);
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Equipe</h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>
          {(['admin', 'funcionario', 'visualizador'] as AppRole[]).map(role => {
            const Icon = roleIcons[role];
            const count = stats[role === 'admin' ? 'admins' : role === 'funcionario' ? 'funcionarios' : 'visualizadores'];
            return (
              <Card key={role}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {getRoleLabel(role)}s
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['admin', 'funcionario', 'visualizador'] as AppRole[]).map(role => {
            const Icon = roleIcons[role];
            return (
              <Card key={role} className="border-l-4" style={{ borderLeftColor: role === 'admin' ? '#ef4444' : role === 'funcionario' ? '#3b82f6' : '#6b7280' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {getRoleLabel(role)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {getRoleDescription(role)}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Members Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Carregando...</div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold">Nenhum membro encontrado</h3>
                <p className="text-muted-foreground text-sm">
                  {search ? 'Tente ajustar sua busca' : 'Nenhum usuário cadastrado'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => {
                    const Icon = roleIcons[member.role];
                    const isCurrentUser = member.user_id === user?.id;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {member.profile?.nome?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.profile?.nome || 'Usuário'}</p>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">Você</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.profile?.email || '-'}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={member.role} 
                            onValueChange={(v) => handleRoleChange(member.user_id, v as AppRole)}
                            disabled={isCurrentUser}
                          >
                            <SelectTrigger className="w-[160px]">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {(['admin', 'funcionario', 'visualizador'] as AppRole[]).map(role => {
                                const RoleIcon = roleIcons[role];
                                return (
                                  <SelectItem key={role} value={role}>
                                    <div className="flex items-center gap-2">
                                      <RoleIcon className="w-4 h-4" />
                                      {getRoleLabel(role)}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(member.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {!isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => setConfirmRemove(member.user_id)}
                                  className="text-destructive"
                                >
                                  Remover acesso
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá completamente o acesso deste usuário ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

export default memo(TeamManagementPage);
