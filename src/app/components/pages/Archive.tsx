'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianNumbers } from '../../utils/numbers';
import { clientsAPI, Client } from '../../lib/clients-api';
import { unifiedAPI, UnifiedOrder } from '../../lib/unified-api';
import Notification from '../Notification';

const Archive: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirmModalClosing, setIsConfirmModalClosing] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  const getTranslationTypeText = (type: string) => {
    const types: Record<string, string> = {
      'certified': 'ترجمه رسمی',
      'simple': 'ترجمه ساده',
      'sworn': 'ترجمه سوگند',
      'notarized': 'ترجمه محضری'
    };
    return types[type] || type;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Load unified orders with complete client data
      const unifiedData = await unifiedAPI.getUnifiedOrders();
      
      // Store orders data
      setOrders(unifiedData.orders);
      
      // Create clients from unified orders data and filter only archived ones
      const archivedClients = unifiedData.orders
        .filter(order => order.status === 'archived')
        .map(order => ({
          id: Number(order.clientId),
          code: order.clientCode,
          name: order.clientName,
          firstName: order.clientFirstName,
          lastName: order.clientLastName,
          company: order.clientCompany,
          phone: order.clientPhone,
          email: order.clientEmail,
          address: order.clientAddress,
          nationalId: order.clientNationalId,
          serviceType: getTranslationTypeText(order.translationType) || 'ترجمه رسمی',
          translateDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : '',
          deliveryDate: order.status === 'ready' ? new Date(order.updatedAt).toLocaleDateString('fa-IR') : '',
          status: 'archived' as const
        }));
      
      // Remove duplicates based on client ID
      const uniqueArchivedClients = archivedClients.filter((client, index, self) => 
        index === self.findIndex(c => c.id === client.id)
      );
      
      setClients(uniqueArchivedClients);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('خطا در بارگذاری اطلاعات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        const success = await clientsAPI.deleteClient(clientToDelete.id);
        if (success) {
          setClients(prevClients => 
            prevClients.filter(client => client.id !== clientToDelete.id)
          );
          setShowDeleteSuccess(true);
          setTimeout(() => {
            setShowDeleteSuccess(false);
          }, 5000);
        } else {
          showNotification('خطا در حذف مشتری', 'error');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        showNotification('خطا در حذف مشتری', 'error');
      }
    }
    handleCloseConfirmModal();
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalClosing(true);
    setTimeout(() => {
      setShowConfirmModal(false);
      setIsConfirmModalClosing(false);
      setClientToDelete(null);
    }, 300);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['کد سفارش', 'نام مشتری', 'نوع ترجمه', 'زبان', 'تعداد صفحات', 'تاریخ ثبت', 'وضعیت'],
      ...(clients || []).map(client => {
        const order = (orders || []).find(o => o.id.toString() === client.id.toString());
        return [
          client.code,
          client.name,
          client.serviceType,
          order ? `${order.languageFrom} → ${order.languageTo}` : '-',
          order ? order.numberOfPages.toString() : '-',
          client.translateDate,
          getStatusText(client.status)
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `archived_clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'acceptance': return 'پذیرش';
      case 'completion': return 'تکمیل اطلاعات';
      case 'translating': return 'ترجمه';
      case 'editing': return 'ویرایش';
      case 'office': return 'امور دفتری';
      case 'ready': return 'آماده تحویل';
      case 'archived': return 'بایگانی';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acceptance': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'completion': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'translating': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'editing': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'office': return 'bg-pink-100 text-pink-800 border border-pink-200';
      case 'ready': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getLanguageText = (langCode: string) => {
    const languages: { [key: string]: string } = {
      'fa': 'فارسی',
      'en': 'انگلیسی',
      'ar': 'عربی',
      'fr': 'فرانسوی',
      'de': 'آلمانی',
      'es': 'اسپانیایی',
      'it': 'ایتالیایی',
      'ru': 'روسی',
      'zh': 'چینی',
      'ja': 'ژاپنی',
      'ko': 'کره‌ای',
      'tr': 'ترکی',
      'ur': 'اردو'
    };
    return languages[langCode] || langCode;
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter clients based on search term (all clients are already archived)
  const filteredClients = (clients || []).filter(client => {
    if (!searchTerm) {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      client.name.toLowerCase().includes(searchLower) ||
      client.code.toLowerCase().includes(searchLower) ||
      client.serviceType.toLowerCase().includes(searchLower) ||
      client.translateDate.includes(searchTerm) ||
      client.deliveryDate.includes(searchTerm) ||
      getStatusText(client.status).toLowerCase().includes(searchLower) ||
      (client.company && client.company.toLowerCase().includes(searchLower)) ||
      (client.firstName && client.firstName.toLowerCase().includes(searchLower)) ||
      (client.lastName && client.lastName.toLowerCase().includes(searchLower));
    
    return matchesSearch;
  });

  const totalPages = Math.ceil((filteredClients || []).length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = (filteredClients || []).slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f4f1' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#4b483f' }}></div>
              <p style={{ color: '#4b483f' }}>در حال بارگذاری...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f4f1' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold" style={{ color: '#4b483f' }}>بایگانی</h1>
            
            {/* Export Button */}
            
          </div>
          
          {/* Search Box */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در تمام فیلدها..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64 placeholder-gray-600 text-gray-900"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          <div>
              <button
                onClick={handleExportCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                خروجی CSV
              </button>
            </div>
            
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">ردیف</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">کد سفارش</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">نام مشتری</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">نوع ترجمه</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">زبان</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">تعداد صفحات</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">تاریخ ثبت</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">وضعیت</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentClients.map((client, index) => {
                  const order = (orders || []).find(o => o.id.toString() === client.id.toString());
                  const displayName = (client.company && client.company.trim()) ? client.company : client.name;
                  return (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm text-gray-800">{toPersianNumbers(startIndex + index + 1)}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-mono">{client.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{displayName}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{client.serviceType}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {order ? `${getLanguageText(order.languageFrom)} → ${getLanguageText(order.languageTo)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {order ? toPersianNumbers(order.numberOfPages) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{client.translateDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                          {getStatusText(client.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-start gap-1">
                          <button 
                            onClick={() => handleDeleteClient(client)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              نمایش{' '}
              {toPersianNumbers(startIndex + 1)} - {toPersianNumbers(Math.min(endIndex, filteredClients.length))} از{' '}
              {toPersianNumbers(filteredClients.length)} مورد
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                قبلی
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {toPersianNumbers(page)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                بعدی
              </button>
            </div>
          </div>
        )}

        {/* Success Messages */}
        {showDeleteSuccess && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
              مشتری با موفقیت حذف شد
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
            isConfirmModalClosing ? 'opacity-0' : 'opacity-100'
          }`}>
            <div className={`bg-white rounded-lg p-6 max-w-md w-full mx-4 transform transition-all duration-300 ${
              isConfirmModalClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            }`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">تأیید حذف</h3>
              <p className="text-gray-600 mb-6">
                آیا مطمئن هستید که می‌خواهید مشتری &quot;{clientToDelete?.name}&quot; را حذف کنید؟
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseConfirmModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        <Notification
          show={notification.show}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ show: false, message: '', type: 'success' })}
        />
      </div>
    </div>
  );
};

export default Archive;

