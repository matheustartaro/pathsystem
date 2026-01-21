import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarContext } from '@/contexts/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { collapsed, setCollapsed, locked, setLocked } = useSidebarContext();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={collapsed} 
        onCollapsedChange={setCollapsed}
        locked={locked}
        onLockedChange={setLocked}
      />
      
      {/* Main content - always 60px margin for icon sidebar, +200px when locked */}
      <div className={cn(
        "transition-all duration-200",
        locked ? "lg:ml-[260px]" : "lg:ml-[60px]"
      )}>
        <Header />
        <main id="main-content" className="p-4 lg:p-6" role="main" aria-label="Conteúdo principal">
          {children}
        </main>
      </div>
    </div>
  );
}