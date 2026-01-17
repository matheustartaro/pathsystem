import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LucideIcon, 
  LayoutGrid, 
  CalendarRange, 
  Layers, 
  Settings, 
  Moon, 
  Sun, 
  Database,
  Banknote,
  BoxIcon,
  UsersRound,
  CalendarDays,
  ChevronDown,
  LogOut,
  ArrowUpDown,
  Landmark,
  Boxes,
  HandCoins,
  Tags,
  UserRoundPlus,
  PanelLeftClose,
  PanelLeft,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SubNavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  description?: string;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  description?: string;
  href?: string;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  { 
    icon: LayoutGrid, 
    label: 'Dashboard',
    description: 'Visão geral',
    href: '/'
  },
  { 
    icon: Banknote, 
    label: 'Financeiro',
    description: 'Receitas e despesas',
    subItems: [
      { icon: ArrowUpDown, label: 'Fluxo de Caixa', description: 'Movimentações', href: '/financeiro/fluxo-caixa' },
      { icon: Landmark, label: 'Contas', description: 'Contas bancárias', href: '/financeiro/contas' },
    ]
  },
  { 
    icon: Layers, 
    label: 'Projetos',
    description: 'Gestão de projetos',
    subItems: [
      { icon: Layers, label: 'Projetos', description: 'Todos os projetos', href: '/projetos' },
      { icon: CalendarRange, label: 'Cronograma', description: 'Cronograma visual', href: '/gantt' },
    ]
  },
  { 
    icon: Boxes, 
    label: 'Catálogo',
    description: 'Produtos e serviços',
    subItems: [
      { icon: BoxIcon, label: 'Produtos', description: 'Lista de produtos', href: '/catalogo/produtos' },
      { icon: HandCoins, label: 'Serviços', description: 'Lista de serviços', href: '/catalogo/servicos' },
      { icon: Tags, label: 'Tabela de Preços', description: 'Preços e valores', href: '/catalogo/precos' },
    ]
  },
  { 
    icon: UsersRound, 
    label: 'Clientes',
    description: 'Base de clientes',
    subItems: [
      { icon: UsersRound, label: 'Lista de Clientes', description: 'Todos os clientes', href: '/clientes' },
      { icon: UserRoundPlus, label: 'Novo Cliente', description: 'Cadastrar cliente', href: '/clientes/novo' },
    ]
  },
  { 
    icon: CalendarDays, 
    label: 'Agenda',
    description: 'Compromissos',
    href: '/agenda' 
  },
  { 
    icon: BarChart3, 
    label: 'Relatórios',
    description: 'Análises do negócio',
    href: '/relatorios' 
  },
  { 
    icon: Settings, 
    label: 'Configurações',
    description: 'Preferências e dados',
    href: '/configuracoes' 
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
}

export function Sidebar({ collapsed, onCollapsedChange, locked = false, onLockedChange }: SidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { openMenus, toggleMenu } = useSidebarContext();
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (locked) return;
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onCollapsedChange(false);
  };

  const handleMouseLeave = () => {
    if (locked) return;
    timeoutRef.current = window.setTimeout(() => {
      onCollapsedChange(true);
    }, 150);
  };

  const toggleLock = () => {
    if (onLockedChange) {
      onLockedChange(!locked);
      if (!locked) {
        onCollapsedChange(false);
      }
    }
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.href) {
      return location.pathname === item.href || 
        (item.href !== '/' && location.pathname.startsWith(item.href));
    }
    if (item.subItems) {
      return item.subItems.some(sub => 
        location.pathname === sub.href || location.pathname.startsWith(sub.href)
      );
    }
    return false;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-out hidden lg:flex flex-col',
        collapsed ? 'w-20' : 'w-[280px]'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo and Toggle */}
      <div className={cn(
        'flex items-center h-16 border-b border-sidebar-border px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/images/logo-jmario.png" 
              alt="J.Mario" 
              className="h-8 w-auto"
            />
          </Link>
        )}
        {collapsed && (
          <img 
            src="/images/icon-jmario.png" 
            alt="J.Mario" 
            className="h-8 w-8 object-contain"
          />
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLock}
            className="w-8 h-8 text-sidebar-foreground hover:bg-sidebar-accent"
            title={locked ? 'Desbloquear menu' : 'Travar menu aberto'}
          >
            {locked ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = isItemActive(item);
            const isOpen = openMenus.includes(item.label);
            
            if (item.subItems && !collapsed) {
              return (
                <li key={item.label}>
                  <Collapsible open={isOpen} onOpenChange={() => toggleMenu(item.label)}>
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          'flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="whitespace-nowrap font-semibold text-sm">{item.label}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={cn(
                          'w-4 h-4 transition-transform duration-200 flex-shrink-0',
                          isOpen && 'rotate-180'
                        )} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => {
                        const subIsActive = location.pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            to={subItem.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150',
                              subIsActive
                                ? 'bg-sidebar-accent text-sidebar-primary'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                            )}
                          >
                            <subItem.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap text-sm text-left">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            }

            // Simple link or collapsed menu with subItems
            if (item.href || collapsed) {
              const href = item.href || (item.subItems ? item.subItems[0].href : '/');
              return (
                <li key={item.label}>
                  <Link
                    to={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150',
                      collapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="whitespace-nowrap font-semibold text-sm">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              );
            }

            return null;
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn(
        'p-3 border-t border-sidebar-border space-y-2 overflow-hidden',
        collapsed ? 'flex flex-col items-center' : ''
      )}>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={toggleTheme}
          className={cn(
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'w-10 h-10' : 'w-full justify-start gap-3'
          )}
        >
          {theme === 'light' ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && <span className="whitespace-nowrap">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
        </Button>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={signOut}
          className={cn(
            'text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive',
            collapsed ? 'w-10 h-10' : 'w-full justify-start gap-3'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Sair</span>}
        </Button>
      </div>
    </aside>
  );
}