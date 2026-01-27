import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon, LayoutGrid, CalendarRange, Layers, Settings, Moon, Sun, BoxIcon, UsersRound, CalendarDays, ArrowUpDown, Landmark, HandCoins, Tags, BarChart3, FileText, Menu, X, HelpCircle, Bell, ChevronRight, Lightbulb, Headphones } from 'lucide-react';
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
const modules: NavModule[] = [{
  id: 'dashboard',
  label: 'Dashboard',
  items: [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    href: '/'
  }]
}, {
  id: 'financeiro',
  label: 'Financeiro',
  items: [{
    id: 'fluxo',
    label: 'Fluxo de Caixa',
    icon: ArrowUpDown,
    href: '/financeiro/fluxo-caixa'
  }, {
    id: 'contas',
    label: 'Contas',
    icon: Landmark,
    href: '/financeiro/contas'
  }, {
    id: 'relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    href: '/relatorios'
  }]
}, {
  id: 'projetos',
  label: 'Projetos',
  items: [{
    id: 'projetos',
    label: 'Projetos',
    icon: Layers,
    href: '/projetos'
  }, {
    id: 'cronograma',
    label: 'Cronograma',
    icon: CalendarRange,
    href: '/gantt'
  }]
}, {
  id: 'catalogo',
  label: 'Catálogo',
  items: [{
    id: 'servicos',
    label: 'Serviços',
    icon: HandCoins,
    href: '/catalogo/servicos'
  }, {
    id: 'produtos',
    label: 'Produtos',
    icon: BoxIcon,
    href: '/catalogo/produtos'
  }, {
    id: 'precos',
    label: 'Tabela de Preços',
    icon: Tags,
    href: '/catalogo/precos'
  }]
}, {
  id: 'ferramentas',
  label: 'Ferramentas',
  items: [{
    id: 'agenda',
    label: 'Agenda',
    icon: CalendarDays,
    href: '/agenda'
  }, {
    id: 'orcamentos',
    label: 'Orçamentos',
    icon: FileText,
    href: '/orcamentos'
  }]
}, {
  id: 'clientes',
  label: 'Clientes',
  items: [{
    id: 'clientes',
    label: 'Clientes',
    icon: UsersRound,
    href: '/clientes'
  }]
}];

