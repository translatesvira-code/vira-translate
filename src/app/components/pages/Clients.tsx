'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianNumbers } from '../../utils/numbers';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { useTab } from '../../context/TabContext';
import { clientsAPI, Client, UpdateClientData } from '../../lib/clients-api';
import { Order } from '../../lib/orders-api';
import { unifiedAPI } from '../../lib/unified-api';

// Client interface is now imported from clients-api

const Clients: React.FC = () => {
  const { setClientProfile } = useTab();
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarClosing, setIsSidebarClosing] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirmModalClosing, setIsConfirmModalClosing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleteModalClosing, setIsDeleteModalClosing] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    serviceType: '',
    translateDate: '',
    deliveryDate: '',
    status: 'accepted' as 'accepted' | 'translating' | 'editing' | 'ready' | 'delivered' | 'archived'
  });

  // Helper functions
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


  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      name: client.name,
      code: client.code,
      serviceType: client.serviceType,
      translateDate: client.translateDate,
      deliveryDate: client.deliveryDate,
      status: client.status
    });
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarClosing(true);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setIsSidebarClosing(false);
      setEditingClient(null);
    }, 300);
  };

  const handleSaveEdit = () => {
    if (editingClient) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmEdit = async () => {
    if (editingClient) {
      try {
        const updateData: UpdateClientData = {
          name: editForm.name,
          code: editForm.code,
          serviceType: editForm.serviceType,
          translateDate: editForm.translateDate,
          deliveryDate: editForm.deliveryDate,
          status: editForm.status
        };

        const updatedClient = await clientsAPI.updateClient(editingClient.id, updateData);
        
        if (updatedClient) {
          setClients(prevClients => 
            prevClients.map(client => 
              client.id === editingClient.id ? updatedClient : client
            )
          );
        } else {
          // Fallback to local state update
          setClients(prevClients => 
            prevClients.map(client => 
              client.id === editingClient.id 
                ? { ...client, ...editForm }
                : client
            )
          );
        }
        
        handleCloseConfirmModal();
        handleCloseSidebar();
        setShowEditSuccess(true);
        
        setTimeout(() => {
          setShowEditSuccess(false);
        }, 5000);
      } catch (error) {
        console.error('Error updating client:', error);
        // Fallback to local state update
        setClients(prevClients => 
          prevClients.map(client => 
            client.id === editingClient.id 
              ? { ...client, ...editForm }
              : client
          )
        );
        handleCloseConfirmModal();
        handleCloseSidebar();
        setShowEditSuccess(true);
      }
    }
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalClosing(true);
    setTimeout(() => {
      setShowConfirmModal(false);
      setIsConfirmModalClosing(false);
    }, 300);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'پذیرش';
      case 'translating': return 'ترجمه';
      case 'editing': return 'ویرایش';
      case 'ready': return 'آماده تحویل';
      case 'delivered': return 'تحویل شده';
      case 'archived': return 'بایگانی';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'translating': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'editing': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'ready': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'delivered': return 'bg-green-100 text-green-800 border border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-blue-800 border-blue-300 hover:bg-blue-50';
      case 'translating': return 'text-orange-800 border-orange-300 hover:bg-orange-50';
      case 'editing': return 'text-purple-800 border-purple-300 hover:bg-purple-50';
      case 'ready': return 'text-yellow-800 border-yellow-300 hover:bg-yellow-50';
      case 'delivered': return 'text-green-800 border-green-300 hover:bg-green-50';
      case 'archived': return 'text-gray-800 border-gray-300 hover:bg-gray-50';
      default: return 'text-gray-800 border-gray-300 hover:bg-gray-50';
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
        serviceType: getTranslationTypeText(order.translationType) || 'ترجمه رسمی',
        translateDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : '',
        deliveryDate: order.status === 'ready' ? new Date(order.updatedAt).toLocaleDateString('fa-IR') : '',
        status: order.status === 'acceptance' ? 'accepted' as const :
                order.status === 'completion' ? 'translating' as const :
                order.status === 'translation' ? 'translating' as const :
                order.status === 'editing' ? 'editing' as const :
                order.status === 'office' ? 'editing' as const :
                order.status === 'ready' ? 'ready' as const :
                'accepted' as const
      }));
      
      // Remove duplicates based on client ID
      const uniqueClients = clientsFromUnified.filter((client, index, self) => 
        index === self.findIndex(c => c.id === client.id)
      );
      
      console.log('✅ Clients created from unified data:', uniqueClients);
      setClients(uniqueClients);
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
      getStatusText(client.status).toLowerCase().includes(searchLower);
    
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
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
    <div className="min-h-screen p-8">
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
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              همه
            </button>
            {['accepted', 'translating', 'editing', 'ready', 'delivered', 'archived'].map((status) => {
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
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64 placeholder-gray-600 text-gray-900"
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
                          onClick={() => setClientProfile(client.name)}
                          className="text-gray-800 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                        >
                          {client.name}
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
                            onClick={() => handleEditClient(client)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors duration-200 cursor-pointer"
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
                className="px-2 py-1 text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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



      {/* Edit Success Message */}
      {showEditSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            تغییرات با موفقیت اعمال شد
          </div>
        </div>
      )}

      {/* Edit Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 backdrop-blur-sm ${
              isSidebarClosing 
                ? 'bg-black bg-opacity-0 animate-[fadeOut_0.3s_ease-out_forwards]' 
                : 'bg-black bg-opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]'
            }`}
            onClick={handleCloseSidebar}
          ></div>
          
          {/* Sidebar */}
          <div className={`w-96 bg-white shadow-xl transform ${
            isSidebarClosing 
              ? 'animate-[sidebarSlideOut_0.3s_ease-out_forwards]' 
              : 'animate-[sidebarSlideIn_0.3s_ease-out_forwards]'
          }`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">ویرایش مراجع</h2>
                <button
                  onClick={handleCloseSidebar}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                />
              </div>

              {/* Code Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">کد سفارش</label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({...editForm, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                />
              </div>

              {/* Service Type Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع خدمت</label>
                <select
                  value={editForm.serviceType}
                  onChange={(e) => setEditForm({...editForm, serviceType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                >
                  <option value="ترجمه رسمی">ترجمه رسمی</option>
                  <option value="ترجمه فوری">ترجمه فوری</option>
                  <option value="ترجمه تخصصی">ترجمه تخصصی</option>
                  <option value="ترجمه ادبی">ترجمه ادبی</option>
                  <option value="ترجمه پزشکی">ترجمه پزشکی</option>
                  <option value="ترجمه حقوقی">ترجمه حقوقی</option>
                  <option value="ترجمه فنی">ترجمه فنی</option>
                  <option value="ترجمه بازرگانی">ترجمه بازرگانی</option>
                </select>
              </div>

              {/* Translate Date Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ ترجمه</label>
                <DatePicker
                  value={editForm.translateDate}
                  onChange={(date) => setEditForm({...editForm, translateDate: date ? date.format() : ''})}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  placeholder="تاریخ ترجمه را انتخاب کنید"
                  className="w-full"
                  inputClass="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Delivery Date Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ تحویل</label>
                <DatePicker
                  value={editForm.deliveryDate}
                  onChange={(date) => setEditForm({...editForm, deliveryDate: date ? date.format() : ''})}
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  placeholder="تاریخ تحویل را انتخاب کنید"
                  className="w-full"
                  inputClass="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Status Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as 'accepted' | 'translating' | 'editing' | 'ready' | 'delivered' | 'archived'})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
                >
                  <option value="accepted">پذیرش</option>
                  <option value="translating">ترجمه</option>
                  <option value="editing">ویرایش</option>
                  <option value="ready">آماده تحویل</option>
                  <option value="delivered">تحویل شده</option>
                  <option value="archived">بایگانی</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
                <button
                  onClick={handleCloseSidebar}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
          </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div className={`absolute inset-0 backdrop-blur-sm ${
            isConfirmModalClosing 
              ? 'bg-black bg-opacity-0 animate-[fadeOut_0.3s_ease-out_forwards]' 
              : 'bg-black bg-opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]'
          }`}></div>
          
          {/* Modal Content */}
          <div className={`relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform scale-95 opacity-0 ${
            isConfirmModalClosing 
              ? 'animate-[modalOut_0.3s_ease-out_forwards]' 
              : 'animate-[modalIn_0.3s_ease-out_forwards]'
          }`}>
            {/* Modal Title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">تأیید تغییرات</h2>

            {/* Modal Body */}
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-600">آیا از اعمال این تغییرات اطمینان دارید؟</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                بله، اعمال کن
              </button>
              <button
                onClick={handleCloseConfirmModal}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                انصراف
              </button>
          </div>
          </div>
        </div>
      )}

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
              <p className="text-sm text-red-600 mt-2">این عمل قابل بازگشت نیست.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
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