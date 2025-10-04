'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianNumbers } from '../../utils/numbers';
import { useTab } from '../../context/TabContext';
import { clientsAPI, Client } from '../../lib/clients-api';
import { UnifiedOrder } from '../../lib/unified-api';
import { unifiedAPI } from '../../lib/unified-api';

// Client interface is now imported from clients-api

const Clients: React.FC = () => {
  const { setClientProfile } = useTab();
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleteModalClosing, setIsDeleteModalClosing] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Helper functions
  const getDisplayName = (client: Client) => {
    // Prioritize company name over personal name
    if (client.company && client.company.trim() !== '') {
      return client.company;
    }
    
    // If no company name, use first and last name
    if (client.firstName && client.lastName) {
      return `${client.firstName} ${client.lastName}`;
    }
    
    // Fallback to the name field
    return client.name || 'نامشخص';
  };
  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        // Find all orders for this client
        const clientOrders = orders.filter(order => order.clientId === clientToDelete.id.toString());
        
        if (clientOrders.length > 0) {
          // Delete all orders for this client
          let allDeleted = true;
          for (const order of clientOrders) {
            const success = await unifiedAPI.deleteUnifiedOrder(order.id, false); // Don't delete client yet
            if (!success) {
              allDeleted = false;
            }
          }
          
          if (allDeleted) {
            // Now delete the client
            const clientDeleteSuccess = await clientsAPI.deleteClient(clientToDelete.id);
            if (clientDeleteSuccess) {
              setClients(prevClients => prevClients.filter(client => client.id !== clientToDelete.id));
              setOrders(prevOrders => prevOrders.filter(order => order.clientId !== clientToDelete.id.toString()));
            }
          }
        } else {
          // No orders, just delete the client
          const success = await clientsAPI.deleteClient(clientToDelete.id);
          if (success) {
            setClients(prevClients => prevClients.filter(client => client.id !== clientToDelete.id));
          }
        }
        
        handleCloseDeleteModal();
      } catch (error) {
        console.error('Error deleting client:', error);
        // Fallback to local state update
        setClients(prevClients => prevClients.filter(client => client.id !== clientToDelete.id));
        setOrders(prevOrders => prevOrders.filter(order => order.clientId !== clientToDelete.id.toString()));
        handleCloseDeleteModal();
      }
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalClosing(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setIsDeleteModalClosing(false);
      setClientToDelete(null);
    }, 300);
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
      case 'acceptance': return 'bg-[#687B6926] text-[#687B69] border border-[#687B6966]';
      case 'completion': return 'bg-[#2B593E26] text-[#2B593E] border border-[#2B593E66]';
      case 'translating': return 'bg-[#A43E2F26] text-[#A43E2F] border border-[#A43E2F66]';
      case 'editing': return 'bg-[#A5B8A326] text-[#A5B8A3] border border-[#A5B8A366]';
      case 'office': return 'bg-[#6A7B7E26] text-[#6A7B7E] border border-[#6A7B7E66]';
      case 'ready': return 'bg-[#2B593E26] text-[#2B593E] border border-[#2B593E66]';
      case 'archived': return 'bg-[#C0B8AC26] text-[#656051] border border-[#C0B8AC66]';
      default: return 'bg-[#C0B8AC26] text-[#656051] border border-[#C0B8AC66]';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'acceptance': return 'text-[#687B69] border-[#687B6966] hover:bg-[#687B6926]';
      case 'completion': return 'text-[#2B593E] border-[#2B593E66] hover:bg-[#2B593E26]';
      case 'translating': return 'text-[#A43E2F] border-[#A43E2F66] hover:bg-[#A43E2F26]';
      case 'editing': return 'text-[#A5B8A3] border-[#A5B8A366] hover:bg-[#A5B8A326]';
      case 'office': return 'text-[#6A7B7E] border-[#6A7B7E66] hover:bg-[#6A7B7E26]';
      case 'ready': return 'text-[#2B593E] border-[#2B593E66] hover:bg-[#2B593E26]';
      case 'archived': return 'text-[#656051] border-[#C0B8AC66] hover:bg-[#C0B8AC26]';
      default: return 'text-[#656051] border-[#C0B8AC66] hover:bg-[#C0B8AC26]';
    }
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

  const getLanguageText = (lang: string) => {
    const languages: Record<string, string> = {
      'persian': 'فارسی',
      'english': 'انگلیسی',
      'arabic': 'عربی',
      'french': 'فرانسوی',
      'german': 'آلمانی',
      'other': 'سایر'
    };
    return languages[lang] || lang;
  };


  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load unified orders with complete client data
      console.log('🔍 Loading unified orders...');
      const unifiedData = await unifiedAPI.getUnifiedOrders();
      console.log('✅ Unified orders loaded:', unifiedData);
      
      // Store orders data
      setOrders(unifiedData.orders);
      
      // Create clients from unified orders data
      const clientsFromUnified = unifiedData.orders.map(order => ({
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
        status: order.status === 'acceptance' ? 'acceptance' as const :
                order.status === 'completion' ? 'completion' as const :
                order.status === 'translation' ? 'translating' as const :
                order.status === 'editing' ? 'editing' as const :
                order.status === 'office' ? 'office' as const :
                order.status === 'ready' ? 'ready' as const :
                order.status === 'archived' ? 'archived' as const :
                'acceptance' as const
      }));
      
      // Remove duplicates based on client ID
      const uniqueClients = clientsFromUnified.filter((client, index, self) => 
        index === self.findIndex(c => c.id === client.id)
      );
      
      // Filter out archived clients from main clients list
      const activeClients = uniqueClients.filter(client => client.status !== 'archived');
      
      console.log('✅ Clients created from unified data:', activeClients);
      setClients(activeClients);
    } catch (error) {
      console.error('Error loading data:', error);
      setClients([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to first page when search term or status changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  // Filter clients based on selected status and search term
  const filteredClients = clients.filter(client => {
    const matchesStatus = !selectedStatus || client.status === selectedStatus;
    
    if (!searchTerm) {
      return matchesStatus;
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
    
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f9f8f5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-800">مراجعین</h1>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="text-gray-600">در حال بارگذاری...</div>
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
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">مراجعین</h1>
          
          {/* Status Filter Buttons */}
          <div className="flex items-center flex-wrap gap-2 w-fit">
            <button
              onClick={() => {
                setSelectedStatus(null);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                selectedStatus === null
                  ? 'bg-[#48453F] text-white border-[#48453F]'
                  : 'text-[#656051] border-[#C0B8AC66] hover:bg-[#E4D8C726]'
              }`}
            >
              همه
            </button>
            {['acceptance', 'completion', 'translating', 'editing', 'office', 'ready', 'archived'].map((status) => {
              const count = clients.filter(client => client.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedStatus === status
                      ? `${getStatusColor(status)}`
                      : `${getStatusTextColor(status)}`
                  }`}
                >
                  {getStatusText(status)} ({toPersianNumbers(count)})
                </button>
              );
            })}
            
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در تمام فیلدها..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#687B69] focus:border-[#687B69] w-64 placeholder-gray-600 text-gray-900"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
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
                  const order = orders.find(o => o.id.toString() === client.id.toString());
                  return (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm text-gray-800">{toPersianNumbers(startIndex + index + 1)}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-mono">{client.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        <button
                          onClick={() => setClientProfile(client.code)}
                          className="text-gray-800 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                        >
                          {getDisplayName(client)}
                        </button>
                      </td>
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
                            className="bg-[#A43E2F26] hover:bg-[#A43E2F40] text-[#A43E2F] p-2 rounded-lg transition-colors duration-200 cursor-pointer"
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

        {/* Table Controls - RTL Layout */}
        <div className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 space-x-reverse">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            <div className="text-gray-600 font-medium">
              {filteredClients.length === 0 ? (
                '۰ - ۰ از ۰'
              ) : (
                `${toPersianNumbers(startIndex + 1)} - ${toPersianNumbers(Math.min(endIndex, filteredClients.length))} از ${toPersianNumbers(filteredClients.length)}`
              )}
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-gray-600 font-medium">تعداد ردیف در صفحه:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#687B69] focus:border-[#687B69] cursor-pointer"
              >
                <option value={5}>{toPersianNumbers(5)}</option>
                <option value={10}>{toPersianNumbers(10)}</option>
                <option value={20}>{toPersianNumbers(20)}</option>
                <option value={50}>{toPersianNumbers(50)}</option>
              </select>
            </div>
          </div>
        </div>
                </div>




      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div className={`absolute inset-0 backdrop-blur-sm ${
            isDeleteModalClosing 
              ? 'bg-black bg-opacity-0 animate-[fadeOut_0.3s_ease-out_forwards]' 
              : 'bg-black bg-opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]'
          }`}></div>
          
          {/* Modal Content */}
          <div className={`relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform scale-95 opacity-0 ${
            isDeleteModalClosing 
              ? 'animate-[modalOut_0.3s_ease-out_forwards]' 
              : 'animate-[modalIn_0.3s_ease-out_forwards]'
          }`}>
            {/* Modal Title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">تأیید حذف</h2>

            {/* Modal Body */}
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">آیا از حذف این مراجع اطمینان دارید؟</p>
              {clientToDelete && (
                <p className="text-sm text-gray-500 font-medium">
                  {clientToDelete.name} - {clientToDelete.code}
                </p>
              )}
              <p className="text-sm text-[#A43E2F] mt-2">این عمل قابل بازگشت نیست.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-[#A43E2F] hover:bg-[#A43E2F] text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                بله، حذف کن
              </button>
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                انصراف
              </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Clients;