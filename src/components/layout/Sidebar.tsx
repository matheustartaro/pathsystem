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
  Bell,
  Lightbulb,
  MessageCircle
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

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'início',
    items: [
      { icon: LayoutGrid, label: 'Índice', href: '/' },
      { icon: LayoutGrid, label: 'Dashboard', href: '/dashboard' },
      { icon: CalendarDays, label: 'Agenda', href: '/agenda' },
    ]
  },
  {
    title: 'cadastros',
    items: [
      { 
        icon: UsersRound, 
        label: 'Clientes',
        subItems: [
          { icon: UsersRound, label: 'Lista de Clientes', href: '/clientes' },
          { icon: UserRoundPlus, label: 'Novo Cliente', href: '/clientes/novo' },
        ]
      },
    ]
  },
  {
    title: 'vendas',
    items: [
      { icon: FileText, label: 'Orçamentos', href: '/orcamentos' },
      { 
        icon: Layers, 
        label: 'Projetos',
        subItems: [
          { icon: Layers, label: 'Lista de Projetos', href: '/projetos' },
          { icon: CalendarRange, label: 'Cronograma', href: '/gantt' },
        ]
      },
    ]
  },
  {
    title: 'finanças',
    items: [
      { icon: ArrowUpDown, label: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
      { icon: Landmark, label: 'Contas', href: '/financeiro/contas' },
      { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
    ]
  },
  {
    title: 'serviços',
    items: [
      { icon: BoxIcon, label: 'Produtos', href: '/catalogo/produtos' },
      { icon: HandCoins, label: 'Serviços', href: '/catalogo/servicos' },
      { icon: Tags, label: 'Tabela de Preços', href: '/catalogo/precos' },
    ]
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
      if (item.href === '/') {
        return location.pathname === '/';
      }
      return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    }
    if (item.subItems) {
      return item.subItems.some(sub => 
        location.pathname === sub.href || location.pathname.startsWith(sub.href + '/')
      );
    }
    return false;
  };

  const isSubItemActive = (href: string): boolean => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isSectionActive = (section: NavSection): boolean => {
    return section.items.some(item => isItemActive(item));
  };

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
        'flex items-center h-16 px-4',
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
              className="h-6 w-auto"
            />
          )}
        </Link>
      </div>

      {/* Menu Toggle Button */}
      <div className={cn(
        'flex items-center px-3 mb-2',
        collapsed ? 'justify-center' : 'justify-start'
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleExpand}
              className={cn(
                'flex items-center justify-center rounded-md transition-colors',
                'w-9 h-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
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

      {/* Navigation Sections */}
      <nav className="flex-1 py-1 px-2 overflow-y-auto overflow-x-hidden scrollbar-hidden">
        {navSections.map((section, sectionIndex) => {
          const sectionActive = isSectionActive(section);
          
          return (
            <div key={section.title} className={cn(sectionIndex > 0 && 'mt-4')}>
              {/* Section Header */}
              {!collapsed && (
                <div className="flex items-center justify-between px-3 mb-1">
                  <span className={cn(
                    'text-xs font-semibold uppercase tracking-wider',
                    sectionActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
                  )}>
                    {section.title}
                  </span>
                  {sectionActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                  )}
                </div>
              )}

              {/* Section Items */}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = isItemActive(item);
                  const isOpen = openMenus.includes(item.label);
                  const hasSubItems = item.subItems && item.subItems.length > 0;

                  // Collapsed state
                  if (collapsed) {
                    const href = item.href || (item.subItems ? item.subItems[0].href : '/');
                    return (
                      <li key={item.label}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={href}
                              className={cn(
                                'flex items-center justify-center w-full h-9 rounded-md transition-all duration-150',
                                isActive
                                  ? 'text-sidebar-primary'
                                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                              )}
                            >
                              <item.icon className="w-[18px] h-[18px]" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={10}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }

                  // Expanded with submenu
                  if (hasSubItems) {
                    return (
                      <li key={item.label}>
                        <button
                          onClick={() => toggleMenu(item.label)}
                          className={cn(
                            'flex items-center justify-between w-full px-3 py-2 rounded-md transition-all duration-150 text-sm',
                            isActive
                              ? 'text-sidebar-primary'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-[18px] h-[18px]" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isOpen && 'rotate-90'
                          )} />
                        </button>
                        
                        <div className={cn(
                          'overflow-hidden transition-all duration-200',
                          isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                        )}>
                          <ul className="mt-0.5 ml-5 pl-3 border-l border-sidebar-border space-y-0.5">
                            {item.subItems?.map((subItem) => {
                              const subActive = isSubItemActive(subItem.href);
                              return (
                                <li key={subItem.href}>
                                  <Link
                                    to={subItem.href}
                                    className={cn(
                                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150',
                                      subActive
                                        ? 'text-sidebar-primary bg-sidebar-accent'
                                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
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

                  // Simple link
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.href || '/'}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 text-sm',
                          isActive
                            ? 'text-sidebar-primary bg-sidebar-accent'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        <item.icon className="w-[18px] h-[18px]" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {/* Expand Menu Toggle - inside nav area */}
        {!collapsed && (
          <div className="mt-6 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-sidebar-foreground/50">expandir menu</span>
              <Switch 
                checked={locked}
                onCheckedChange={toggleExpand}
                className="scale-[0.65] data-[state=checked]:bg-sidebar-primary"
              />
            </div>
          </div>
        )}

        {/* Secondary Links */}
        {!collapsed && (
          <div className="mt-2 space-y-0.5">
            <Link
              to="/configuracoes"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                location.pathname === '/configuracoes'
                  ? 'text-sidebar-primary'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Settings className="w-[18px] h-[18px]" />
              <span>configurações</span>
            </Link>
            <button
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Lightbulb className="w-[18px] h-[18px]" />
              <span>canal de ideias</span>
            </button>
            <button
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              <span>suporte</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Icons */}
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
                'flex items-center justify-center w-full h-9 rounded-md transition-colors',
                'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
          </TooltipContent>
        </Tooltip>

        {/* Help */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'flex items-center justify-center w-full h-9 rounded-md transition-colors',
                'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <HelpCircle className="w-[18px] h-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            Ajuda
          </TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'flex items-center justify-center w-full h-9 rounded-md transition-colors',
                'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Bell className="w-[18px] h-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            Notificações
          </TooltipContent>
        </Tooltip>
      </div>

      {/* User Avatar */}
      <div className={cn(
        'py-4',
        collapsed ? 'px-2 flex justify-center' : 'px-3'
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={signOut}
              className="flex items-center justify-center"
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-amber-100 text-amber-800 text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-sidebar rounded-full" />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            <div className="text-center">
              <p className="font-medium">{user?.email?.split('@')[0] || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">Clique para sair</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
