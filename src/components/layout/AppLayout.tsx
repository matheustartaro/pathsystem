import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarContext } from '@/contexts/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Larguras para cada fase
const WIDTH_PHASE_1 = 60;
const WIDTH_PHASE_3 = 280;

export function AppLayout({ children }: AppLayoutProps) {
  const { state, locked } = useSidebarContext();

  // Mapear estados para fases
  const phaseMap: Record<string, number> = {
    'minimal': 1,
    'icons': 2, 
    'expanded': 3,
    'dual-pane': 4
  };
  const phase = phaseMap[state] || 1;

  // Cálculo dinâmico do Padding-Left do Main
  // Se travado: empurra o conteúdo (respeitando Fase 3 ou 4).
  // Se destravado: mantém margem mínima de 60px (overlay).
  const mainPaddingLeft = useMemo(() => {
    if (locked) {
      return phase >= 3 ? WIDTH_PHASE_3 : WIDTH_PHASE_1;
    }
    return WIDTH_PHASE_1;
  }, [locked, phase]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <motion.div 
        animate={{ paddingLeft: mainPaddingLeft }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="min-h-screen hidden lg:block"
      >
        <Header />
        <main id="main-content" className="p-3 lg:p-4" role="main" aria-label="Conteúdo principal">
          {children}
        </main>
      </motion.div>

      {/* Mobile layout (sem sidebar animada) */}
      <div className="min-h-screen lg:hidden">
        <Header />
        <main id="main-content-mobile" className="p-3" role="main" aria-label="Conteúdo principal">
          {children}
        </main>
      </div>
    </div>
  );
}
