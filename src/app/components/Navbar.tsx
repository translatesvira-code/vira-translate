'use client';

import React from 'react';
import { useTab, TabType } from '../context/TabContext';

const tabs = [
  { id: 'clients' as TabType, label: 'مراجعین' },
  { id: 'users' as TabType, label: 'کاربران' },
  { id: 'financial' as TabType, label: 'مدیریت مالی' },
  { id: 'settings' as TabType, label: 'تنظیمات' },
];

const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useTab();

  return (
    <div className="fixed right-0 top-0 h-full w-64 bg-white border-l border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">پنل مدیریت</h1>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-right px-4 py-3 rounded-lg transition-colors duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">احمد محمدی</p>
            <p className="text-xs text-gray-500">مدیر سیستم</p>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;