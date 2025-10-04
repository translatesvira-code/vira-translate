'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TabProvider } from '../context/TabContext';
import Sidebar from '../components/Navbar';
import Content from '../components/Content';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f4f1' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#4b483f' }}></div>
          <p style={{ color: '#4b483f' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
