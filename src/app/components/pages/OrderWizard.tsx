'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { clientsAPI, Client } from '../../lib/clients-api';
import { unifiedAPI, CreateUnifiedOrderData, UnifiedOrder } from '../../lib/unified-api';
import { settingsAPI, CategorySettings } from '../../lib/settings-api';
import { useNotification } from '../../hooks/useNotification';
import Notification from '../../components/Notification';
import { toPersianNumbers } from '../../utils/numbers';
import { Button, Select, RadioButton, Input } from '../ui';

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
  referrerName: string;
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
  referrerName: string; // جدید: نام معرف
  code: string;
  serviceType: string;
  status: 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived';
}

// Options for selects
const languageOptions = [
  { value: 'persian', label: 'فارسی' },
  { value: 'english', label: 'انگلیسی' },
  { value: 'arabic', label: 'عربی' },
  { value: 'french', label: 'فرانسوی' },
  { value: 'german', label: 'آلمانی' },
  { value: 'spanish', label: 'اسپانیایی' },
  { value: 'italian', label: 'ایتالیایی' },
  { value: 'russian', label: 'روسی' },
  { value: 'chinese', label: 'چینی' },
  { value: 'japanese', label: 'ژاپنی' },
  { value: 'korean', label: 'کره‌ای' },
  { value: 'turkish', label: 'ترکی' }
];

const urgencyOptions = [
  { value: 'normal', label: 'عادی' },
  { value: 'urgent', label: 'فوری' },
  { value: 'very_urgent', label: 'خیلی فوری' }
];

const translationTypeOptions = [
  { value: 'certified', label: 'ترجمه رسمی' },
  { value: 'simple', label: 'ترجمه ساده' },
  { value: 'sworn', label: 'ترجمه سوگند' },
  { value: 'notarized', label: 'ترجمه محضری' }
];

