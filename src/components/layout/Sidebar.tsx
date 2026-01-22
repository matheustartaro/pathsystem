import { forwardRef, useCallback, useMemo } from 'react';
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
  MessageCircle,
  Package
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext, SidebarState } from '@/contexts/SidebarContext';
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

// Grupos de navegação como na referência do Tiny
const navGroups: NavGroup[] = [
  {
    key: 'inicio',
    label: 'início',
    icon: LayoutGrid,
    items: [
      { icon: LayoutGrid, label: 'Dashboard', href: '/' },
      { icon: CalendarDays, label: 'Agenda', href: '/agenda' },
    ],
  },
  {
    key: 'cadastros',
    label: 'cadastros',
    icon: UsersRound,
    items: [
      { icon: UsersRound, label: 'Clientes', href: '/clientes' },
    ],
  },
  {
    key: 'suprimentos',
    label: 'suprimentos',
    icon: Package,
    items: [
      { icon: BoxIcon, label: 'Produtos', href: '/catalogo/produtos' },
      { icon: HandCoins, label: 'Serviços', href: '/catalogo/servicos' },
      { icon: Tags, label: 'Tabela de Preços', href: '/catalogo/precos' },
    ],
  },
  {
    key: 'vendas',
    label: 'vendas',
    icon: FileText,
    items: [
      { icon: FileText, label: 'Orçamentos', href: '/orcamentos' },
      { icon: Layers, label: 'Projetos', href: '/projetos' },
      { icon: CalendarRange, label: 'Cronograma', href: '/gantt' },
    ],
  },
  {
    key: 'financas',
    label: 'finanças',
    icon: Landmark,
    items: [
      { icon: ArrowUpDown, label: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
      { icon: Landmark, label: 'Contas', href: '/financeiro/contas' },
      { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
    ],
  },
];

// Todos os itens de navegação para o estado expandido simples
const allNavItems: NavSubItem[] = [
  { icon: LayoutGrid, label: 'Dashboard', href: '/' },
  { icon: CalendarDays, label: 'Agenda', href: '/agenda' },
  { icon: UsersRound, label: 'Clientes', href: '/clientes' },
  { icon: FileText, label: 'Orçamentos', href: '/orcamentos' },
  { icon: Layers, label: 'Projetos', href: '/projetos' },
  { icon: CalendarRange, label: 'Cronograma', href: '/gantt' },
  { icon: ArrowUpDown, label: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
  { icon: Landmark, label: 'Contas', href: '/financeiro/contas' },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
  { icon: BoxIcon, label: 'Produtos', href: '/catalogo/produtos' },
  { icon: HandCoins, label: 'Serviços', href: '/catalogo/servicos' },
  { icon: Tags, label: 'Tabela de Preços', href: '/catalogo/precos' },
];

// Wrap button with forwardRef for Tooltip compatibility
const IconButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => <button ref={ref} {...props} />
);
IconButton.displayName = 'IconButton';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const { state, setState, activeGroup, setActiveGroup, locked, setLocked } = useSidebarContext();

  const isItemActive = useCallback((href: string): boolean => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  }, [location.pathname]);

  const isGroupActive = useCallback((group: NavGroup): boolean => {
    return group.items.some(item => isItemActive(item.href));
  }, [isItemActive]);

  const currentActiveGroup = useMemo(() => {
    return navGroups.find(g => isGroupActive(g))?.key || null;
  }, [isGroupActive]);

  const handleMenuToggle = useCallback(() => {
    if (state === 'minimal') {
      setState('icons');
    } else if (state === 'icons') {
      setState('expanded');
    } else if (state === 'expanded') {
      setState('icons');
    } else if (state === 'dual-pane') {
      setState('expanded');
      setActiveGroup(null);
    }
  }, [state, setState, setActiveGroup]);

  const handleGroupClick = useCallback((groupKey: string) => {
    if (state === 'icons' || state === 'expanded') {
      setState('dual-pane');
      setActiveGroup(groupKey);
    } else if (state === 'dual-pane') {
      setActiveGroup(activeGroup === groupKey ? null : groupKey);
    }
  }, [state, setState, activeGroup, setActiveGroup]);

  const handleItemClick = useCallback((href: string) => {
    navigate(href);
    if (!locked) {
      setActiveGroup(null);
      if (state === 'dual-pane') {
        setState('icons');
      }
    }
  }, [navigate, locked, state, setState, setActiveGroup]);

  const handleLockToggle = useCallback((checked: boolean) => {
    setLocked(checked);
    if (checked) {
      setState('dual-pane');
      if (!activeGroup) {
        setActiveGroup(currentActiveGroup || 'inicio');
      }
    }
  }, [setLocked, setState, activeGroup, setActiveGroup, currentActiveGroup]);

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  // Calcular larguras baseado no estado
  const getMainWidth = () => {
    switch (state) {
      case 'minimal': return 'w-[48px]';
      case 'icons': return 'w-[60px]';
      case 'expanded': return 'w-[220px]';
      case 'dual-pane': return 'w-[60px]';
      default: return 'w-[60px]';
    }
  };

  const showSecondaryPanel = state === 'dual-pane' && activeGroup;

  return (
    <>
      {/* Main Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 ease-out hidden lg:flex',
          getMainWidth()
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-center h-16">
          <Link to="/">
            {state === 'expanded' ? (
              <img 
                src="/images/logo-jmario.png" 
                alt="J.Mario" 
                className="h-6 w-auto"
              />
            ) : (
              <img 
                src="/images/icon-jmario.png" 
                alt="J.Mario" 
                className="h-7 w-7 object-contain"
              />
            )}
          </Link>
        </div>

        {/* Menu Toggle Button */}
        <div className={cn(
          'flex items-center mb-2',
          state === 'expanded' ? 'justify-start px-4' : 'justify-center'
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                onClick={handleMenuToggle}
                className={cn(
                  'flex items-center justify-center rounded-md transition-colors',
                  'w-9 h-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Menu className="w-5 h-5" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {state === 'minimal' ? 'Mostrar ícones' : state === 'icons' ? 'Expandir menu' : 'Recolher menu'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-1 overflow-y-auto overflow-x-hidden scrollbar-hidden">
          {/* Estado minimal - sem navegação, só menu e user */}
          {state === 'minimal' && null}

          {/* Estado icons - apenas ícones das páginas */}
          {state === 'icons' && (
            <ul className="space-y-0.5 px-2">
              {allNavItems.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          onClick={() => handleItemClick(item.href)}
                          className={cn(
                            'flex items-center justify-center w-full h-9 rounded-md transition-all duration-150',
                            isActive
                              ? 'text-sidebar-primary bg-sidebar-accent'
                              : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                          )}
                        >
                          <item.icon className="w-[18px] h-[18px]" />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Estado expanded - ícones + labels */}
          {state === 'expanded' && (
            <ul className="space-y-0.5 px-3">
              {allNavItems.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => handleItemClick(item.href)}
                      className={cn(
                        'flex items-center gap-3 w-full h-9 px-3 rounded-md transition-all duration-150 text-sm text-left',
                        isActive
                          ? 'text-sidebar-primary bg-sidebar-accent'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <item.icon className="w-[18px] h-[18px] shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Estado dual-pane - grupos na barra principal */}
          {state === 'dual-pane' && (
            <ul className="space-y-0.5 px-2">
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
                            isOpen || isActive
                              ? 'text-sidebar-primary bg-sidebar-accent'
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
          )}
        </nav>

        {/* Footer Icons */}
        <div className={cn(
          'py-3 space-y-1',
          state === 'expanded' ? 'px-3' : 'px-2'
        )}>
          {state === 'expanded' ? (
            <>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full h-9 px-3 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
                <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
              </button>
              <button className="flex items-center gap-3 w-full h-9 px-3 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <HelpCircle className="w-[18px] h-[18px]" />
                <span>Ajuda</span>
              </button>
              <button className="flex items-center gap-3 w-full h-9 px-3 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <Bell className="w-[18px] h-[18px]" />
                <span>Notificações</span>
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* User Avatar */}
        <div className={cn(
          'py-4',
          state === 'expanded' ? 'px-3' : 'px-2 flex justify-center'
        )}>
          {state === 'expanded' ? (
            <button
              onClick={signOut}
              className="flex items-center gap-3 w-full h-9 px-3 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 border-2 border-sidebar rounded-full" />
              </div>
              <span className="truncate">{user?.email?.split('@')[0] || 'Usuário'}</span>
            </button>
          ) : (
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
          )}
        </div>
      </aside>

      {/* Secondary Panel for Dual-Pane state */}
      <aside
        className={cn(
          'fixed left-[60px] top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 ease-out hidden lg:flex',
          showSecondaryPanel ? 'w-[180px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
        )}
      >
        {/* Logo Text */}
        <div className="flex items-center h-16 px-4">
          <img 
            src="/images/logo-jmario.png" 
            alt="J.Mario" 
            className="h-5 w-auto"
          />
        </div>

        {/* Group Title */}
        <div className="px-4 py-2">
          <h3 className="text-sm font-medium text-sidebar-foreground capitalize">
            {navGroups.find(g => g.key === activeGroup)?.label}
          </h3>
        </div>

        {/* Categories */}
        <div className="px-4 py-2 space-y-1">
          {navGroups.map((group) => {
            const isActive = group.key === activeGroup;
            return (
              <button
                key={group.key}
                onClick={() => setActiveGroup(group.key)}
                className={cn(
                  'flex items-center justify-between w-full py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-sidebar-foreground'
                    : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'
                )}
              >
                <span>{group.label}</span>
                {isGroupActive(group) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Expand Menu Toggle */}
        <div className="px-4 py-3 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sidebar-foreground/50">expandir menu</span>
            <Switch 
              checked={locked}
              onCheckedChange={handleLockToggle}
              className="scale-[0.65] data-[state=checked]:bg-sidebar-primary"
            />
          </div>
        </div>

        {/* Secondary Links */}
        <div className="px-4 py-2 space-y-0.5">
          <Link
            to="/configuracoes"
            className={cn(
              'flex items-center gap-2 py-1.5 text-sm transition-colors',
              location.pathname === '/configuracoes'
                ? 'text-sidebar-primary'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
            )}
          >
            <Settings className="w-4 h-4" />
            <span>configurações</span>
          </Link>
          <button className="flex items-center gap-2 py-1.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
            <Lightbulb className="w-4 h-4" />
            <span>canal de ideias</span>
          </button>
          <button className="flex items-center gap-2 py-1.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span>suporte</span>
          </button>
        </div>

        {/* Subitems */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto overflow-x-hidden scrollbar-hidden border-t border-sidebar-border mt-2">
          {activeGroup && (
            <ul className="space-y-0.5">
              {navGroups.find(g => g.key === activeGroup)?.items.map((item) => {
                const isActive = isItemActive(item.href);
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => handleItemClick(item.href)}
                      className={cn(
                        'flex items-center gap-2 w-full py-2 text-sm text-left transition-all duration-150',
                        isActive
                          ? 'text-sidebar-primary'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>

      {/* Overlay para fechar o menu quando clicar fora (apenas dual-pane não travado) */}
      {state === 'dual-pane' && activeGroup && !locked && (
        <div 
          className="fixed inset-0 z-20 hidden lg:block" 
          onClick={() => {
            setActiveGroup(null);
            setState('icons');
          }}
        />
      )}
    </>
  );
}
