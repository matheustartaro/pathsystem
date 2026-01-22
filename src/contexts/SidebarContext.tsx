import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 4 estados de expansão da sidebar
export type SidebarState = 'minimal' | 'icons' | 'expanded' | 'dual-pane';

interface SidebarContextType {
  state: SidebarState;
  setState: (state: SidebarState) => void;
  activeGroup: string | null;
  setActiveGroup: (group: string | null) => void;
  locked: boolean;
  setLocked: (locked: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SidebarState>(() => {
    const saved = localStorage.getItem('sidebar-state');
    return (saved as SidebarState) || 'icons';
  });
  
  const [locked, setLocked] = useState(() => {
    const saved = localStorage.getItem('sidebar-locked');
    return saved ? JSON.parse(saved) : false;
  });

  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('sidebar-state', state);
  }, [state]);

  useEffect(() => {
    localStorage.setItem('sidebar-locked', JSON.stringify(locked));
  }, [locked]);

  return (
    <SidebarContext.Provider value={{ 
      state,
      setState,
      activeGroup,
      setActiveGroup,
      locked, 
      setLocked
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
