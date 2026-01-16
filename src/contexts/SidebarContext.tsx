import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  locked: boolean;
  setLocked: (locked: boolean) => void;
  openMenus: string[];
  toggleMenu: (label: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [locked, setLocked] = useState(() => {
    const saved = localStorage.getItem('sidebar-locked');
    return saved ? JSON.parse(saved) : false;
  });

  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-open-menus');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar-locked', JSON.stringify(locked));
  }, [locked]);

  useEffect(() => {
    localStorage.setItem('sidebar-open-menus', JSON.stringify(openMenus));
  }, [openMenus]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label) 
        : [...prev, label]
    );
  };

  return (
    <SidebarContext.Provider value={{ 
      collapsed, 
      setCollapsed, 
      locked, 
      setLocked,
      openMenus,
      toggleMenu
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
}
