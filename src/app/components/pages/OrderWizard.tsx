'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { clientsAPI, Client } from '../../lib/clients-api';
import { unifiedAPI, CreateUnifiedOrderData, UnifiedOrder } from '../../lib/unified-api';
import { settingsAPI, CategorySettings } from '../../lib/settings-api';
import { useNotification } from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { toPersianNumbers } from '../../utils/numbers';

// Types

interface Order {
  id?: string;
  clientCode: string;
  clientId: string;
  clientType: 'person' | 'company';
  clientFirstName: string;
  clientLastName: string;
  clientCompany: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientNationalId: string;
  serviceType: string;
  status: 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived';
  translationType: string;
  documentType: string;
  languageFrom: string;
  languageTo: string;
  numberOfPages: number;
  urgency: 'normal' | 'urgent' | 'very_urgent';
  specialInstructions: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  history: OrderHistory[];
}

interface OrderHistory {
  id: string;
  orderId: string;
  status: string;
  changedBy: string;
  changedAt: string;
  notes: string;
}

interface NewClient {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  nationalId: string;
  code: string;
  serviceType: string;
  status: 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived';
}

const OrderWizard: React.FC = () => {
  const { notification, showNotification, hideNotification } = useNotification();
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<CategorySettings[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_clientOrders, setClientOrders] = useState<UnifiedOrder[]>([]); // Used for populating form with previous order data
  const [newClient, setNewClient] = useState<NewClient>({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    nationalId: '',
    code: '',
    serviceType: 'ترجمه',
    status: 'acceptance'
  });
  const [order, setOrder] = useState<Partial<Order>>({
    id: undefined,
    clientCode: '',
    clientId: '',
    clientType: 'person',
    clientFirstName: '',
    clientLastName: '',
    clientCompany: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    clientNationalId: '',
    serviceType: 'ترجمه',
    status: 'acceptance',
    translationType: '',
    documentType: '',
    languageFrom: '',
    languageTo: '',
    numberOfPages: 0,
    urgency: 'normal',
    specialInstructions: '',
    createdAt: '',
    updatedAt: '',
    totalPrice: 0,
    history: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<{
    clientCode: string;
  } | null>(null);

  const steps = [
    { id: 1, title: 'پذیرش', description: 'بررسی کاربر و ایجاد کد مشتری' },
    { id: 2, title: 'تکمیل اطلاعات', description: 'نوع ترجمه و جزئیات سفارش' },
    { id: 3, title: 'ترجمه', description: 'وضعیت ترجمه' },
    { id: 4, title: 'ویرایش', description: 'وضعیت ویرایش' },
    { id: 5, title: 'امور دفتری', description: 'وضعیت دفتری' },
    { id: 6, title: 'آماده تحویل', description: 'وضعیت نهایی' }
  ];

  const getTranslationTypeText = (type: string) => {
    const types: Record<string, string> = {
      'certified': 'ترجمه رسمی',
      'simple': 'ترجمه ساده',
      'sworn': 'ترجمه سوگند',
      'notarized': 'ترجمه محضری'
    };
    return types[type] || type;
  };

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Load clients from unified orders API
      const unifiedData = await unifiedAPI.getUnifiedOrders();
      
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
                'acceptance' as const
      }));
      
      // Remove duplicates based on client ID
      const uniqueClients = clientsFromUnified.filter((client, index, self) => 
        index === self.findIndex(c => c.id === client.id)
      );
      
      setClients(uniqueClients);
    } catch {
      setError('خطا در بارگذاری لیست مشتریان');
      showNotification('خطا در بارگذاری لیست مشتریان', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadClientOrders = useCallback(async (clientId: number) => {
    try {
      const ordersData = await unifiedAPI.getUnifiedOrders();
      const clientOrders = ordersData.orders.filter((order: UnifiedOrder) => order.clientId === clientId.toString());
      setClientOrders(clientOrders);
      
      // If client has previous orders, populate form with the latest order data
      if (clientOrders.length > 0) {
        const latestOrder = clientOrders[0]; // Assuming orders are sorted by date
        setOrder(prev => ({
          ...prev,
          serviceType: latestOrder.serviceType || 'ترجمه',
          status: (latestOrder.status === 'translation' ? 'translating' : latestOrder.status) || 'acceptance',
          translationType: latestOrder.translationType || '',
          documentType: latestOrder.documentType || '',
          languageFrom: latestOrder.languageFrom || '',
          languageTo: latestOrder.languageTo || '',
          numberOfPages: latestOrder.numberOfPages || 0,
          urgency: latestOrder.urgency || 'normal',
          specialInstructions: latestOrder.specialInstructions || ''
        }));
      }
    } catch (error) {
      console.error('Error loading client orders:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const settingsData = await settingsAPI.getSettings();
      if (settingsData) {
        setCategories(settingsData.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showNotification('خطا در بارگذاری دسته‌بندی‌ها', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Load clients and categories on component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadClients(), loadCategories()]);
    };
    loadData();
  }, [loadClients, loadCategories]);

  // Generate codes only for new clients
  useEffect(() => {
    if (isNewClient) {
      setGeneratedCodes({
        clientCode: generateClientCode()
      });
    } else {
      // For existing clients, set client code from selected client
      setGeneratedCodes({
        clientCode: '' // Will be set from selected client
      });
    }
  }, [isNewClient]); // Run when isNewClient changes

  // Update order data when selectedClient changes
  useEffect(() => {
    if (selectedClient) {
      setOrder(prev => ({
        ...prev,
        clientId: selectedClient.id.toString(),
        clientCode: selectedClient.code,
        clientFirstName: selectedClient.firstName || '',
        clientLastName: selectedClient.lastName || '',
        clientCompany: selectedClient.company || '',
        clientPhone: selectedClient.phone || '',
        clientEmail: selectedClient.email || '',
        clientAddress: selectedClient.address || '',
        clientNationalId: selectedClient.nationalId || ''
      }));
      
      // Update generated codes to use existing client code
      setGeneratedCodes({
        clientCode: selectedClient.code
      });
      
      // Load client's previous orders to populate form
      loadClientOrders(selectedClient.id);
    }
  }, [selectedClient, loadClientOrders]);

  // Additional useEffect to ensure fields are populated immediately
  useEffect(() => {
    if (selectedClient && !isNewClient) {
      // Force update order fields with selected client data
      setOrder(prev => ({
        ...prev,
        clientPhone: selectedClient.phone || '',
        clientEmail: selectedClient.email || '',
        clientAddress: selectedClient.address || ''
      }));
    }
  }, [selectedClient, isNewClient]);


  const generateClientCode = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `CLI${year}${month}${day}${random}`;
  };


  const getDocumentTypeText = (type: string) => {
    // First try to find in categories
    const category = categories.find(cat => cat.id === type);
    if (category) {
      return category.name;
    }
    
    // Then try to find in document items
    for (const cat of categories) {
      if (cat.items && Array.isArray(cat.items)) {
        const item = cat.items.find(item => item.id === type);
        if (item) {
          return `${cat.name} - ${item.name}`;
        }
      }
    }
    
    return type;
  };

  const getAllDocumentItems = (): Array<{id: string, name: string, categoryName: string}> => {
    const items: Array<{id: string, name: string, categoryName: string}> = [];
    
    categories.forEach(category => {
      // Add category itself
      items.push({
        id: category.id,
        name: category.name,
        categoryName: category.name
      });
      
      // Add category items
      if (category.items && Array.isArray(category.items)) {
        category.items.forEach(item => {
          items.push({
            id: item.id,
            name: `${category.name} - ${item.name}`,
            categoryName: category.name
          });
        });
      }
    });
    
    return items;
  };

  const getLanguageText = (lang: string) => {
    const languages: Record<string, string> = {
      'persian': 'فارسی',
      'english': 'انگلیسی',
      'arabic': 'عربی',
      'french': 'فرانسوی'
    };
    return languages[lang] || lang;
  };

  const getUrgencyText = (urgency: string) => {
    const urgencies: Record<string, string> = {
      'normal': 'عادی',
      'urgent': 'فوری',
      'very_urgent': 'خیلی فوری'
    };
    return urgencies[urgency] || urgency;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Step 1: Prepare client data (skip separate client creation)
      if (isNewClient) {
        // Validate new client data
        if (!newClient.firstName.trim() || !newClient.lastName.trim()) {
          showNotification('لطفاً نام و نام خانوادگی مشتری را وارد کنید', 'error');
          return;
        }
        
        const clientCode = generatedCodes?.clientCode || generateClientCode();
        setOrder(prev => ({
          ...prev,
          clientId: '', // Clear clientId for new clients
          clientCode: clientCode,
          clientFirstName: newClient.firstName,
          clientLastName: newClient.lastName,
          clientCompany: newClient.company,
          clientPhone: newClient.phone,
          clientEmail: newClient.email,
          clientAddress: newClient.address,
          clientNationalId: newClient.nationalId
        }));
      } else if (!selectedClient) {
        showNotification('لطفاً یک کاربر انتخاب کنید', 'error');
        return;
      } else {
        // For existing clients, use their existing code
        const clientCode = selectedClient.code;
        setOrder(prev => ({
          ...prev,
          clientId: selectedClient.id.toString(),
          clientCode: clientCode,
          clientFirstName: prev.clientFirstName || '',
          clientLastName: prev.clientLastName || '',
          clientCompany: prev.clientCompany || selectedClient.company || '',
          clientPhone: prev.clientPhone || '',
          clientEmail: prev.clientEmail || '',
          clientAddress: prev.clientAddress || '',
          clientNationalId: prev.clientNationalId || ''
        }));
      }
    }

    if (currentStep === 2) {
      // Step 2: Validate order details
      if (!order.translationType || !order.documentType || !order.languageFrom || !order.languageTo) {
        showNotification('لطفاً تمام فیلدهای الزامی را پر کنید', 'error');
        return;
      }
      
      if ((order.numberOfPages || 0) <= 0) {
        showNotification('تعداد صفحات باید بیشتر از صفر باشد', 'error');
        return;
      }
    }

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step: Create order
      await createOrder();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createOrder = async () => {
    try {
      setLoading(true);
      // Use existing client code if available, otherwise generate new one
      const clientCode = selectedClient?.code || generatedCodes?.clientCode || generateClientCode();
      
      // Validate required fields
      if (!order.clientFirstName || !order.clientLastName) {
        showNotification('لطفاً نام و نام خانوادگی مشتری را وارد کنید', 'error');
        return;
      }
      if (!order.translationType) {
        showNotification('لطفاً نوع ترجمه را انتخاب کنید', 'error');
        return;
      }
      if (!order.documentType) {
        showNotification('لطفاً نوع سند را انتخاب کنید', 'error');
        return;
      }
      if (!order.languageFrom) {
        showNotification('لطفاً زبان مبدأ را انتخاب کنید', 'error');
        return;
      }
      if (!order.languageTo) {
        showNotification('لطفاً زبان مقصد را انتخاب کنید', 'error');
        return;
      }
      if (!order.numberOfPages || order.numberOfPages <= 0) {
        showNotification('لطفاً تعداد صفحات را وارد کنید', 'error');
        return;
      }
      
      const unifiedOrderData: CreateUnifiedOrderData = {
        clientCode,
        clientName: `${order.clientFirstName || ''} ${order.clientLastName || ''}`.trim(),
        clientFirstName: order.clientFirstName || '',
        clientLastName: order.clientLastName || '',
        clientCompany: order.clientCompany || '',
        clientPhone: order.clientPhone || '',
        clientEmail: order.clientEmail || '',
        clientAddress: order.clientAddress || '',
        clientNationalId: order.clientNationalId || '',
        clientType: order.clientType || 'person',
        serviceType: order.serviceType || 'ترجمه',
        status: order.status || 'acceptance',
        translationType: order.translationType || '',
        documentType: order.documentType || '',
        languageFrom: order.languageFrom || '',
        languageTo: order.languageTo || '',
        numberOfPages: order.numberOfPages || 0,
        urgency: order.urgency || 'normal',
        specialInstructions: order.specialInstructions || '',
        totalPrice: 0
      };

      // Final validation before sending
      if (!unifiedOrderData.clientName.trim()) {
        showNotification('نام مشتری نمی‌تواند خالی باشد', 'error');
        return;
      }
      if (!unifiedOrderData.translationType.trim()) {
        showNotification('نوع ترجمه نمی‌تواند خالی باشد', 'error');
        return;
      }
      if (!unifiedOrderData.documentType.trim()) {
        showNotification('نوع سند نمی‌تواند خالی باشد', 'error');
        return;
      }
      if (!unifiedOrderData.languageFrom.trim()) {
        showNotification('زبان مبدأ نمی‌تواند خالی باشد', 'error');
        return;
      }
      if (!unifiedOrderData.languageTo.trim()) {
        showNotification('زبان مقصد نمی‌تواند خالی باشد', 'error');
        return;
      }
      if (unifiedOrderData.numberOfPages <= 0) {
        showNotification('تعداد صفحات باید بیشتر از صفر باشد', 'error');
        return;
      }

      
      const createdOrder = await unifiedAPI.createUnifiedOrder(unifiedOrderData);
      showNotification('سفارش و مشتری با موفقیت ایجاد شد', 'success');
      
      // Set the order ID for future status updates
      setOrder(prev => ({ ...prev, id: createdOrder.id }));
      
      // Reset form
      setCurrentStep(1);
      setSelectedClient(null);
      setIsNewClient(false);
      setNewClient({
        firstName: '',
        lastName: '',
        company: '',
        phone: '',
        email: '',
        address: '',
        nationalId: '',
        code: '',
        serviceType: 'ترجمه',
        status: 'acceptance'
      });
      setOrder({
        id: undefined,
        clientCode: '',
        clientId: '',
        clientType: 'person',
        clientFirstName: '',
        clientLastName: '',
        clientCompany: '',
        clientPhone: '',
        clientEmail: '',
        clientAddress: '',
        clientNationalId: '',
        serviceType: 'ترجمه',
        status: 'acceptance',
        translationType: '',
        documentType: '',
        languageFrom: '',
        languageTo: '',
        numberOfPages: 0,
        urgency: 'normal',
        specialInstructions: '',
        createdAt: '',
        updatedAt: '',
        totalPrice: 0,
        history: []
      });
      // Generate new codes for next order
      setGeneratedCodes({
        clientCode: generateClientCode()
      });
    } catch {
      showNotification('خطا در ایجاد سفارش', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      
      // First, update the order status in the backend
      if (order.id) {
        const success = await unifiedAPI.updateOrderStatus(
          order.id, 
          newStatus, 
          'user', 
          `وضعیت سفارش به ${getStatusText(newStatus)} تغییر یافت`
        );
        
        if (!success) {
          showNotification('خطا در به‌روزرسانی وضعیت سفارش در سرور', 'error');
          return;
        }
      }
      
      // Update the local order status
      setOrder(prev => ({ ...prev, status: newStatus as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived' }));
      
      // If status is changing to 'ready', move client to archive
      if (newStatus === 'ready') {
        // Move client to archive status
        if (selectedClient) {
          try {
            await clientsAPI.updateClient(selectedClient.id, { status: 'archived' });
            showNotification('سفارش آماده تحویل شد و مشتری به بایگانی منتقل شد', 'success');
          } catch (error) {
            console.error('Error archiving client:', error);
            showNotification('خطا در بایگانی مشتری', 'error');
          }
        }
      } else {
        showNotification(`وضعیت سفارش به ${getStatusText(newStatus)} تغییر یافت`, 'success');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification('خطا در تغییر وضعیت سفارش', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      'acceptance': 'پذیرش',
      'completion': 'تکمیل',
      'translation': 'ترجمه',
      'editing': 'ویرایش',
      'office': 'امور دفتری',
      'ready': 'آماده تحویل'
    };
    return statusTexts[status] || status;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">انتخاب یا ایجاد کاربر</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-3">نوع کاربر</label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="clientType"
                      value="existing"
                      checked={!isNewClient}
                      onChange={() => setIsNewClient(false)}
                      className="ml-2 w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-800 font-medium">کاربر موجود</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="clientType"
                      value="new"
                      checked={isNewClient}
                      onChange={() => setIsNewClient(true)}
                      className="ml-2 w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-800 font-medium">کاربر جدید</span>
                  </label>
                </div>
              </div>

              {!isNewClient ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">انتخاب کاربر</label>
                    {clients.length === 0 ? (
                      <div className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                        <p className="mb-1">هیچ مشتری موجودی یافت نشد</p>
                        <p className="text-sm">لطفاً کاربر جدید ایجاد کنید</p>
                      </div>
                    ) : (
                      <select
                        value={selectedClient?.id || ''}
                        onChange={(e) => {
                          const client = clients.find(c => c.id.toString() === e.target.value);
                          setSelectedClient(client || null);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 font-persian-numbers"
                      >
                        <option value="">انتخاب کنید...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {(client.company && client.company.trim()) ? client.company.trim() : client.name} - {client.code}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">نام</label>
                      <input
                        type="text"
                        value={newClient.firstName}
                        onChange={(e) => setNewClient(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 font-persian-numbers"
                        placeholder="نام مشتری را وارد کنید"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">نام خانوادگی</label>
                      <input
                        type="text"
                        value={newClient.lastName}
                        onChange={(e) => setNewClient(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 font-persian-numbers"
                        placeholder="نام خانوادگی مشتری را وارد کنید"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">نام شرکت (اختیاری)</label>
                    <input
                      type="text"
                      value={newClient.company}
                      onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 font-persian-numbers"
                      placeholder="نام شرکت را وارد کنید"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">شماره تلفن</label>
                      <input
                        type="tel"
                        value={toPersianNumbers(newClient.phone)}
                        onChange={(e) => {
                          const englishValue = e.target.value.replace(/[۰-۹]/g, (digit) => {
                            const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                            return persianDigits.indexOf(digit).toString();
                          });
                          setNewClient(prev => ({ ...prev, phone: englishValue }));
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 text-right"
                        placeholder="شماره تلفن مشتری را وارد کنید"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">کد ملی</label>
                      <input
                        type="text"
                        value={toPersianNumbers(newClient.nationalId)}
                        onChange={(e) => {
                          const englishValue = e.target.value.replace(/[۰-۹]/g, (digit) => {
                            const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                            return persianDigits.indexOf(digit).toString();
                          });
                          setNewClient(prev => ({ ...prev, nationalId: englishValue }));
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 text-right"
                        placeholder="کد ملی مشتری را وارد کنید"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">ایمیل</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 font-persian-numbers"
                      placeholder="ایمیل مشتری را وارد کنید"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">آدرس</label>
                    <textarea
                      value={newClient.address}
                      onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 font-persian-numbers"
                      placeholder="آدرس مشتری را وارد کنید"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">نوع خدمات</label>
                    <select
                      value={newClient.serviceType}
                      onChange={(e) => setNewClient(prev => ({ ...prev, serviceType: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 font-persian-numbers"
                    >
                      <option value="ترجمه">ترجمه</option>
                      <option value="تائیدات دادگستری">تائیدات دادگستری</option>
                      <option value="تائیدات خارجه">تائیدات خارجه</option>
                      <option value="برابر اصل">برابر اصل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">وضعیت</label>
                    <select
                      value={newClient.status}
                      onChange={(e) => setNewClient(prev => ({ ...prev, status: e.target.value as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived' }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800 font-persian-numbers"
                    >
                      <option value="acceptance">پذیرش</option>
                      <option value="completion">تکمیل اطلاعات</option>
                      <option value="translating">ترجمه</option>
                      <option value="editing">ویرایش</option>
                      <option value="office">امور دفتری</option>
                      <option value="ready">آماده تحویل</option>
                      <option value="archived">بایگانی</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Show generated codes only for new clients */}
            {isNewClient && newClient.firstName && newClient.lastName && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3">کدهای تولید شده:</h4>
                <div className="space-y-1">
                  <p className="text-blue-800 font-semibold">
                    کد کاربر: 
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                      {generatedCodes?.clientCode || 'در حال تولید...'}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Client Information Section */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">اطلاعات مشتری</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">نام</label>
                  <input
                    type="text"
                    value={order.clientFirstName || ''}
                    onChange={(e) => setOrder(prev => ({ ...prev, clientFirstName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-persian-numbers"
                    placeholder="نام مشتری را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">نام خانوادگی</label>
                  <input
                    type="text"
                    value={order.clientLastName || ''}
                    onChange={(e) => setOrder(prev => ({ ...prev, clientLastName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-persian-numbers"
                    placeholder="نام خانوادگی مشتری را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">نام شرکت (اختیاری)</label>
                  <input
                    type="text"
                    value={order.clientCompany || ''}
                    onChange={(e) => setOrder(prev => ({ ...prev, clientCompany: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-persian-numbers"
                    placeholder="نام شرکت را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">شماره تلفن</label>
                  <input
                    type="tel"
                    value={toPersianNumbers(order.clientPhone || '')}
                    onChange={(e) => {
                      const englishValue = e.target.value.replace(/[۰-۹]/g, (digit) => {
                        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                        return persianDigits.indexOf(digit).toString();
                      });
                      setOrder(prev => ({ ...prev, clientPhone: englishValue }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-right"
                    placeholder="شماره تلفن مشتری را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">ایمیل</label>
                  <input
                    type="email"
                    value={order.clientEmail || ''}
                    onChange={(e) => setOrder(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    placeholder="ایمیل مشتری را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">کد ملی</label>
                  <input
                    type="text"
                    value={toPersianNumbers(order.clientNationalId || '')}
                    onChange={(e) => {
                      const englishValue = e.target.value.replace(/[۰-۹]/g, (digit) => {
                        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                        return persianDigits.indexOf(digit).toString();
                      });
                      setOrder(prev => ({ ...prev, clientNationalId: englishValue }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-right"
                    placeholder="کد ملی مشتری را وارد کنید"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">آدرس</label>
                <textarea
                  value={order.clientAddress || ''}
                  onChange={(e) => setOrder(prev => ({ ...prev, clientAddress: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  rows={2}
                  placeholder="آدرس مشتری را وارد کنید"
                />
              </div>
            </div>

            {/* Service Information Section */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">جزئیات سفارش ترجمه</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">نوع ترجمه</label>
                  <select
                    value={order.translationType || ''}
                    onChange={(e) => setOrder(prev => ({ ...prev, translationType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  >
                    <option value="">انتخاب کنید...</option>
                    <option value="certified">ترجمه رسمی</option>
                    <option value="simple">ترجمه ساده</option>
                    <option value="sworn">ترجمه سوگند</option>
                    <option value="notarized">ترجمه محضری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">نوع سند</label>
                  <select
                    value={order.documentType || ''}
                    onChange={(e) => setOrder(prev => ({ ...prev, documentType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  >
                    <option value="">انتخاب کنید...</option>
                    {getAllDocumentItems().map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">زبان مبدأ</label>
                  <select
                    value={order.languageFrom || ''}
                    onChange={(e) => setOrder(prev => ({ ...prev, languageFrom: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  >
                    <option value="">انتخاب کنید...</option>
                    <option value="persian">فارسی</option>
                    <option value="english">انگلیسی</option>
                    <option value="arabic">عربی</option>
                    <option value="french">فرانسوی</option>
                    <option value="german">آلمانی</option>
                    <option value="other">سایر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">زبان مقصد</label>
                  <select
                    value={order.languageTo || ''}
                    onChange={(e) => setOrder(prev => ({ ...prev, languageTo: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  >
                    <option value="">انتخاب کنید...</option>
                    <option value="persian">فارسی</option>
                    <option value="english">انگلیسی</option>
                    <option value="arabic">عربی</option>
                    <option value="french">فرانسوی</option>
                    <option value="german">آلمانی</option>
                    <option value="other">سایر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">تعداد صفحات</label>
                  <input
                    type="number"
                    value={order.numberOfPages || 0}
                    onChange={(e) => setOrder(prev => ({ ...prev, numberOfPages: parseInt(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 text-right"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">فوریت</label>
                  <select
                    value={order.urgency || 'normal'}
                    onChange={(e) => setOrder(prev => ({ ...prev, urgency: e.target.value as 'normal' | 'urgent' | 'very_urgent' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="very_urgent">خیلی فوری</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">نوع خدمات</label>
                  <select
                    value={order.serviceType || 'ترجمه'}
                    onChange={(e) => setOrder(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-persian-numbers"
                  >
                    <option value="ترجمه">ترجمه</option>
                    <option value="تائیدات دادگستری">تائیدات دادگستری</option>
                    <option value="تائیدات خارجه">تائیدات خارجه</option>
                    <option value="برابر اصل">برابر اصل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">وضعیت</label>
                  <select
                    value={order.status || 'acceptance'}
                    onChange={(e) => setOrder(prev => ({ ...prev, status: e.target.value as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-persian-numbers"
                  >
                    <option value="acceptance">پذیرش</option>
                    <option value="completion">تکمیل اطلاعات</option>
                    <option value="translating">ترجمه</option>
                    <option value="editing">ویرایش</option>
                    <option value="office">امور دفتری</option>
                    <option value="ready">آماده تحویل</option>
                    <option value="archived">بایگانی</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">توضیحات خاص</label>
                <textarea
                  value={order.specialInstructions || ''}
                  onChange={(e) => setOrder(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  rows={3}
                  placeholder="توضیحات خاص سفارش را وارد کنید"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">وضعیت ترجمه</h3>
            <p className="text-gray-700 mb-4">سفارش در مرحله ترجمه قرار دارد.</p>
            <button
              onClick={() => updateOrderStatus('editing')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              تکمیل ترجمه و انتقال به ویرایش
            </button>
          </div>
        );

      case 4:
        return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">وضعیت ویرایش</h3>
            <p className="text-gray-700 mb-4">سفارش در مرحله ویرایش قرار دارد.</p>
            <button
              onClick={() => updateOrderStatus('office')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              تکمیل ویرایش و انتقال به امور دفتری
            </button>
          </div>
        );

      case 5:
        return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">امور دفتری</h3>
            <p className="text-gray-700 mb-4">سفارش در مرحله امور دفتری قرار دارد.</p>
            <button
              onClick={() => updateOrderStatus('ready')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              تکمیل امور دفتری و آماده سازی برای تحویل
            </button>
          </div>
        );

      case 6:
        return (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">آماده تحویل</h3>
            <p className="text-gray-700 mb-4">سفارش آماده تحویل است.</p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-900 mb-3">خلاصه سفارش:</h4>
              <div className="text-green-800 space-y-2">
                <p className="font-semibold">کد مشتری: <span className="font-mono bg-green-100 px-2 py-1 rounded">{selectedClient?.code || generatedCodes?.clientCode || 'در حال تولید...'}</span></p>
                <p className="font-semibold">مشتری: {order.clientCompany ? order.clientCompany : `${order.clientFirstName} ${order.clientLastName}`}</p>
                <p className="font-semibold">نوع ترجمه: {getTranslationTypeText(order.translationType || '')}</p>
                <p className="font-semibold">نوع سند: {getDocumentTypeText(order.documentType || '')}</p>
                <p className="font-semibold">زبان: {getLanguageText(order.languageFrom || '')} → {getLanguageText(order.languageTo || '')}</p>
                <p className="font-semibold">تعداد صفحات: {order.numberOfPages}</p>
                <p className="font-semibold">فوریت: {getUrgencyText(order.urgency || 'normal')}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f4f1' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#4b483f' }}></div>
          <p className="text-lg" style={{ color: '#4b483f' }}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f4f1' }}>
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#4b483f' }}>خطا در بارگذاری</h2>
          <p className="mb-4" style={{ color: '#4b483f' }}>{error}</p>
          <button
            onClick={loadClients}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f4f1' }}>
      <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#4b483f' }}>ویزارد پذیرش سفارش</h1>
        <p style={{ color: '#4b483f' }}>مراحل پذیرش و پیگیری سفارش ترجمه</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-center">
          <div className="flex items-center justify-between w-full max-w-lg">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2 ${
                  currentStep >= step.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-500 bg-white'
                }`}>
                  {step.id}
                </div>
                <p className={`text-xs font-medium text-center ${
                  currentStep >= step.id ? 'text-blue-600' : ''
                }`} style={{ color: currentStep >= step.id ? '' : '#4b483f' }}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Progress Line */}
        <div className="flex justify-center mt-4">
          <div className="w-full max-w-md h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={`px-6 py-2 rounded-lg font-semibold ${
            currentStep === 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          } transition-all duration-200`}
        >
          ← قبلی
        </button>

        <div className="text-center">
          <p className="text-sm font-medium mb-1" style={{ color: '#4b483f' }}>مرحله {currentStep} از {steps.length}</p>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full mx-auto">
            <div
              className="h-1.5 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all duration-200 flex items-center gap-2 font-semibold"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {currentStep === 6 ? 'ایجاد سفارش' : 'بعدی →'}
        </button>
      </div>

      {/* Notification */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
      </div>
    </div>
  );
};

export default OrderWizard;
