import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutGrid, 
  CalendarRange, 
  Layers, 
  Settings, 
  Moon, 
  Sun, 
  BoxIcon,
  UsersRound,
  CalendarDays,
  ArrowUpDown,
  Landmark,
  HandCoins,
  Tags,
  BarChart3,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { SheetClose } from '@/components/ui/sheet';

const navItems = [
  { icon: LayoutGrid, label: 'Dashboard', href: '/' },
  { icon: CalendarDays, label: 'Agenda', href: '/agenda' },
  { icon: UsersRound, label: 'Clientes', href: '/clientes' },
  { icon: BoxIcon, label: 'Produtos', href: '/catalogo/produtos' },
  { icon: HandCoins, label: 'Serviços', href: '/catalogo/servicos' },
  { icon: Tags, label: 'Tabela de Preços', href: '/catalogo/precos' },
  { icon: FileText, label: 'Orçamentos', href: '/orcamentos' },
  { icon: Layers, label: 'Projetos', href: '/projetos' },
  { icon: CalendarRange, label: 'Cronograma', href: '/gantt' },
  { icon: ArrowUpDown, label: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
  { icon: Landmark, label: 'Contas', href: '/financeiro/contas' },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
];

interface MobileNavProps {
  onNavigate?: () => void;
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex items-center h-16 border-b border-sidebar-border px-4">
        <img 
          src="/images/logo-jmario.png" 
          alt="J.Mario" 
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <SheetClose asChild>
                  <Link
                    to={item.href}
                    onClick={handleNavigate}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </SheetClose>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Theme Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
        </Button>
      </div>
    </div>
  );
}
