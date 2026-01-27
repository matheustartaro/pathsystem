import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileNav } from './MobileNav';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { open } = useGlobalSearch();

  return (
    <header className="sticky top-0 z-30 h-12 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-3 lg:px-4">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <MobileNav />
            </SheetContent>
          </Sheet>
        </div>

        {/* Search Button */}
        <div className="hidden md:flex flex-1 max-w-md">
          <Button
            variant="outline"
            onClick={open}
            className="w-full justify-start text-muted-foreground bg-secondary/50 border-transparent hover:border-input"
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Logo for mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <img 
            src="/images/logo-jmario.png" 
            alt="J.Mario" 
            className="h-8 w-auto"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={open}
          >
            <Search className="w-5 h-5" />
          </Button>
          
          <NotificationCenter />
        </div>
      </div>
    </header>
  );
}
