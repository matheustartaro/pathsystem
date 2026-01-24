import { useCallback, useMemo, useRef, useEffect } from 'react';
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
  X,
  HelpCircle,
  Bell,
  ChevronRight,
  Lightbulb,
  Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

interface NavModule {
  id: string;
  label: string;
  items: NavItem[];
}

// Módulos com sub-itens
const modules: NavModule[] = [
  { 
    id: 'inicio', 
    label: 'Início', 
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, href: '/' },
      { id: 'agenda', label: 'Agenda', icon: CalendarDays, href: '/agenda' },
      { id: 'clientes', label: 'Clientes', icon: UsersRound, href: '/clientes' },
    ]
  },
  { 
    id: 'catalogo', 
    label: 'Catálogo', 
    items: [
      { id: 'produtos', label: 'Produtos', icon: BoxIcon, href: '/catalogo/produtos' },
      { id: 'servicos', label: 'Serviços', icon: HandCoins, href: '/catalogo/servicos' },
      { id: 'precos', label: 'Tabela de Preços', icon: Tags, href: '/catalogo/precos' },
    ]
  },
  { 
    id: 'comercial', 
    label: 'Comercial', 
    items: [
      { id: 'orcamentos', label: 'Orçamentos', icon: FileText, href: '/orcamentos' },
      { id: 'projetos', label: 'Projetos', icon: Layers, href: '/projetos' },
      { id: 'cronograma', label: 'Cronograma', icon: CalendarRange, href: '/gantt' },
    ]
  },
  { 
    id: 'financeiro', 
    label: 'Financeiro', 
    items: [
      { id: 'fluxo', label: 'Fluxo de Caixa', icon: ArrowUpDown, href: '/financeiro/fluxo-caixa' },
      { id: 'contas', label: 'Contas', icon: Landmark, href: '/financeiro/contas' },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3, href: '/relatorios' },
    ]
  },
];

