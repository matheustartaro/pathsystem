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
  Banknote,
  BoxIcon,
  UsersRound,
  CalendarDays,
  ChevronRight,
  LogOut,
  ArrowUpDown,
  Landmark,
  Boxes,
  HandCoins,
  Tags,
  UserRoundPlus,
  BarChart3,
  FileText,
  Menu,
  HelpCircle,
  Bell
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SubNavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  { 
    icon: LayoutGrid, 
    label: 'Dashboard',
    href: '/'
  },
  { 
    icon: Banknote, 
    label: 'Financeiro',
    subItems: [
      { icon: ArrowUpDown, label: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
      { icon: Landmark, label: 'Contas', href: '/financeiro/contas' },
    ]
  },
  { 
    icon: Layers, 
    label: 'Projetos',
    subItems: [
      { icon: Layers, label: 'Projetos', href: '/projetos' },
      { icon: CalendarRange, label: 'Cronograma', href: '/gantt' },
    ]
  },
  { 
    icon: Boxes, 
    label: 'Catálogo',
    subItems: [
      { icon: BoxIcon, label: 'Produtos', href: '/catalogo/produtos' },
      { icon: HandCoins, label: 'Serviços', href: '/catalogo/servicos' },
      { icon: Tags, label: 'Tabela de Preços', href: '/catalogo/precos' },
    ]
  },
  { 
    icon: UsersRound, 
    label: 'Clientes',
    subItems: [
      { icon: UsersRound, label: 'Lista de Clientes', href: '/clientes' },
      { icon: UserRoundPlus, label: 'Novo Cliente', href: '/clientes/novo' },
    ]
  },
  { 
    icon: CalendarDays, 
    label: 'Agenda',
    href: '/agenda' 
  },
  { 
    icon: FileText, 
    label: 'Orçamentos',
    href: '/orcamentos' 
  },
  { 
    icon: BarChart3, 
    label: 'Relatórios',
    href: '/relatorios' 
  },
  { 
    icon: Settings, 
    label: 'Configurações',
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
  const { signOut, user } = useAuth();
  const { openMenus, toggleMenu } = useSidebarContext();

  const toggleExpand = () => {
    if (onLockedChange) {
      onLockedChange(!locked);
      onCollapsedChange(!locked ? false : true);
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

  const isSubItemActive = (href: string): boolean => {
    return location.pathname === href || location.pathname.startsWith(href);
  };

  // Get user initials
  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar flex flex-col transition-all duration-300 ease-in-out hidden lg:flex',
        collapsed ? 'w-[60px]' : 'w-[260px]'
      )}
    >
      {/* Logo Area */}
      <div className={cn(
        'flex items-center h-14 px-3',
        collapsed ? 'justify-center' : 'justify-start'
      )}>
        <Link to="/" className="flex items-center gap-2">
          {collapsed ? (
            <img 
              src="/images/icon-jmario.png" 
              alt="J.Mario" 
              className="h-7 w-7 object-contain"
            />
          ) : (
            <img 
              src="/images/logo-jmario.png" 
              alt="J.Mario" 
              className="h-7 w-auto"
            />
          )}
        </Link>
      </div>

      {/* Menu Toggle Button */}
      <div className={cn(
        'flex items-center px-3 py-2',
        collapsed ? 'justify-center' : 'justify-start'
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleExpand}
              className={cn(
                'flex items-center justify-center rounded-lg transition-colors',
                'w-9 h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Menu className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {locked ? 'Recolher menu' : 'Expandir menu'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = isItemActive(item);
            const isOpen = openMenus.includes(item.label);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            // Collapsed state - show only icons
            if (collapsed) {
              const href = item.href || (item.subItems ? item.subItems[0].href : '/');
              return (
                <li key={item.label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={href}
                        className={cn(
                          'flex items-center justify-center w-full h-10 rounded-lg transition-all duration-150',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            // Expanded state with submenu
            if (hasSubItems) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-150',
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <ChevronRight className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isOpen && 'rotate-90'
                    )} />
                  </button>
                  
                  {/* Submenu */}
                  <div className={cn(
                    'overflow-hidden transition-all duration-200',
                    isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  )}>
                    <ul className="mt-1 ml-4 pl-4 border-l border-sidebar-border space-y-0.5">
                      {item.subItems?.map((subItem) => {
                        const subActive = isSubItemActive(subItem.href);
                        return (
                          <li key={subItem.href}>
                            <Link
                              to={subItem.href}
                              className={cn(
                                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                                subActive
                                  ? 'text-primary font-medium bg-sidebar-accent'
                                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                              )}
                            >
                              <subItem.icon className="w-4 h-4" />
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            }

            // Simple link (expanded)
            return (
              <li key={item.label}>
                <Link
                  to={item.href || '/'}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Expand Menu Toggle */}
      {!collapsed && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sidebar-foreground/60">expandir menu</span>
            <Switch 
              checked={locked}
              onCheckedChange={toggleExpand}
              className="scale-75"
            />
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className={cn(
        'py-3 space-y-1',
        collapsed ? 'px-2' : 'px-3'
      )}>
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className={cn(
                'flex items-center gap-3 w-full rounded-lg transition-colors',
                collapsed 
                  ? 'justify-center h-10' 
                  : 'px-3 py-2',
                'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              {!collapsed && <span className="text-sm">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={10}>
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </TooltipContent>
          )}
        </Tooltip>

        {/* Help */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 w-full rounded-lg transition-colors',
                collapsed 
                  ? 'justify-center h-10' 
                  : 'px-3 py-2',
                'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <HelpCircle className="w-5 h-5" />
              {!collapsed && <span className="text-sm">Ajuda</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={10}>
              Ajuda
            </TooltipContent>
          )}
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 w-full rounded-lg transition-colors',
                collapsed 
                  ? 'justify-center h-10' 
                  : 'px-3 py-2',
                'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Bell className="w-5 h-5" />
              {!collapsed && <span className="text-sm">Notificações</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={10}>
              Notificações
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* User Avatar */}
      <div className={cn(
        'py-4 border-t border-sidebar-border',
        collapsed ? 'px-2 flex justify-center' : 'px-3'
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={signOut}
              className={cn(
                'flex items-center gap-3 rounded-lg transition-colors w-full',
                collapsed 
                  ? 'justify-center' 
                  : 'px-2 py-2 hover:bg-sidebar-accent'
              )}
            >
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-sidebar-border">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-sidebar rounded-full" />
              </div>
              {!collapsed && (
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[140px]">
                    {user?.email?.split('@')[0] || 'Usuário'}
                  </span>
                  <span className="text-xs text-sidebar-foreground/50">Sair</span>
                </div>
              )}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={10}>
              <div className="text-center">
                <p className="font-medium">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground">Clique para sair</p>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
