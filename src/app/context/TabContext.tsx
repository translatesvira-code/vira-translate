'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export type TabType = 'order-wizard' | 'clients' | 'users' | 'financial' | 'settings' | 'client-profile';

interface TabContextType {
  activeTab: TabType;
  clientProfileName: string | null;
  setActiveTab: (tab: TabType) => void;
  setClientProfile: (clientName: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTab = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
};

interface TabProviderProps {
  children: ReactNode;
}

export const TabProvider: React.FC<TabProviderProps> = ({ children }) => {
  // const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('order-wizard');
  const [clientProfileName, setClientProfileName] = useState<string | null>(null);

  // Read tab from URL on mount
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    const clientName = searchParams.get('clientName');
    
    if (tab && ['order-wizard', 'clients', 'users', 'financial', 'settings', 'client-profile'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (clientName) {
      setClientProfileName(clientName);
    }
  }, [searchParams]);

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    // Only update URL without causing page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    if (tab === 'client-profile' && clientProfileName) {
      url.searchParams.set('clientName', clientProfileName);
    } else {
      url.searchParams.delete('clientName');
    }
    window.history.pushState({}, '', url.toString());
  };

  const setClientProfile = (clientName: string) => {
    setClientProfileName(clientName);
    setActiveTab('client-profile');
    // Only update URL without causing page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'client-profile');
    url.searchParams.set('clientName', clientName);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <TabContext.Provider value={{ 
      activeTab, 
      clientProfileName, 
      setActiveTab: handleSetActiveTab, 
      setClientProfile 
    }}>
      {children}
    </TabContext.Provider>
  );
};
