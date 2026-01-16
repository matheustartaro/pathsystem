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
      
      {/* Main content - adjust margin when sidebar is locked open */}
      <div className={cn(
        "transition-all duration-200",
        locked ? "lg:ml-[280px]" : "lg:ml-20"
      )}>
        <Header />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}