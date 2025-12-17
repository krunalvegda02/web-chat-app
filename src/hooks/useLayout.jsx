import { createContext, useContext, useState, useCallback } from 'react';

const LayoutContext = createContext(null);

export const LayoutProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const value = {
    collapsed,
    sidebarHovered,
    setCollapsed,
    setSidebarHovered,
    toggleSidebar,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
};
