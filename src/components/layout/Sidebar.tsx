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
  ChevronRight,
  Lock,
  Unlock
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext, SidebarState } from '@/contexts/SidebarContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavPage {
  key: string;
  icon: LucideIcon;
  label: string;
  href: string;
  subPages?: { icon: LucideIcon; label: string; href: string }[];
}

// Páginas principais com suas sub-páginas (não categorias!)
const navPages: NavPage[] = [
  { 
    key: 'dashboard', 
    icon: LayoutGrid, 
    label: 'Dashboard', 
    href: '/' 
  },
  { 
    key: 'agenda', 
    icon: CalendarDays, 
    label: 'Agenda', 
    href: '/agenda' 
  },
  { 
    key: 'clientes', 
    icon: UsersRound, 
    label: 'Clientes', 
    href: '/clientes' 
  },
  { 
    key: 'catalogo', 
    icon: BoxIcon, 
    label: 'Catálogo', 
    href: '/catalogo/produtos',
    subPages: [
      { icon: BoxIcon, label: 'Produtos', href: '/catalogo/produtos' },
      { icon: HandCoins, label: 'Serviços', href: '/catalogo/servicos' },
      { icon: Tags, label: 'Tabela de Preços', href: '/catalogo/precos' },
    ]
  },
  { 
    key: 'orcamentos', 
    icon: FileText, 
    label: 'Orçamentos', 
    href: '/orcamentos' 
  },
  { 
    key: 'projetos', 
    icon: Layers, 
    label: 'Projetos', 
    href: '/projetos',
    subPages: [
      { icon: Layers, label: 'Lista de Projetos', href: '/projetos' },
      { icon: CalendarRange, label: 'Cronograma', href: '/gantt' },
    ]
  },
  { 
    key: 'financeiro', 
    icon: Landmark, 
    label: 'Financeiro', 
    href: '/financeiro/fluxo-caixa',
    subPages: [
      { icon: ArrowUpDown, label: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
      { icon: Landmark, label: 'Contas', href: '/financeiro/contas' },
    ]
  },
  { 
    key: 'relatorios', 
    icon: BarChart3, 
    label: 'Relatórios', 
    href: '/relatorios' 
  },
  { 
    key: 'configuracoes', 
    icon: Settings, 
    label: 'Configurações', 
    href: '/configuracoes' 
  },
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

  const isPageActive = useCallback((href: string): boolean => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  }, [location.pathname]);

  // Encontrar a página atual e suas sub-páginas
  const currentPage = useMemo(() => {
    return navPages.find(page => {
      if (page.href === '/') {
        return location.pathname === '/';
      }
      if (page.subPages) {
        return page.subPages.some(sub => location.pathname === sub.href || location.pathname.startsWith(sub.href + '/'));
      }
      return location.pathname === page.href || location.pathname.startsWith(page.href + '/');
    });
  }, [location.pathname]);

  // Sub-páginas da página atual (para modo ícones)
  const currentSubPages = useMemo(() => {
    return currentPage?.subPages || [];
  }, [currentPage]);

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  // Toggle entre estados
  const handleMenuToggle = useCallback(() => {
    const transitions: Record<SidebarState, SidebarState> = {
      'minimal': 'icons',
      'icons': 'expanded',
      'expanded': 'minimal',
      'dual-pane': 'expanded',
    };
    setState(transitions[state]);
    if (state === 'dual-pane') {
      setActiveGroup(null);
    }
  }, [state, setState, setActiveGroup]);

  // Clique em página -> navegar ou abrir dual-pane se tiver sub-páginas
  const handlePageClick = useCallback((page: NavPage) => {
    if (page.subPages && page.subPages.length > 0) {
      // Tem sub-páginas: abre dual-pane
      setState('dual-pane');
      setActiveGroup(page.key);
    } else {
      // Sem sub-páginas: navega direto
      navigate(page.href);
      if (!locked && state === 'dual-pane') {
        setState('icons');
        setActiveGroup(null);
      }
    }
  }, [navigate, setState, setActiveGroup, locked, state]);

  // Clique em sub-página
  const handleSubPageClick = useCallback((href: string) => {
    navigate(href);
    if (!locked) {
      setState('icons');
      setActiveGroup(null);
    }
  }, [navigate, locked, setState, setActiveGroup]);

  // Lock toggle
  const handleLockToggle = useCallback(() => {
    setLocked(!locked);
  }, [locked, setLocked]);

  // Larguras baseadas no estado
  const mainWidth = useMemo(() => {
    switch (state) {
      case 'minimal': return 'w-12';
      case 'icons': return 'w-14';
      case 'expanded': return 'w-56';
      case 'dual-pane': return 'w-14';
      default: return 'w-14';
    }
  }, [state]);

  // Página selecionada no dual-pane
  const selectedPage = useMemo(() => {
    return navPages.find(p => p.key === activeGroup);
  }, [activeGroup]);

  const showSecondaryPanel = state === 'dual-pane' && selectedPage?.subPages;

  return (
    <>
      {/* Main Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 ease-out hidden lg:flex',
          mainWidth
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-14 shrink-0">
          <Link to="/">
            {state === 'expanded' ? (
              <img src="/images/logo-jmario.png" alt="J.Mario" className="h-5 w-auto" />
            ) : (
              <img src="/images/icon-jmario.png" alt="J.Mario" className="h-6 w-6 object-contain" />
            )}
          </Link>
        </div>

        {/* Menu Toggle */}
        <div className={cn('flex items-center shrink-0', state === 'expanded' ? 'px-3' : 'justify-center')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                onClick={handleMenuToggle}
                className="flex items-center justify-center w-8 h-8 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Menu className="w-4 h-4" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>Menu</TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-hidden">
          {/* Estado MINIMAL: nada */}
          {state === 'minimal' && null}

          {/* Estado ICONS: ícones das sub-páginas da página atual OU todas as páginas */}
          {state === 'icons' && (
            <ul className="space-y-1 px-2">
              {currentSubPages.length > 0 ? (
                // Mostra sub-páginas da página atual
                currentSubPages.map((sub) => {
                  const isActive = location.pathname === sub.href;
                  return (
                    <li key={sub.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconButton
                            onClick={() => handleSubPageClick(sub.href)}
                            className={cn(
                              'flex items-center justify-center w-full h-9 rounded-md transition-colors',
                              isActive
                                ? 'text-sidebar-primary bg-sidebar-accent'
                                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                            )}
                          >
                            <sub.icon className="w-4 h-4" />
                          </IconButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>{sub.label}</TooltipContent>
                      </Tooltip>
                    </li>
                  );
                })
              ) : (
                // Mostra todas as páginas principais
                navPages.map((page) => {
                  const isActive = isPageActive(page.href) || (page.subPages?.some(s => isPageActive(s.href)));
                  return (
                    <li key={page.key}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconButton
                            onClick={() => handlePageClick(page)}
                            className={cn(
                              'flex items-center justify-center w-full h-9 rounded-md transition-colors',
                              isActive
                                ? 'text-sidebar-primary bg-sidebar-accent'
                                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                            )}
                          >
                            <page.icon className="w-4 h-4" />
                          </IconButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>{page.label}</TooltipContent>
                      </Tooltip>
                    </li>
                  );
                })
              )}
            </ul>
          )}

          {/* Estado EXPANDED: lista completa com labels */}
          {state === 'expanded' && (
            <ul className="space-y-0.5 px-2">
              {navPages.map((page) => {
                const isActive = isPageActive(page.href) || (page.subPages?.some(s => isPageActive(s.href)));
                const hasSubPages = page.subPages && page.subPages.length > 0;
                return (
                  <li key={page.key}>
                    <button
                      onClick={() => handlePageClick(page)}
                      className={cn(
                        'flex items-center gap-3 w-full h-9 px-3 rounded-md text-sm transition-colors',
                        isActive
                          ? 'text-sidebar-primary bg-sidebar-accent'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <page.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left truncate">{page.label}</span>
                      {hasSubPages && <ChevronRight className="w-3 h-3 opacity-50" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Estado DUAL-PANE: ícones das páginas na barra principal */}
          {state === 'dual-pane' && (
            <ul className="space-y-1 px-2">
              {navPages.map((page) => {
                const isActive = activeGroup === page.key;
                const isCurrentRoute = isPageActive(page.href) || (page.subPages?.some(s => isPageActive(s.href)));
                return (
                  <li key={page.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          onClick={() => {
                            if (page.subPages && page.subPages.length > 0) {
                              setActiveGroup(page.key);
                            } else {
                              navigate(page.href);
                            }
                          }}
                          className={cn(
                            'flex items-center justify-center w-full h-9 rounded-md transition-colors',
                            isActive
                              ? 'text-sidebar-primary bg-sidebar-accent'
                              : isCurrentRoute
                                ? 'text-sidebar-primary'
                                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                          )}
                        >
                          <page.icon className="w-4 h-4" />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>{page.label}</TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* Footer */}
        <div className={cn('py-2 space-y-0.5 shrink-0', state === 'expanded' ? 'px-2' : 'px-2')}>
          {state === 'expanded' ? (
            <>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full h-8 px-3 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
              </button>
              <button className="flex items-center gap-3 w-full h-8 px-3 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <HelpCircle className="w-4 h-4" />
                <span>Ajuda</span>
              </button>
              <button className="flex items-center gap-3 w-full h-8 px-3 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <Bell className="w-4 h-4" />
                <span>Notificações</span>
              </button>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-full h-8 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton className="flex items-center justify-center w-full h-8 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>Ajuda</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton className="flex items-center justify-center w-full h-8 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                    <Bell className="w-4 h-4" />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>Notificações</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* User */}
        <div className={cn('py-3 shrink-0', state === 'expanded' ? 'px-2' : 'flex justify-center')}>
          {state === 'expanded' ? (
            <button
              onClick={signOut}
              className="flex items-center gap-3 w-full h-9 px-3 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src="" />
                <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{user?.email?.split('@')[0] || 'Usuário'}</span>
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton onClick={signOut} className="flex items-center justify-center">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-medium">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </IconButton>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="font-medium">{user?.email?.split('@')[0] || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground">Clique para sair</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Secondary Panel (Dual-Pane) */}
      <aside
        className={cn(
          'fixed left-14 top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200 ease-out hidden lg:flex overflow-hidden',
          showSecondaryPanel ? 'w-48 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        )}
      >
        {selectedPage && (
          <>
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-sidebar-border/50">
              <span className="text-sm font-medium text-sidebar-foreground">{selectedPage.label}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton
                    onClick={handleLockToggle}
                    className="flex items-center justify-center w-6 h-6 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
                  >
                    {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {locked ? 'Desbloquear' : 'Bloquear aberto'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Sub-pages */}
            <nav className="flex-1 py-3 px-2 overflow-y-auto">
              <ul className="space-y-0.5">
                {selectedPage.subPages?.map((sub) => {
                  const isActive = location.pathname === sub.href;
                  return (
                    <li key={sub.href}>
                      <button
                        onClick={() => handleSubPageClick(sub.href)}
                        className={cn(
                          'flex items-center gap-2.5 w-full h-8 px-3 rounded-md text-sm transition-colors',
                          isActive
                            ? 'text-sidebar-primary bg-sidebar-accent'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                        )}
                      >
                        <sub.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>
        )}
      </aside>
    </>
  );
}