// Larguras para cada fase
const WIDTH_PHASE_1 = 60;
const WIDTH_PHASE_2 = 240;
const WIDTH_PHASE_3 = 280;
const WIDTH_PHASE_4 = 540;

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const { state, setState, activeGroup, setActiveGroup, locked, setLocked } = useSidebarContext();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Mapear estados para fases
  const phaseMap = {
    'minimal': 1,
    'icons': 2, 
    'expanded': 3,
    'dual-pane': 4
  };
  const phase = phaseMap[state] || 1;

  // Encontrar módulo atual baseado na rota
  const currentModuleId = useMemo(() => {
    for (const mod of modules) {
      for (const item of mod.items) {
        if (item.href === '/') {
          if (location.pathname === '/') return mod.id;
        } else if (location.pathname === item.href || location.pathname.startsWith(item.href + '/')) {
          return mod.id;
        }
      }
    }
    return modules[0].id;
  }, [location.pathname]);

  const currentModule = useMemo(() => {
    return modules.find(m => m.id === (activeGroup || currentModuleId)) || modules[0];
  }, [activeGroup, currentModuleId]);

  // Item ativo baseado na rota
  const activeItemId = useMemo(() => {
    for (const mod of modules) {
      for (const item of mod.items) {
        if (item.href === '/') {
          if (location.pathname === '/') return item.id;
        } else if (location.pathname === item.href || location.pathname.startsWith(item.href + '/')) {
          return item.id;
        }
      }
    }
    return 'dashboard';
  }, [location.pathname]);

  const userInitials = user?.email?.charAt(0).toUpperCase() || 'U';

  // Fecha ao clicar fora (apenas se não estiver travado)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (phase > 1 && !locked) {
          setState('minimal');
          setActiveGroup(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [phase, locked, setState, setActiveGroup]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    if (phase >= 3) {
      setState('minimal');
      setActiveGroup(null);
    } else {
      setState('expanded');
    }
  }, [phase, setState, setActiveGroup]);

  // Toggle lock
  const handleToggleLock = useCallback(() => {
    const newState = !locked;
    setLocked(newState);
    if (newState) {
      setState('expanded');
    }
  }, [locked, setLocked, setState]);

  // Hover handlers para Fase 1
  const handleMouseEnter = useCallback(() => {
    if (phase === 1 && !locked) {
      setState('icons');
    }
  }, [phase, locked, setState]);

  const handleMouseLeave = useCallback(() => {
    if (phase === 2 && !locked) {
      setState('minimal');
    }
  }, [phase, locked, setState]);

  // Clique em item
  const handleItemClick = useCallback((href: string) => {
    navigate(href);
    if (!locked) {
      setState('minimal');
      setActiveGroup(null);
    }
  }, [navigate, locked, setState, setActiveGroup]);

  // Clique em módulo (fase 3)
  const handleModuleClick = useCallback((moduleId: string) => {
    setActiveGroup(moduleId);
    if (phase === 3) {
      setState('dual-pane');
    }
  }, [phase, setState, setActiveGroup]);

  // Clique em sub-item (fase 4)
  const handleSubItemClick = useCallback((href: string) => {
    navigate(href);
    if (locked) {
      setState('expanded');
    } else {
      setState('minimal');
    }
    setActiveGroup(null);
  }, [navigate, locked, setState, setActiveGroup]);

  // Largura dinâmica
  const sidebarWidth = useMemo(() => {
    switch (phase) {
      case 1: return WIDTH_PHASE_1;
      case 2: return WIDTH_PHASE_2;
      case 3: return WIDTH_PHASE_3;
      case 4: return WIDTH_PHASE_4;
      default: return WIDTH_PHASE_1;
    }
  }, [phase]);

  return (
    <>
      {/* SIDEBAR CONTAINER */}
      <motion.aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-full bg-sidebar border-r border-sidebar-border flex shadow-lg z-50 fixed left-0 top-0 bottom-0 hidden lg:flex"
      >
        
        {/* COLUNA ESQUERDA */}
        <div className={cn(
          'flex flex-col h-full transition-all duration-300',
          phase >= 3 ? 'w-[60px] border-r border-sidebar-border/50 bg-sidebar-accent/30' : 'w-full'
        )}>
          
          {/* HEADER: LOGO */}
          <div className={cn(
            'h-[60px] shrink-0 flex items-center',
            phase === 2 ? 'px-6 justify-start' : 'justify-center'
          )}>
            <Link to="/">
              {phase === 2 ? (
                <img src="/images/logo-jmario.png" alt="J.Mario" className="h-5 w-auto" />
              ) : (
                <img src="/images/icon-jmario.png" alt="J.Mario" className="h-7 w-7 object-contain" />
              )}
            </Link>
          </div>

          {/* CONTEÚDO DA FASE 1 e 2 */}
          {phase <= 2 && (
            <div className={cn(
              'flex-1 overflow-y-auto py-2 px-2 space-y-1',
              phase === 1 ? 'scrollbar-hidden' : ''
            )}>
              {phase === 2 && (
                <div className="px-3 py-2 text-xs font-bold text-sidebar-foreground/40 uppercase tracking-wider mb-2">
                  {currentModule.label}
                </div>
              )}

              {currentModule.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.href)}
                  className={cn(
                    'w-full flex items-center h-10 rounded-md transition-all group relative',
                    activeItemId === item.id 
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium' 
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    phase === 1 ? 'justify-center px-0' : 'px-3 gap-3'
                  )}
                >
                  <item.icon size={20} strokeWidth={activeItemId === item.id ? 2.5 : 2} className="shrink-0" />
                  
                  {phase === 2 && (
                    <span className="text-[13px] truncate">{item.label}</span>
                  )}

                  {/* Tooltip na fase 1 */}
                  {phase === 1 && (
                    <div className="absolute left-14 bg-popover text-popover-foreground text-xs py-1.5 px-3 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg border border-border">
                      {item.label}
                    </div>
                  )}

                  {/* Indicador ativo */}
                  {activeItemId === item.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-sidebar-primary rounded-r-md" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Spacer se estiver na Fase 3/4 */}
          {phase >= 3 && <div className="flex-1" />}

          {/* FOOTER: Ações do Sistema */}
          <div className="mt-auto shrink-0 flex flex-col py-4 gap-4">
            <div className={cn(
              'flex flex-col gap-3 items-center',
              phase === 2 ? 'w-[60px]' : ''
            )}>
              {/* Hambúrguer */}
              <button 
                onClick={toggleSidebar}
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
                  phase >= 3 ? 'bg-sidebar-accent text-sidebar-foreground' : ''
                )}
                title="Menu Global"
              >
                {phase >= 3 ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="w-4 h-px bg-sidebar-border my-1" />

              <button 
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" 
                title="Tema"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button 
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-primary transition-colors" 
                title="Ajuda"
              >
                <HelpCircle size={20} />
              </button>
              <button 
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors relative" 
                title="Notificações"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-sidebar" />
              </button>
            </div>

            {/* Perfil */}
            <div className={cn(
              'flex items-center gap-3 cursor-pointer',
              phase === 1 || phase >= 3 ? 'justify-center' : 'px-3'
            )}>
              <div className={cn(
                'relative shrink-0 flex items-center justify-center',
                phase === 2 ? 'w-[36px]' : 'w-full'
              )}>
                <Avatar className="h-8 w-8 ring-2 ring-sidebar shadow-sm">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              {phase === 2 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex flex-col min-w-0"
                >
                  <span className="text-[13px] font-bold text-sidebar-foreground truncate">
                    {user?.email?.split('@')[0] || 'Usuário'}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* GAVETA DE NAVEGAÇÃO (Fases 3 e 4) */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex overflow-hidden bg-sidebar"
            >
              {/* COLUNA: MÓDULOS (Fase 3) */}
              <div className={cn(
                'flex flex-col border-r border-sidebar-border/50 py-4',
                phase === 4 ? 'w-[220px]' : 'w-full'
              )}>
                <div className="px-6 mb-6">
                  <img src="/images/logo-jmario.png" alt="J.Mario" className="h-5 w-auto" />
                </div>
                
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                  <div className="px-4 mb-2 text-xs font-bold text-sidebar-foreground/40 uppercase tracking-widest">
                    Módulos
                  </div>
                  {modules.map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => handleModuleClick(mod.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all group',
                        activeGroup === mod.id 
                          ? 'bg-sidebar-accent text-sidebar-primary font-bold shadow-sm' 
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      {mod.label}
                      <ChevronRight 
                        size={16} 
                        className={cn(
                          'transition-transform',
                          activeGroup === mod.id && phase === 4 ? 'rotate-0 text-sidebar-primary' : 'text-sidebar-foreground/30'
                        )} 
                      />
                    </button>
                  ))}
                </div>
                
                {/* FOOTER FASE 3 */}
                <div className="p-5 mt-auto border-t border-sidebar-border/50 space-y-3">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-xs font-bold text-sidebar-foreground/40 uppercase tracking-widest">
                      {locked ? "Menu Fixado" : "Expandir Menu"}
                    </span>
                    <button 
                      onClick={handleToggleLock}
                      className={cn(
                        'w-8 h-4 rounded-full relative transition-colors',
                        locked ? 'bg-sidebar-primary' : 'bg-sidebar-foreground/30'
                      )}
                      title={locked ? "Destravar menu" : "Fixar menu aberto"}
                    >
                      <div className={cn(
                        'absolute top-0.5 w-3 h-3 bg-sidebar rounded-full transition-all shadow-sm',
                        locked ? 'right-0.5' : 'left-0.5'
                      )} />
                    </button>
                  </div>

                  <button 
                    onClick={() => handleItemClick('/configuracoes')}
                    className="flex items-center gap-3 text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 p-2 rounded-md transition-colors w-full text-left"
                  >
                    <Settings size={18} /> Configurações
                  </button>
                  <button className="flex items-center gap-3 text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 p-2 rounded-md transition-colors w-full text-left">
                    <Lightbulb size={18} /> Canal de ideias
                  </button>
                  <button className="flex items-center gap-3 text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 p-2 rounded-md transition-colors w-full text-left">
                    <Headphones size={18} /> Suporte
                  </button>
                </div>
              </div>

              {/* COLUNA: SUB-ITENS (Fase 4) */}
              {phase === 4 && activeGroup && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '260px' }}
                  className="flex-1 bg-sidebar-accent/30 flex flex-col py-4 border-l border-sidebar-border/30 shadow-inner z-10"
                >
                  <div className="px-6 h-[40px] flex items-center mb-4">
                    <h3 className="font-bold text-sidebar-foreground text-lg">
                      {modules.find(m => m.id === activeGroup)?.label}
                    </h3>
                  </div>
                  
                  <div className="px-4 space-y-1">
                    {modules.find(m => m.id === activeGroup)?.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSubItemClick(item.href)}
                        className={cn(
                          'w-full text-left px-4 py-2.5 rounded-md text-sm transition-all flex items-center gap-3',
                          activeItemId === item.id 
                            ? 'text-sidebar-primary bg-sidebar hover:shadow-sm font-medium'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar hover:shadow-sm'
                        )}
                      >
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          activeItemId === item.id ? 'bg-sidebar-primary' : 'bg-sidebar-foreground/30'
                        )} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* OVERLAY ESCURO (Apenas se NÃO estiver travado e fase >= 3) */}
      <AnimatePresence>
        {phase >= 3 && !locked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/10 backdrop-blur-[1px] z-40 hidden lg:block"
            style={{ pointerEvents: 'none' }} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
