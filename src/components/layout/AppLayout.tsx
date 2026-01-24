import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useSidebarContext } from '@/contexts/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { state, activeGroup } = useSidebarContext();

  // Calcular margin-left baseado no estado da sidebar
  const getMarginLeft = () => {
    switch (state) {
      case 'minimal':
        return 'lg:ml-12'; // 48px
      case 'icons':
        return 'lg:ml-14'; // 56px
      case 'expanded':
        return 'lg:ml-56'; // 224px
      case 'dual-pane':
        // 56px + 192px = 248px se painel aberto
        return activeGroup ? 'lg:ml-[248px]' : 'lg:ml-14';
      default:
        return 'lg:ml-14';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      
      <div className={cn('transition-all duration-200', getMarginLeft())}>
        <Header />
        <main id="main-content" className="p-4 lg:p-6" role="main" aria-label="Conteúdo principal">
          {children}
        </main>
      </div>
    </div>
  );
}
