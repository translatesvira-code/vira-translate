'use client';

import React from 'react';
import { useTab } from '../context/TabContext';
import Clients from './pages/Clients';
import Users from './pages/Users';
import Financial from './pages/Financial';
import Settings from './pages/Settings';
import ClientProfile from './pages/ClientProfile';
import OrderWizard from './pages/OrderWizard';

const Content: React.FC = () => {
  const { activeTab, clientProfileName } = useTab();

  const renderContent = () => {
    switch (activeTab) {
      case 'clients':
        return <Clients />;
      case 'users':
        return <Users />;
      case 'financial':
        return <Financial />;
      case 'settings':
        return <Settings />;
      case 'client-profile':
        return <ClientProfile clientName={clientProfileName || ''} />;
      case 'order-wizard':
        return <OrderWizard />;
      default:
        return <Clients />;
    }
  };

  return (
    <div className="transition-all duration-300 ease-in-out">
      {renderContent()}
    </div>
  );
};

export default Content;
