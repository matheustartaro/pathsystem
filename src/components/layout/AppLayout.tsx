import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarContext } from '@/contexts/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { state, activeGroup, locked } = useSidebarContext();

  // Calcular margin-left baseado no estado da sidebar
  const getMarginLeft = () => {
    switch (state) {
      case 'minimal':
        return 'lg:ml-[48px]';
      case 'icons':
        return 'lg:ml-[60px]';
      case 'expanded':
        return 'lg:ml-[220px]';
      case 'dual-pane':
        // Se tem painel secundário aberto (com grupo ativo)
        if (activeGroup) {
          return 'lg:ml-[240px]'; // 60px + 180px
        }
        return 'lg:ml-[60px]';
      default:
        return 'lg:ml-[60px]';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content */}
      <div className={cn(
        "transition-all duration-200",
        getMarginLeft()
      )}>
        <Header />
        <main id="main-content" className="p-4 lg:p-6" role="main" aria-label="Conteúdo principal">
          {children}
        </main>
      </div>
    </div>
  );
}
