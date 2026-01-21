import { forwardRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LucideIcon, 
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
  FileText,
  Menu,
  HelpCircle,
  Bell,
  Lightbulb,
  MessageCircle
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavSubItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  items: NavSubItem[];
}

// Grupos de navegação como na referência
const navGroups: NavGroup[] = [
  {
    key: 'inicio',
    label: 'Início',
    icon: LayoutGrid,
    items: [
      { icon: LayoutGrid, label: 'Dashboard', href: '/' },
      { icon: CalendarDays, label: 'Agenda', href: '/agenda' },
    ],
  },
  {
    key: 'cadastros',
    label: 'Cadastros',
    icon: UsersRound,
    items: [
      { icon: UsersRound, label: 'Clientes', href: '/clientes' },
    ],
  },
  {
    key: 'vendas',
    label: 'Vendas',
    icon: FileText,
    items: [
      { icon: FileText, label: 'Orçamentos', href: '/orcamentos' },
      { icon: Layers, label: 'Projetos', href: '/projetos' },
      { icon: CalendarRange, label: 'Cronograma', href: '/gantt' },
    ],
  },
  {
    key: 'financas',
    label: 'Finanças',
    icon: Landmark,
    items: [
      { icon: ArrowUpDown, label: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
      { icon: Landmark, label: 'Contas', href: '/financeiro/contas' },
      { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
    ],
  },
  {
    key: 'servicos',
    label: 'Serviços',
    icon: BoxIcon,
    items: [
      { icon: BoxIcon, label: 'Produtos', href: '/catalogo/produtos' },
      { icon: HandCoins, label: 'Serviços', href: '/catalogo/servicos' },
      { icon: Tags, label: 'Tabela de Preços', href: '/catalogo/precos' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  locked?: boolean;
  onLockedChange?: (locked: boolean) => void;
}

// Wrap Link with forwardRef for Tooltip compatibility
const NavLinkWithRef = forwardRef<HTMLAnchorElement, React.ComponentProps<typeof Link>>(
  (props, ref) => <Link ref={ref} {...props} />
);
NavLinkWithRef.displayName = 'NavLinkWithRef';

// Wrap button with forwardRef for Tooltip compatibility
const IconButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => <button ref={ref} {...props} />
);
IconButton.displayName = 'IconButton';

export function Sidebar({ collapsed, onCollapsedChange, locked = false, onLockedChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const toggleExpand = () => {
    if (onLockedChange) {
      onLockedChange(!locked);
      onCollapsedChange(!locked ? false : true);
    }
  };

  const isItemActive = (href: string): boolean => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isGroupActive = (group: NavGroup): boolean => {
    return group.items.some(item => isItemActive(item.href));
  };

  const handleGroupClick = (groupKey: string) => {
    setActiveGroup(activeGroup === groupKey ? null : groupKey);
  };

  const handleItemClick = (href: string) => {
    navigate(href);
  };

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      {/* Main Sidebar - Only Icons */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar flex flex-col transition-all duration-200 ease-out hidden lg:flex',
          'w-[60px]'
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-center h-16">
          <Link to="/">
            <img 
              src="/images/icon-jmario.png" 
              alt="J.Mario" 
              className="h-7 w-7 object-contain"
            />
          </Link>
        </div>

        {/* Menu Toggle Button */}
        <div className="flex items-center justify-center mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                onClick={toggleExpand}
                className={cn(
                  'flex items-center justify-center rounded-md transition-colors',
                  'w-9 h-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Menu className="w-5 h-5" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {locked ? 'Recolher menu' : 'Expandir menu'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 py-1 px-2 overflow-y-auto overflow-x-hidden scrollbar-hidden">
          <ul className="space-y-0.5">
            {navGroups.map((group) => {
              const isActive = isGroupActive(group);
              const isOpen = activeGroup === group.key;

              return (
                <li key={group.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconButton
                        onClick={() => handleGroupClick(group.key)}
                        className={cn(
                          'flex items-center justify-center w-full h-9 rounded-md transition-all duration-150',
                          isActive || isOpen
                            ? 'text-sidebar-primary'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        <group.icon className="w-[18px] h-[18px]" />
                      </IconButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      {group.label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Icons - Aligned Center */}
        <div className="py-3 px-2 space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                onClick={toggleTheme}
                className="flex items-center justify-center w-full h-9 rounded-md transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton className="flex items-center justify-center w-full h-9 rounded-md transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                <HelpCircle className="w-[18px] h-[18px]" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Ajuda
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton className="flex items-center justify-center w-full h-9 rounded-md transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                <Bell className="w-[18px] h-[18px]" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Notificações
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User Avatar - Aligned Center */}
        <div className="py-4 px-2 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
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
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-sidebar rounded-full" />
                </div>
              </IconButton>
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

      {/* Flyout Submenu Panel */}
      <aside
        className={cn(
          'fixed left-[60px] top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 ease-out hidden lg:flex',
          activeGroup || locked ? 'w-[200px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
        )}
      >
        {/* Logo Text when expanded */}
        <div className="flex items-center h-16 px-4">
          <img 
            src="/images/logo-jmario.png" 
            alt="J.Mario" 
            className="h-6 w-auto"
          />
        </div>

        {/* Group Title */}
        {activeGroup && (
          <div className="px-4 py-2">
            <h3 className="text-sm font-medium text-sidebar-foreground">
              {navGroups.find(g => g.key === activeGroup)?.label}
            </h3>
          </div>
        )}

        {/* Submenu Items */}
        <nav className="flex-1 py-1 px-3 overflow-y-auto overflow-x-hidden scrollbar-hidden">
          {activeGroup && (
            <ul className="space-y-0.5">
              {navGroups.find(g => g.key === activeGroup)?.items.map((item) => {
                const isActive = isItemActive(item.href);

                return (
                  <li key={item.href}>
                    <button
                      onClick={() => handleItemClick(item.href)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 w-full rounded-md transition-all duration-150 text-sm text-left',
                        isActive
                          ? 'text-sidebar-primary bg-sidebar-accent'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <item.icon className="w-[16px] h-[16px]" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Grupos laterais quando locked */}
          {locked && !activeGroup && (
            <div className="space-y-4">
              {navGroups.map((group) => (
                <div key={group.key}>
                  <button
                    onClick={() => handleGroupClick(group.key)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors',
                      isGroupActive(group)
                        ? 'text-sidebar-primary'
                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <span>{group.label}</span>
                    {isGroupActive(group) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Expand Menu Toggle */}
          {(activeGroup || locked) && (
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
          {(activeGroup || locked) && (
            <div className="mt-4 space-y-0.5">
              <Link
                to="/configuracoes"
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  location.pathname === '/configuracoes'
                    ? 'text-sidebar-primary'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Settings className="w-[16px] h-[16px]" />
                <span>configurações</span>
              </Link>
              <button
                className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-left"
              >
                <Lightbulb className="w-[16px] h-[16px]" />
                <span>canal de ideias</span>
              </button>
              <button
                className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-left"
              >
                <MessageCircle className="w-[16px] h-[16px]" />
                <span>suporte</span>
              </button>
            </div>
          )}
        </nav>
      </aside>

      {/* Overlay para fechar o menu quando clicar fora */}
      {activeGroup && !locked && (
        <div 
          className="fixed inset-0 z-20 hidden lg:block" 
          onClick={() => setActiveGroup(null)}
        />
      )}
    </>
  );
}