const serviceTypeOptions = [
  { value: 'ترجمه', label: 'ترجمه' },
  { value: 'تائیدات دادگستری', label: 'تائیدات دادگستری' },
  { value: 'تائیدات خارجه', label: 'تائیدات خارجه' },
  { value: 'برابر اصل', label: 'برابر اصل' }
];

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
    referrerName: '',
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
    referrerName: '',
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
    { id: 1, title: 'اطلاعات فردی', description: 'اطلاعات شخصی و ایجاد کد مشتری' },
    { id: 2, title: 'تعریف خدمت', description: 'نوع ترجمه و جزئیات سفارش' },
    { id: 3, title: 'فاکتور', description: 'مشخصات فاکتور (اختیاری)' }
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

    if (currentStep < 3) {
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
        status: 'acceptance',
        referrerName: ''
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
                  <RadioButton
                    name="clientType"
                    value="existing"
                    checked={!isNewClient}
                    onChange={() => setIsNewClient(false)}
                    label="کاربر موجود"
                    className="flex-1"
                  />
                  <RadioButton
                    name="clientType"
                    value="new"
                    checked={isNewClient}
                    onChange={() => setIsNewClient(true)}
                    label="کاربر جدید"
                    className="flex-1"
                  />
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
                      <Select
                        options={clients.map(client => ({ value: client.id.toString(), label: `${(client.company && client.company.trim()) ? client.company.trim() : client.name} - ${client.code}` }))}
                        value={selectedClient?.id?.toString() || ''}
                        onChange={(value) => {
                          const client = clients.find(c => c.id.toString() === value);
                          setSelectedClient(client || null);
                        }}
                        placeholder="انتخاب کنید..."
                      />
                    )}
                  </div>

                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="نام"
                      type="text"
                      value={newClient.firstName}
                      onChange={(e) => setNewClient(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="نام مشتری را وارد کنید"
                      required
                    />

                    <Input
                      label="نام خانوادگی"
                      type="text"
                      value={newClient.lastName}
                      onChange={(e) => setNewClient(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="نام خانوادگی مشتری را وارد کنید"
                      required
                    />
                  </div>

                  <Input
                    label="نام شرکت"
                    type="text"
                    value={newClient.company}
                    onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="نام شرکت را وارد کنید"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="شماره تلفن"
                      type="tel"
                      value={toPersianNumbers(newClient.phone)}
                      onChange={(e) => {
                        const englishValue = e.target.value.replace(/[۰-۹]/g, (digit) => {
                          const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                          return persianDigits.indexOf(digit).toString();
                        });
                        setNewClient(prev => ({ ...prev, phone: englishValue }));
                      }}
                      placeholder="شماره تلفن مشتری را وارد کنید"
                      required
                    />

                    <Input
                      label="کد ملی"
                      type="text"
                      value={toPersianNumbers(newClient.nationalId)}
                      onChange={(e) => {
                        const englishValue = e.target.value.replace(/[۰-۹]/g, (digit) => {
                          const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                          return persianDigits.indexOf(digit).toString();
                        });
                        setNewClient(prev => ({ ...prev, nationalId: englishValue }));
                      }}
                      placeholder="کد ملی مشتری را وارد کنید"
                      maxLength={10}
                      required
                    />
                  </div>

                  <Input
                    label="ایمیل"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ایمیل مشتری را وارد کنید"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">آدرس <span className="text-red-500">*</span></label>
                    <textarea
                      value={newClient.address}
                      onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#687B6926] focus:border-[#687B69] text-gray-800 font-persian-numbers"
                      placeholder="آدرس مشتری را وارد کنید"
                      rows={2}
                      required
                    />
                  </div>


                  <div className="border-t border-gray-200 pt-4 pb-3">
                    <Input
                      label="نام معرف"
                      type="text"
                      value={newClient.referrerName}
                      onChange={(e) => setNewClient(prev => ({ ...prev, referrerName: e.target.value }))}
                      placeholder="نام فرد معرف را وارد کنید"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Show generated codes only for new clients */}
            {isNewClient && newClient.firstName && newClient.lastName && (
              <div className="bg-gradient-to-r from-[#687B6926] to-[#A5B8A326] p-4 rounded-lg border border-[#687B6966]">
                <h4 className="font-bold text-[#48453F] mb-3">کدهای تولید شده:</h4>
                <div className="space-y-1">
                  <p className="text-[#48453F] font-semibold">
                    کد کاربر: 
                    <span className="font-mono bg-[#687B6926] text-[#687B69] px-2 py-1 rounded">
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
                <Input
                  label="نام"
                  type="text"
                  value={order.clientFirstName || ''}
                  onChange={(e) => setOrder(prev => ({ ...prev, clientFirstName: e.target.value }))}
                  placeholder="نام مشتری را وارد کنید"
                />

                <Input
                  label="نام خانوادگی"
                  type="text"
                  value={order.clientLastName || ''}
                  onChange={(e) => setOrder(prev => ({ ...prev, clientLastName: e.target.value }))}
                  placeholder="نام خانوادگی مشتری را وارد کنید"
                />

                <Input
                  label="نام شرکت (اختیاری)"
                  type="text"
                  value={order.clientCompany || ''}
                  onChange={(e) => setOrder(prev => ({ ...prev, clientCompany: e.target.value }))}
                  placeholder="نام شرکت را وارد کنید"
                />

                <Input
                  label="شماره تلفن"
                  type="tel"
                  value={toPersianNumbers(order.clientPhone || '')}
                  onChange={(e) => {
                    const englishValue = e.target.value.replace(/[۰-۹]/g, (digit) => {
                      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                      return persianDigits.indexOf(digit).toString();
                    });
                    setOrder(prev => ({ ...prev, clientPhone: englishValue }));
                  }}
                  placeholder="شماره تلفن مشتری را وارد کنید"
                />

                <Input
                  label="ایمیل"
                  type="email"
                  value={order.clientEmail || ''}
                  onChange={(e) => setOrder(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="ایمیل مشتری را وارد کنید"
                />

                <Input
                  label="کد ملی"
                  type="text"
                  value={toPersianNumbers(order.clientNationalId || '')}
                  onChange={(e) => {
                    const englishValue = e.target.value.replace(/[۰-۹]/g, (digit) => {
                      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                      return persianDigits.indexOf(digit).toString();
                    });
                    setOrder(prev => ({ ...prev, clientNationalId: englishValue }));
                  }}
                  placeholder="کد ملی مشتری را وارد کنید"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">آدرس</label>
                <textarea
                  value={order.clientAddress || ''}
                  onChange={(e) => setOrder(prev => ({ ...prev, clientAddress: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#687B69] focus:border-[#687B69] text-gray-800"
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
                  <label className="block text-sm font-semibold text-gray-800 mb-2">نوع ترجمه <span className="text-red-500">*</span></label>
                  <Select
                    options={translationTypeOptions}
                    value={order.translationType || ''}
                    onChange={(value) => setOrder(prev => ({ ...prev, translationType: value }))}
                    placeholder="انتخاب کنید..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">نوع سند <span className="text-red-500">*</span></label>
                  <Select
                    options={getAllDocumentItems().map(item => ({ value: item.id, label: item.name }))}
                    value={order.documentType || ''}
                    onChange={(value) => setOrder(prev => ({ ...prev, documentType: value }))}
                    placeholder="انتخاب کنید..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">زبان مبدأ <span className="text-red-500">*</span></label>
                  <Select
                    options={languageOptions}
                    value={order.languageFrom || ''}
                    onChange={(value) => setOrder(prev => ({ ...prev, languageFrom: value }))}
                    placeholder="انتخاب کنید..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">زبان مقصد <span className="text-red-500">*</span></label>
                  <Select
                    options={languageOptions}
                    value={order.languageTo || ''}
                    onChange={(value) => setOrder(prev => ({ ...prev, languageTo: value }))}
                    placeholder="انتخاب کنید..."
                  />
                </div>

                <Input
                  label="تعداد صفحات"
                  type="number"
                  value={order.numberOfPages || 0}
                  onChange={(e) => setOrder(prev => ({ ...prev, numberOfPages: parseInt(e.target.value) || 0 }))}
                  min="0"
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">فوریت <span className="text-red-500">*</span></label>
                  <Select
                    options={urgencyOptions}
                    value={order.urgency || 'normal'}
                    onChange={(value) => setOrder(prev => ({ ...prev, urgency: value as 'normal' | 'urgent' | 'very_urgent' }))}
                    placeholder="انتخاب کنید..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">عنوان خدمات <span className="text-red-500">*</span></label>
                  <Select
                    options={serviceTypeOptions}
                    value={order.serviceType || 'ترجمه'}
                    onChange={(value) => setOrder(prev => ({ ...prev, serviceType: value }))}
                    placeholder="انتخاب کنید..."
                  />
                </div>

              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">توضیحات خاص</label>
                <textarea
                  value={order.specialInstructions || ''}
                  onChange={(e) => setOrder(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#687B69] focus:border-[#687B69] text-gray-800"
                  rows={3}
                  placeholder="توضیحات خاص سفارش را وارد کنید"
                />
              </div>
            </div>
          </div>
        );


      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">فاکتور</h3>
              <div className="text-center py-8 text-gray-500">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg mb-2">ایجاد سفارش</p>
                <p className="text-sm">سفارش با تمام مشخصات که تکمیل شده ایجاد خواهد شد</p>
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
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-[#A43E2F66]">
          <div className="w-16 h-16 bg-[#A43E2F26] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#A43E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#4b483f' }}>خطا در بارگذاری</h2>
          <p className="mb-4" style={{ color: '#4b483f' }}>{error}</p>
          <Button
            onClick={loadClients}
            variant="primary"
            size="md"
          >
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9f8f5' }}>
      <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#A5B8A326] rounded-full mb-3">
          <svg className="w-6 h-6 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#4b483f' }}>پذیرش سفارش</h1>
        <p style={{ color: '#4b483f' }}>مراحل پذیرش سفارش ترجمه</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-center">
          <div className="flex items-center justify-between w-full max-w-lg">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2 ${
                  currentStep >= step.id
                    ? 'bg-[#a5b1a3] border-[#a5b1a3] text-white'
                    : 'border-gray-300 text-gray-500 bg-white'
                }`}>
                  {step.id}
                </div>
                <p className={`text-xs font-medium text-center ${
  currentStep >= step.id ? '' : ''
}`} style={{ color: currentStep >= step.id ? '#687B69' : '#4b483f' }}>
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
              className="h-1 bg-[#a5b1a3] rounded-full transition-all duration-300"
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
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          variant={currentStep === 1 ? 'tertiary' : 'secondary'}
          size="md"
        >
          ← قبلی
        </Button>

        <div className="text-center">
          <p className="text-sm font-medium mb-1" style={{ color: '#4b483f' }}>مرحله {currentStep} از {steps.length}</p>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full mx-auto">
            <div
              className="h-1.5 bg-[#a5b1a3] rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <Button
          onClick={handleNext}
          disabled={loading}
          loading={loading}
          variant="primary"
          size="md"
        >
          {currentStep === 3 ? 'ایجاد سفارش' : 'بعدی →'}
        </Button>
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
