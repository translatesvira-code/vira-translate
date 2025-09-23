'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type TabType = 'clients' | 'users' | 'financial' | 'settings' | 'client-profile';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [clientProfileName, setClientProfileName] = useState<string | null>(null);

  // Read tab from URL on mount
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    const clientName = searchParams.get('clientName');
    
    if (tab && ['clients', 'users', 'financial', 'settings', 'client-profile'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (clientName) {
      setClientProfileName(clientName);
    }
  }, [searchParams]);

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'client-profile' && clientProfileName) {
      router.push(`/?tab=${tab}&clientName=${encodeURIComponent(clientProfileName)}`);
    } else {
      router.push(`/?tab=${tab}`);
    }
  };

  const setClientProfile = (clientName: string) => {
    setClientProfileName(clientName);
    setActiveTab('client-profile');
    router.push(`/?tab=client-profile&clientName=${encodeURIComponent(clientName)}`);
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
