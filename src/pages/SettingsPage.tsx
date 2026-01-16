import { Moon, Sun, Bell, Download, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      toast({
        title: 'Dados limpos',
        description: 'Todos os dados foram removidos. A página será recarregada.',
      });
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleExportData = () => {
    const data = localStorage.getItem('projetos-jm-data');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projetos-jm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Exportação concluída',
        description: 'Os dados foram exportados com sucesso.',
      });
    } else {
      toast({
        title: 'Nenhum dado encontrado',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Personalize o aplicativo de acordo com suas preferências</p>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
          <h3 className="font-semibold text-card-foreground mb-4">Aparência</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Sun className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Modo Claro</p>
                  <p className="text-sm text-muted-foreground">Interface com fundo claro</p>
                </div>
              </div>
              <Switch checked={theme === 'light'} onCheckedChange={() => setTheme('light')} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Moon className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Modo Escuro</p>
                  <p className="text-sm text-muted-foreground">Interface com fundo escuro</p>
                </div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={() => setTheme('dark')} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
          <h3 className="font-semibold text-card-foreground mb-4">Notificações</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-medium text-card-foreground">Lembretes de Prazo</p>
                <p className="text-sm text-muted-foreground">Receba alertas sobre projetos próximos do vencimento</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
          <h3 className="font-semibold text-card-foreground mb-4">Gerenciamento de Dados</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Download className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Exportar Dados</p>
                  <p className="text-sm text-muted-foreground">Baixe uma cópia de todos os seus projetos</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                Exportar
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Limpar Dados</p>
                  <p className="text-sm text-muted-foreground">Remove todos os projetos e configurações</p>
                </div>
              </div>
              <Button variant="destructive" onClick={handleClearData}>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-card rounded-lg border border-border shadow-card p-6 animate-fade-in">
          <h3 className="font-semibold text-card-foreground mb-4">Sobre</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-card-foreground">Versão:</span> 1.0.0</p>
            <p><span className="font-medium text-card-foreground">Desenvolvido por:</span> JM</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