// Larguras para cada fase
const WIDTH_PHASE_1 = 60;
const WIDTH_PHASE_3 = 280;
const WIDTH_PHASE_4 = 540;
export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const {
    signOut,
    user
  } = useAuth();
  const {
    state,
    setState,
    activeGroup,
    setActiveGroup,
    locked,
    setLocked
  } = useSidebarContext();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Mapear estados para fases (removida fase 2)
  const phaseMap = {
    'minimal': 1,
    'icons': 1,
    // Agora icons também mapeia para 1
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

  // Clique em item da fase 1
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
      case 1:
        return WIDTH_PHASE_1;
      case 3:
        return WIDTH_PHASE_3;
      case 4:
        return WIDTH_PHASE_4;
      default:
        return WIDTH_PHASE_1;
    }
  }, [phase]);
  return <>
      {/* SIDEBAR CONTAINER */}
      <motion.aside ref={sidebarRef} initial={false} animate={{
      width: sidebarWidth
    }} transition={{
      type: "spring",
      stiffness: 300,
      damping: 30
    }} className="h-full bg-card flex z-50 fixed left-0 top-0 bottom-0 hidden lg:flex" style={{
      boxShadow: phase >= 3 ? '0 0 60px -15px hsl(var(--foreground) / 0.1)' : 'none'
    }}>
        
        {/* COLUNA ESQUERDA - Ícones */}
        <div className={cn('flex flex-col h-full transition-all duration-300', phase >= 3 ? 'w-[60px]' : 'w-full')}>
          
          {/* Área superior */}
          <div className="flex-1 flex flex-col bg-[#e8e8e8]">
            {/* Hambúrguer no topo, alinhado com primeiro item do menu */}
            <div className="shrink-0 py-2 px-2">
              <button onClick={toggleSidebar} className={cn('w-full flex items-center justify-center h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors', phase >= 3 ? 'bg-accent text-foreground' : '')} title="Menu Global">
                {phase >= 3 ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* CONTEÚDO DA FASE 1 - Ícones do módulo atual */}
            {phase === 1 && <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-hidden">
                {currentModule.items.map(item => <button key={item.id} onClick={() => handleItemClick(item.href)} className={cn('w-full flex items-center justify-center h-10 rounded-lg transition-all group relative', activeItemId === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                    <item.icon size={20} strokeWidth={activeItemId === item.id ? 2.5 : 2} className="shrink-0" />
                    
                    {/* Tooltip */}
                    <div className="absolute left-14 bg-popover text-popover-foreground text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg border border-border">
                      {item.label}
                    </div>
                  </button>)}
              </div>}
          </div>

          {/* FOOTER: Ações do Sistema - Faixa cinza */}
          <div className="shrink-0 flex flex-col py-4 gap-3 items-center w-full bg-[#e8e8e8]">
            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Tema">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Ajuda">
              <HelpCircle size={20} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative" title="Notificações">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[hsl(var(--status-info))] rounded-full" />
            </button>

            {/* Perfil */}
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* GAVETA DE NAVEGAÇÃO (Fases 3 e 4) */}
        <AnimatePresence>
          {phase >= 3 && <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="flex-1 flex overflow-hidden bg-card">
              {/* COLUNA: MÓDULOS (Fase 3) */}
              <div className={cn("flex flex-col py-4 bg-[#e8e8e8]", phase === 4 ? 'w-[220px]' : 'w-full')}>
                {/* Logo acima dos menus */}
                <div className="px-4 pb-6 pt-2 bg-[#e8e8e8]">
                  <img src="/images/logo-jmario.png" alt="J.Mario" className="h-6 object-contain" />
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-0.5 py-[40px] px-[15px] bg-[#e8e8e8]">
                  {modules.map(mod => <button key={mod.id} onClick={() => handleModuleClick(mod.id)} className={cn('w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all text-sm', activeGroup === mod.id ? 'text-foreground font-semibold' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                      {mod.label}
                      {activeGroup === mod.id && phase === 4 && <ChevronRight size={14} className="text-muted-foreground" />}
                    </button>)}
                </div>
                
                {/* FOOTER FASE 3 */}
                <div className="px-3 pt-3 mt-auto space-y-1 bg-[#e8e8e8]">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      expandir menu
                    </span>
                    <button onClick={handleToggleLock} className={cn('w-9 h-5 rounded-full relative transition-colors', locked ? 'bg-foreground' : 'bg-muted')} title={locked ? "Destravar menu" : "Fixar menu aberto"}>
                      <div className={cn('absolute top-0.5 w-4 h-4 bg-card rounded-full transition-all shadow-sm', locked ? 'right-0.5' : 'left-0.5')} />
                    </button>
                  </div>

                  <button onClick={() => handleItemClick('/configuracoes')} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-lg transition-colors w-full text-left">
                    <Settings size={16} /> configurações
                  </button>
                  <button className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-lg transition-colors w-full text-left">
                    <Lightbulb size={16} /> canal de ideias
                  </button>
                  <button className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent px-3 py-2 rounded-lg transition-colors w-full text-left">
                    <Headphones size={16} /> suporte
                  </button>
                </div>
              </div>

              {/* COLUNA: SUB-ITENS (Fase 4) */}
              {phase === 4 && activeGroup && <motion.div initial={{
            opacity: 0,
            width: 0
          }} animate={{
            opacity: 1,
            width: '260px'
          }} className="flex-1 flex flex-col bg-zinc-50 px-[15px] py-[55px]">
                  <div className="px-5 h-[32px] flex items-center mb-4">
                    <h3 className="font-semibold text-foreground">{currentModule.label}</h3>
                  </div>
                  
                  <div className="px-3 space-y-0.5">
                    {currentModule.items.map(item => <button key={item.id} onClick={() => handleSubItemClick(item.href)} className={cn('w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3', activeItemId === item.id ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50')}>
                        <item.icon size={16} />
                        {item.label}
                      </button>)}
                  </div>
                </motion.div>}
            </motion.div>}
        </AnimatePresence>
      </motion.aside>

      {/* OVERLAY ESCURO (Apenas se NÃO estiver travado e fase >= 3) */}
      <AnimatePresence>
        {phase >= 3 && !locked && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 bg-foreground/5 backdrop-blur-[1px] z-40 lg:block hidden" style={{
        pointerEvents: 'none'
      }} />}
      </AnimatePresence>
    </>;
}