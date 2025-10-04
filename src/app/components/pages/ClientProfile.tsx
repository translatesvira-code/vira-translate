'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toPersianNumbers } from '../../utils/numbers';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { unifiedAPI, UnifiedOrder } from '../../lib/unified-api';

interface Client {
  id: number;
  code: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  nationalId?: string;
  serviceType: string;
  translateDate: string;
  deliveryDate: string;
  status: 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived';
}

interface ClientProfileProps {
  clientName: string;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ clientName }) => {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'userInfo' | 'visits' | 'financial'>('userInfo');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isStatusModalClosing, setIsStatusModalClosing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showStatusSuccess, setShowStatusSuccess] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditModalClosing, setIsEditModalClosing] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    serviceType: '',
    translateDate: '',
    deliveryDate: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleteModalClosing, setIsDeleteModalClosing] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<UnifiedOrder | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  interface UploadedFile {
    id: string;
    name: string;
    title: string;
    category: 'original' | 'translated' | 'scanned_translated';
    size: number;
    type: string;
    uploadDate: string;
    file: File;
  }

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingFileTitle, setEditingFileTitle] = useState<string | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Helper function to get display name

  const getDisplayName = (client: Client): string => {
    // Priority: company > name > firstName + lastName
    if (client.company && client.company.trim()) {
      return client.company.trim();
    }
    if (client.name && client.name.trim()) {
      return client.name.trim();
    }
    if (client.firstName || client.lastName) {
      return `${client.firstName || ''} ${client.lastName || ''}`.trim();
    }
    return 'نامشخص';
  };

  const loadOrders = useCallback(async () => {
    try {
      const unifiedData = await unifiedAPI.getUnifiedOrders();
      
      // Filter orders for this specific client by client code
      const clientOrders = unifiedData.orders.filter(order => order.clientCode === clientName);
      setOrders(clientOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }, [clientName]);

  useEffect(() => {
    const loadClient = async () => {
      setLoading(true);
      try {
        // Load clients from unified orders API
        const unifiedData = await unifiedAPI.getUnifiedOrders();
        
        // Group orders by client code and get the latest order for each client
        const clientGroups = unifiedData.orders.reduce((groups, order) => {
          const clientCode = order.clientCode;
          if (!groups[clientCode]) {
            groups[clientCode] = [];
          }
          groups[clientCode].push(order);
          return groups;
        }, {} as Record<string, typeof unifiedData.orders>);
        
        // Create clients from unified orders data, using the latest order for status
        const clientsFromUnified = Object.values(clientGroups).map(clientOrders => {
          // Sort by updatedAt to get the latest order
          const latestOrder = clientOrders.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          
          return {
            id: Number(latestOrder.clientId),
            code: latestOrder.clientCode,
            name: latestOrder.clientName,
            firstName: latestOrder.clientFirstName,
            lastName: latestOrder.clientLastName,
            company: latestOrder.clientCompany,
            phone: latestOrder.clientPhone,
            email: latestOrder.clientEmail,
            address: latestOrder.clientAddress,
            nationalId: latestOrder.clientNationalId,
            serviceType: latestOrder.serviceType || 'ترجمه',
            translateDate: latestOrder.createdAt ? new Date(latestOrder.createdAt).toLocaleDateString('fa-IR') : '',
            deliveryDate: latestOrder.status === 'ready' ? new Date(latestOrder.updatedAt).toLocaleDateString('fa-IR') : '',
            status: latestOrder.status === 'acceptance' ? 'acceptance' as const :
                    latestOrder.status === 'completion' ? 'completion' as const :
                    latestOrder.status === 'translation' ? 'translating' as const :
                    latestOrder.status === 'editing' ? 'editing' as const :
                    latestOrder.status === 'office' ? 'office' as const :
                    latestOrder.status === 'ready' ? 'ready' as const :
                    'acceptance' as const
          };
        });
        
        // No need to remove duplicates since we already grouped by client code
        const uniqueClients = clientsFromUnified;
        
        // Find client by code (since we're passing client.code from Clients component)
        const foundClient = uniqueClients.find(client => client.code === clientName);
        
        if (foundClient) {
          setClient(foundClient);
          
          // Find the latest order for this client to get special instructions
          const clientOrders = clientGroups[foundClient.code] || [];
          const latestOrder = clientOrders.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          
          // Set description from latest order's special instructions
          setDescription(latestOrder?.specialInstructions || '');
        } else {
          console.log('Client not found:', clientName);
          setClient(null);
        }
      } catch (error) {
        console.error('Error loading client:', error);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    loadClient();
    
    // Load orders for this client
    loadOrders();
  }, [clientName, loadOrders]);

  const handleBack = () => {
    router.push('/?tab=clients');
  };

  const handleEditDescription = () => {
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    setIsEditingDescription(false);
    setShowSaveMessage(true);
    // Here you can save the description to your backend
    console.log('Description saved:', description);
    
    setTimeout(() => {
      setShowSaveMessage(false);
    }, 3000);
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    // Reset to original description
    setDescription('این پروژه شامل ترجمه متون تخصصی با بالاترین کیفیت و دقت می‌باشد. تمامی مراحل ترجمه، ویرایش و بازخوانی با دقت انجام خواهد شد.');
  };

  const handleStatusClick = (status: string) => {
    if (client && status !== client.status) {
      setSelectedStatus(status);
      setShowStatusModal(true);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (client && selectedStatus) {
      try {
        // First, update the order status in the backend for all orders of this client
        const clientOrders = orders.filter(o => o.clientCode === client.code);
        
        for (const order of clientOrders) {
          // Map client status to order status
          const orderStatus = selectedStatus === 'translating' ? 'translation' : selectedStatus;
          
          const success = await unifiedAPI.updateOrderStatus(
            order.id, 
            orderStatus, 
            'user', 
            `وضعیت سفارش از پروفایل مشتری به ${getStatusText(selectedStatus)} تغییر یافت`
          );
          
          if (!success) {
            console.error(`Failed to update order ${order.id} status`);
          }
        }
        
        // Update local client state immediately (since we already updated orders in backend)
        setClient(prev => prev ? { ...prev, status: selectedStatus as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived' } : null);
        
        // Update local orders state to reflect the new status
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.clientCode === client.code
              ? { ...order, status: selectedStatus === 'translating' ? 'translation' : selectedStatus as 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready' }
              : order
          )
        );
        
        handleCloseStatusModal();
        setShowStatusSuccess(true);
        
        setTimeout(() => {
          setShowStatusSuccess(false);
        }, 3000);
      } catch (error) {
        console.error('Error updating client status:', error);
        // Fallback to local state update
        setClient(prev => prev ? { ...prev, status: selectedStatus as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived' } : null);
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.clientId === client.id.toString() 
              ? { ...order, status: selectedStatus === 'translating' ? 'translation' : selectedStatus as 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready' }
              : order
          )
        );
        handleCloseStatusModal();
        setShowStatusSuccess(true);
        
        setTimeout(() => {
          setShowStatusSuccess(false);
        }, 3000);
      }
    }
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalClosing(true);
    setTimeout(() => {
      setShowStatusModal(false);
      setIsStatusModalClosing(false);
      setSelectedStatus('');
    }, 300);
  };

  const handleEditField = (field: string) => {
    if (client) {
      setEditingField(field);
      setEditForm({
        name: client.name,
        code: client.code,
        serviceType: client.serviceType,
        translateDate: client.translateDate,
        deliveryDate: client.deliveryDate
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = () => {
    if (client && editingField) {
      setClient(prev => prev ? { ...prev, ...editForm } : null);
      handleCloseEditModal();
      setShowEditSuccess(true);
      
      setTimeout(() => {
        setShowEditSuccess(false);
      }, 3000);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalClosing(true);
    setTimeout(() => {
      setShowEditModal(false);
      setIsEditModalClosing(false);
      setEditingField(null);
    }, 300);
  };

  const handleDeleteOrder = (order: UnifiedOrder) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteOrder = async () => {
    if (orderToDelete) {
      try {
        console.log('🗑️ Deleting order:', orderToDelete);
        const success = await unifiedAPI.deleteUnifiedOrder(orderToDelete.id, false);
        
        if (success) {
          // Remove order from local state
          setOrders(prevOrders => prevOrders.filter(order => order.id !== orderToDelete.id));
          setShowDeleteSuccess(true);
          
          setTimeout(() => {
            setShowDeleteSuccess(false);
          }, 3000);
        } else {
          console.error('Failed to delete order');
        }
        
        handleCloseDeleteModal();
      } catch (error) {
        console.error('Error deleting order:', error);
        handleCloseDeleteModal();
      }
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalClosing(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setIsDeleteModalClosing(false);
      setOrderToDelete(null);
    }, 300);
  };

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        title: file.name.split('.')[0], // استفاده از نام فایل بدون پسوند به عنوان تایتل پیش‌فرض
        category: 'original' as 'original' | 'translated' | 'scanned_translated', // دسته‌بندی پیش‌فرض
        size: file.size,
        type: file.type,
        uploadDate: new Date().toLocaleDateString('fa-IR'),
        file: file // ذخیره فایل اصلی
      };
      setUploadedFiles(prev => [...prev, newFile]);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image') || fileType.includes('jpeg') || fileType.includes('jpg') || fileType.includes('png') || fileType.includes('gif')) return '🖼️';
    return '📁';
  };

  const handleEditFileTitle = (fileId: string, currentTitle: string) => {
    setEditingFileTitle(fileId);
    setFileTitle(currentTitle);
  };

  const handleSaveFileTitle = (fileId: string) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, title: fileTitle }
          : file
      )
    );
    setEditingFileTitle(null);
    setFileTitle('');
  };

  const handleCancelEditFileTitle = () => {
    setEditingFileTitle(null);
    setFileTitle('');
  };

  const handleCategoryChange = (fileId: string, category: 'original' | 'translated' | 'scanned_translated') => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, category }
          : file
      )
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'original': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'translated': return 'bg-green-100 text-green-800 border-green-200';
      case 'scanned_translated': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredFiles = selectedCategory === 'all' 
    ? uploadedFiles 
    : uploadedFiles.filter(file => file.category === selectedCategory);

  const handleViewFile = (file: UploadedFile) => {
    if (file.type.includes('image')) {
      // برای عکس‌ها لایت‌باکس نمایش بده
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setLightboxImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file.file);
    } else if (file.type.includes('pdf')) {
      // برای PDF ها در تب جدید باز کن
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const pdfUrl = e.target.result as string;
          window.open(pdfUrl, '_blank');
        }
      };
      reader.readAsDataURL(file.file);
    }
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const handleDownloadFile = (file: UploadedFile) => {
    // ایجاد لینک دانلود
    const url = URL.createObjectURL(file.file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f4f1' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 transition-colors duration-200 cursor-pointer"
              style={{ color: '#4b483f' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              بازگشت به لیست مراجعین
            </button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#4b483f' }}></div>
                <span style={{ color: '#4b483f' }}>در حال بارگذاری...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f4f1' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              بازگشت به لیست مراجعین
            </button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">مراجع یافت نشد</h1>
              <p className="text-gray-600">اطلاعات مراجع مورد نظر یافت نشد.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f4f1' }}>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 transition-colors duration-200 cursor-pointer"
            style={{ color: '#4b483f' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            بازگشت به لیست مراجعین
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                پروفایل: {getDisplayName(client)}
              </h1>
              <p className="text-gray-600">کد سفارش: {toPersianNumbers(client.code)}</p>
            </div>
            <div className="text-left">
              <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(client.status)}`}>
                {getStatusText(client.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('userInfo')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'userInfo'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              اطلاعات کاربری
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'visits'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              مراجعات
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'financial'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              مالی
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'userInfo' && (
          <div className="grid grid-cols-1 gap-4">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              اطلاعات شخصی
            </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Company Name */}
                {client.company && client.company.trim() && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">نام شرکت</label>
                      <button
                        onClick={() => handleEditField('company')}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-medium text-gray-800">{client.company}</p>
                  </div>
                )}
                
                {/* Personal Name */}
                {(client.firstName || client.lastName || client.name) && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">نام و نام خانوادگی</label>
                      <button
                        onClick={() => handleEditField('name')}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-medium text-gray-800">
                      {client.firstName && client.lastName 
                        ? `${client.firstName} ${client.lastName}`
                        : client.name
                      }
                    </p>
                  </div>
                )}
                
                {/* Contact Information */}
                {client.phone && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">شماره تلفن</label>
                      <button
                        onClick={() => handleEditField('phone')}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-medium text-gray-800">{client.phone}</p>
                  </div>
                )}
                
                {client.email && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">ایمیل</label>
                      <button
                        onClick={() => handleEditField('email')}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-medium text-gray-800">{client.email}</p>
                  </div>
                )}
                
                {client.address && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">آدرس</label>
                      <button
                        onClick={() => handleEditField('address')}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-medium text-gray-800">{client.address}</p>
                  </div>
                )}
                
                {client.nationalId && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">کد ملی</label>
                      <button
                        onClick={() => handleEditField('nationalId')}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-medium text-gray-800">{client.nationalId}</p>
                  </div>
                )}
                
                {/* Service Information */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <label className="text-sm text-gray-500 block mb-1">کد مشتری</label>
                  <p className="font-medium text-gray-800">{client.code}</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-gray-500">نوع خدمات</label>
                    <button
                      onClick={() => handleEditField('serviceType')}
                      className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="font-medium text-gray-800">{client.serviceType}</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm text-gray-500">تاریخ پذیرش</label>
                    <button
                      onClick={() => handleEditField('translateDate')}
                      className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="font-medium text-gray-800">{client.translateDate}</p>
                </div>
                
                {client.deliveryDate && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-500">تاریخ تحویل</label>
                      <button
                        onClick={() => handleEditField('deliveryDate')}
                        className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="font-medium text-gray-800">{client.deliveryDate}</p>
                  </div>
                )}
                
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <label className="text-sm text-gray-500 block mb-1">وضعیت</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                    {getStatusText(client.status)}
                  </span>
                </div>
              </div>
          </div>

          {/* Service Details and Project Progress - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Service Details */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              جزئیات خدمات
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">نوع خدمت درخواستی</h3>
                <p className="text-gray-600">{client.serviceType}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">توضیحات</h3>
                  {!isEditingDescription && (
                    <button
                      onClick={handleEditDescription}
                      className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm resize-none"
                      rows={4}
                      placeholder="توضیحات پروژه را وارد کنید..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveDescription}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
                      >
                        ذخیره
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-1 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">
                    {description}
                  </p>
                )}
              </div>
            </div>
            </div>

            {/* Project Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              پیشرفت پروژه
            </h2>
            <div className="space-y-1">
              {['acceptance', 'completion', 'translating', 'editing', 'office', 'ready', 'archived'].map((status, index) => {
                const isActive = status === client.status && client.status !== 'archived';
                const currentStatusIndex = ['acceptance', 'completion', 'translating', 'editing', 'office', 'ready', 'archived'].indexOf(client.status);
                const isCompleted = currentStatusIndex > index || client.status === 'archived';
                const isClickable = status !== client.status;
                
                return (
                  <div key={status} className="relative">
                    {/* Status Item */}
                    <div 
                      className={`flex items-center gap-4 p-1 rounded-lg border transition-all duration-200 ${
                        isClickable 
                          ? 'cursor-pointer hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm' 
                          : 'cursor-default'
                      } ${
                        isActive 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : isCompleted 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => handleStatusClick(status)}
                    >
                      {/* Status Circle */}
                      <div className="relative z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                          isActive 
                            ? 'bg-blue-500 border-blue-500 text-white' 
                            : isCompleted 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'bg-white border-gray-300 text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Content */}
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className={`text-sm font-medium ${
                            isActive 
                              ? 'text-blue-700' 
                              : isCompleted 
                                ? 'text-green-700' 
                                : 'text-gray-500'
                          }`}>
                            {getStatusText(status)}
                          </span>
                          {isActive && (
                            <p className="text-xs text-blue-600 mt-1">وضعیت فعلی</p>
                          )}
                        </div>
                        
                        {/* Click Indicator */}
                        {isClickable && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <span className="text-xs">کلیک کنید</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>

          {/* Document Upload Section - Compact */}
          <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              آپلود مدارک کاربر
            </h2>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    فایل‌های خود را اینجا بکشید یا کلیک کنید
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    فقط PDF و تصاویر (JPG, PNG, GIF)
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer inline-block"
                  >
                    انتخاب فایل
                  </label>
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <div className="flex gap-1 mb-3 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    همه ({uploadedFiles.length})
                  </button>
                  <button
                    onClick={() => setSelectedCategory('original')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      selectedCategory === 'original'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    اسکن اصلی ({uploadedFiles.filter(f => f.category === 'original').length})
                  </button>
                  <button
                    onClick={() => setSelectedCategory('translated')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      selectedCategory === 'translated'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    متن ترجمه ({uploadedFiles.filter(f => f.category === 'translated').length})
                  </button>
                  <button
                    onClick={() => setSelectedCategory('scanned_translated')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      selectedCategory === 'scanned_translated'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    اسکن ترجمه ({uploadedFiles.filter(f => f.category === 'scanned_translated').length})
                  </button>
                </div>

                {/* Uploaded Files List */}
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                    >
                      {editingFileTitle === file.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={fileTitle}
                            onChange={(e) => setFileTitle(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="عنوان فایل"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSaveFileTitle(file.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs rounded transition-colors duration-200 cursor-pointer"
                            >
                              ذخیره
                            </button>
                            <button
                              onClick={handleCancelEditFileTitle}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 text-xs rounded transition-colors duration-200 cursor-pointer"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* تایتل و Select در یک خط */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-gray-800 text-sm truncate">{file.title}</p>
                              <button
                                onClick={() => handleEditFileTitle(file.id, file.title)}
                                className="text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer flex-shrink-0"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                            <select
                              value={file.category}
                              onChange={(e) => handleCategoryChange(file.id, e.target.value as 'original' | 'translated' | 'scanned_translated')}
                              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(file.category)}`}
                            >
                              <option value="original">اسکن اصلی</option>
                              <option value="translated">متن ترجمه</option>
                              <option value="scanned_translated">اسکن ترجمه</option>
                            </select>
                          </div>
                          
                          {/* آیکون، نام فایل، تاریخ و دکمه‌ها در یک خط */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getFileIcon(file.type)}</span>
                              <div>
                                <p className="text-xs text-gray-500 truncate">{file.name}</p>
                                <p className="text-xs text-gray-400">
                                  {formatFileSize(file.size)} • {file.uploadDate}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleViewFile(file)}
                                className="text-blue-600 hover:text-blue-800 p-1 transition-colors duration-200 cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDownloadFile(file)}
                                className="text-green-600 hover:text-green-800 p-1 transition-colors duration-200 cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeFile(file.id)}
                                className="text-red-600 hover:text-red-800 p-1 transition-colors duration-200 cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              تاریخچه مراجعات
            </h2>
            
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">کد سفارش</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">کد کاربر</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">نوع ترجمه</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">نوع سند</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">زبان</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">تعداد صفحات</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">وضعیت</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">تاریخ ایجاد</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{order.orderCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{order.clientCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.translationType}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.documentType}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.languageFrom} → {order.languageTo}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{toPersianNumbers(order.numberOfPages.toString())}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'acceptance' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'completion' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'translation' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'editing' ? 'bg-orange-100 text-orange-800' :
                            order.status === 'office' ? 'bg-indigo-100 text-indigo-800' :
                            order.status === 'ready' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'acceptance' ? 'پذیرش' :
                             order.status === 'completion' ? 'تکمیل اطلاعات' :
                             order.status === 'translation' ? 'ترجمه' :
                             order.status === 'editing' ? 'ویرایش' :
                             order.status === 'office' ? 'امور دفتری' :
                             order.status === 'ready' ? 'آماده تحویل' :
                             order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 cursor-pointer"
                            title="حذف سفارش"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">هیچ سفارشی برای این مشتری ثبت نشده است</p>
              </div>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              اطلاعات مالی
            </h2>
            
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">این بخش در حال توسعه است</p>
            </div>
          </div>
        )}


        {/* Status Change Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div className={`absolute inset-0 backdrop-blur-sm ${
              isStatusModalClosing 
                ? 'bg-black bg-opacity-0 animate-[fadeOut_0.3s_ease-out_forwards]' 
                : 'bg-black bg-opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]'
            }`}></div>
            
            {/* Modal Content */}
            <div className={`relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform scale-95 opacity-0 ${
              isStatusModalClosing 
                ? 'animate-[modalOut_0.3s_ease-out_forwards]' 
                : 'animate-[modalIn_0.3s_ease-out_forwards]'
            }`}>
              {/* Modal Title */}
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">تأیید تغییر وضعیت</h2>

              {/* Modal Body */}
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2">
                  آیا می‌خواهید وضعیت پروژه را تغییر دهید؟
                </p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-gray-500">از:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client?.status || 'acceptance')}`}>
                    {getStatusText(client?.status || 'acceptance')}
                  </span>
                  <span className="text-gray-500">به:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedStatus)}`}>
                    {getStatusText(selectedStatus)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmStatusChange}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
                >
                  بله، تغییر کن
                </button>
                <button
                  onClick={handleCloseStatusModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Success Message */}
        {showSaveMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              توضیحات با موفقیت ذخیره شد
            </div>
          </div>
        )}

        {/* Edit Field Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div className={`absolute inset-0 backdrop-blur-sm ${
              isEditModalClosing 
                ? 'bg-black bg-opacity-0 animate-[fadeOut_0.3s_ease-out_forwards]' 
                : 'bg-black bg-opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]'
            }`}></div>
            
            {/* Modal Content */}
            <div className={`relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform scale-95 opacity-0 ${
              isEditModalClosing 
                ? 'animate-[modalOut_0.3s_ease-out_forwards]' 
                : 'animate-[modalIn_0.3s_ease-out_forwards]'
            }`}>
              {/* Modal Title */}
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                ویرایش {editingField === 'name' ? 'نام و نام خانوادگی' : 
                        editingField === 'code' ? 'کد سفارش' :
                        editingField === 'serviceType' ? 'نوع خدمت' :
                        editingField === 'translateDate' ? 'تاریخ شروع ترجمه' :
                        editingField === 'deliveryDate' ? 'تاریخ تحویل' : 'فیلد'}
              </h2>

              {/* Form */}
              <div className="space-y-3">
                {editingField === 'name' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نام و نام خانوادگی</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                )}

                {editingField === 'code' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">کد سفارش</label>
                    <input
                      type="text"
                      value={editForm.code}
                      onChange={(e) => setEditForm({...editForm, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                )}

                {editingField === 'serviceType' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع خدمت</label>
                    <select
                      value={editForm.serviceType}
                      onChange={(e) => setEditForm({...editForm, serviceType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">نوع خدمت را انتخاب کنید</option>
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
                )}

                {editingField === 'translateDate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ شروع ترجمه</label>
                    <DatePicker
                      value={editForm.translateDate}
                      onChange={(date) => setEditForm({...editForm, translateDate: date ? date.format() : ''})}
                      calendar={persian}
                      locale={persian_fa}
                      format="YYYY/MM/DD"
                      placeholder="تاریخ شروع ترجمه را انتخاب کنید"
                      className="w-full"
                      inputClass="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                )}

                {editingField === 'deliveryDate' && (
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
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
                  >
                    ذخیره تغییرات
                  </button>
                  <button
                    onClick={handleCloseEditModal}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Change Success Message */}
        {showStatusSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              وضعیت با موفقیت تغییر کرد
            </div>
          </div>
        )}

        {/* Edit Success Message */}
        {showEditSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              تغییرات با موفقیت اعمال شد
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div 
              className="absolute inset-0 backdrop-blur-sm bg-black bg-opacity-50"
              onClick={closeLightbox}
            ></div>
            
            {/* Image Container */}
            <div className="relative max-w-4xl max-h-4xl mx-4">
              <Image
                src={lightboxImage}
                alt="Preview"
                width={1200}
                height={800}
                className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                unoptimized
              />
              
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors duration-200 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Delete Order Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
              isDeleteModalClosing 
                ? 'animate-[modalOut_0.3s_ease-in_forwards]' 
                : 'animate-[modalIn_0.3s_ease-out_forwards]'
            }`}>
              <div className="p-6">
                {/* Modal Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>

                {/* Modal Title */}
                <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                  حذف سفارش
                </h2>

                {/* Modal Content */}
                <div className="text-center mb-6">
                  <p className="text-gray-700 mb-2">
                    آیا مطمئن هستید که می‌خواهید این سفارش را حذف کنید؟
                  </p>
                  {orderToDelete && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">کد سفارش:</p>
                      <p className="font-mono text-gray-800">{orderToDelete.orderCode}</p>
                    </div>
                  )}
                  <p className="text-red-600 text-sm mt-2">
                    این عمل قابل بازگشت نیست!
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmDeleteOrder}
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
          </div>
        )}

        {/* Delete Success Message */}
        {showDeleteSuccess && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-[slideInRight_0.3s_ease-out_forwards]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              سفارش با موفقیت حذف شد
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ClientProfile;
