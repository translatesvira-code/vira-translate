'use client';

import { Suspense } from 'react';
import { TabProvider } from './context/TabContext';
import Sidebar from './components/Navbar';
import Content from './components/Content';

function HomeContent() {
  return (
    <TabProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="mr-64">
          <Content />
        </div>
      </div>
    </TabProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
