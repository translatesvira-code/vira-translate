'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toPersianNumbers } from '../../utils/numbers';
import { unifiedAPI, UnifiedOrder } from '../../lib/unified-api';
import { settingsAPI, InvoiceSettings } from '../../lib/settings-api';
import { useNotification } from '../../hooks/useNotification';
import Notification from '../Notification';
import InvoiceHTML from '../InvoiceHTML';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const { notification, showNotification, hideNotification } = useNotification();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'userInfo' | 'visits' | 'financial'>('userInfo');
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [editValue, setEditValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Order edit modal states
  const [isOrderEditModalOpen, setIsOrderEditModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string>('');
  const [editingOrderField, setEditingOrderField] = useState<string>('');
  const [editOrderValue, setEditOrderValue] = useState<string>('');
  const [isOrderUpdating, setIsOrderUpdating] = useState(false);

  const getDisplayName = (client: Client): string => {
    if (client.company && client.company.trim()) {
      return client.company.trim();
    }
    if (client.name && client.name.trim()) {
      return client.name.trim();
    }
    if (client.firstName && client.lastName) {
      return `${client.firstName.trim()} ${client.lastName.trim()}`.trim();
    }
    return 'نامشخص';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'acceptance': 'پذیرش',
      'completion': 'تکمیل اطلاعات',
      'translation': 'ترجمه',
      'translating': 'ترجمه',
      'editing': 'ویرایش',
      'office': 'امور دفتری',
      'ready': 'آماده تحویل',
      'archived': 'بایگانی'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'acceptance': 'bg-[#687B6926] text-[#687B69] border border-[#687B6966]',
      'completion': 'bg-[#2B593E26] text-[#2B593E] border border-[#2B593E66]',
      'translating': 'bg-[#A43E2F26] text-[#A43E2F] border border-[#A43E2F66]',
      'editing': 'bg-[#A5B8A326] text-[#A5B8A3] border border-[#A5B8A366]',
      'office': 'bg-[#6A7B7E26] text-[#6A7B7E] border border-[#6A7B7E66]',
      'ready': 'bg-[#2B593E26] text-[#2B593E] border border-[#2B593E66]',
      'archived': 'bg-[#C0B8AC26] text-[#656051] border border-[#C0B8AC66]'
    };
    return colorMap[status] || 'bg-[#C0B8AC26] text-[#656051] border border-[#C0B8AC66]';
  };

  const getTranslationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'certified': 'ترجمه رسمی',
      'simple': 'ترجمه ساده',
      'sworn': 'ترجمه سوگند',
      'notarized': 'ترجمه محضری'
    };
    return typeMap[type] || type;
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

  const getStageOrder = (status: string): number => {
    const stageMap: Record<string, number> = {
      'acceptance': 1,
      'completion': 2,
      'translating': 3,
      'translation': 3,
      'editing': 4,
      'office': 5,
      'ready': 6,
      'archived': 7
    };
    return stageMap[status] || 0;
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!client || !orders.length) return;
    
    const latestOrder = orders[0];
    
    try {
      // Update order status via custom API endpoint (POST method)
      const url = `https://admin.viratranslate.ir/wp-json/custom/v1/orders/${latestOrder.id}/status`;
      const requestBody = {
        status: newStatus,
        changed_by: 'Frontend User',
        notes: `وضعیت به ${getStatusText(newStatus)} تغییر یافت`
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        // Update local state
        const updatedOrders = orders.map(order => 
          order.id === latestOrder.id ? { 
            ...order, 
            status: newStatus as 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready' | 'archived' 
          } : order
        );
        setOrders(updatedOrders);
        
        showNotification('وضعیت پروژه با موفقیت بروزرسانی شد', 'success');
      } else {
        const errorText = await response.text();
        console.error('Status update failed:', response.status, errorText);
        showNotification('خطا در بروزرسانی وضعیت', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('خطا در بروزرسانی وضعیت', 'error');
    }
  };

  const loadInvoiceSettings = useCallback(async () => {
    try {
      const settings = await settingsAPI.getSettings();
      if (settings && settings.invoice) {
        setInvoiceSettings(settings.invoice);
      }
    } catch (error) {
      console.error('Error loading invoice settings:', error);
    }
  }, []);

  const loadClientData = useCallback(async () => {
    setLoading(true);
    try {
      // Load invoice settings
      await loadInvoiceSettings();
      
      // First try to get client by ID from the existing orders data
      let clientData: Client | null = null;
      let clientIdFromOrders: number | null = null;
      
      try {
        const unifiedData = await unifiedAPI.getUnifiedOrders();
        const clientOrders = unifiedData.orders.filter(order => 
          order.clientCode === clientName || 
          order.clientName === clientName ||
          order.clientFirstName === clientName ||
          order.clientLastName === clientName ||
          order.clientCompany === clientName
        );
        
        if (clientOrders.length > 0) {
          clientIdFromOrders = parseInt(clientOrders[0].clientId) || null;
          
          // Try to get client data by ID from clients API
          if (clientIdFromOrders) {
            try {
              const response = await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/clients/${clientIdFromOrders}`);
              if (response.ok) {
                const client = await response.json();
                
                clientData = {
                  id: client.id,
                  code: client.meta?.client_code || '',
                  name: client.title?.rendered || '',
                  firstName: client.meta?.client_first_name || '',
                  lastName: client.meta?.client_last_name || '',
                  company: client.meta?.client_company || '',
                  phone: client.meta?.client_phone || '',
                  email: client.meta?.client_email || '',
                  address: client.meta?.client_address || '',
                  nationalId: client.meta?.client_national_id || '',
                  serviceType: client.meta?.service_type || 'تائیدات خارجه',
                  translateDate: client.date ? new Date(client.date).toLocaleDateString('fa-IR') : '',
                  deliveryDate: '',
                  status: client.meta?.client_status || 'acceptance'
                };
              }
            } catch (error) {
              console.warn('Failed to load from clients API by ID:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load from unified API:', error);
      }
      
      // Fallback to unified API if client API failed
      if (!clientData) {
      const unifiedData = await unifiedAPI.getUnifiedOrders();
      
      const clientOrders = unifiedData.orders.filter(order => 
        order.clientCode === clientName || 
          order.clientName === clientName ||
          order.clientFirstName === clientName ||
          order.clientLastName === clientName ||
          order.clientCompany === clientName
      );
      
      if (clientOrders.length === 0) {
        setLoading(false);
        return;
      }
      
        // جمع‌آوری تمامی اطلاعات مشتری از همه سفارشات
        const clientInfo: Record<string, string | undefined> = {};
        
        clientOrders.forEach(order => {
          if (order.clientFirstName && !clientInfo.firstName) clientInfo.firstName = order.clientFirstName;
          if (order.clientLastName && !clientInfo.lastName) clientInfo.lastName = order.clientLastName;
          if (order.clientCompany && !clientInfo.company) clientInfo.company = order.clientCompany;
          if (order.clientPhone && !clientInfo.phone) clientInfo.phone = order.clientPhone;
          if (order.clientEmail && !clientInfo.email) clientInfo.email = order.clientEmail;
          if (order.clientAddress && !clientInfo.address) clientInfo.address = order.clientAddress;
          if (order.clientNationalId && !clientInfo.nationalId) clientInfo.nationalId = order.clientNationalId;
        });
        
        const mostRecentOrder = clientOrders[0];
        // Create clientData using unified API data as fallback
        clientData = {
          id: clientIdFromOrders || parseInt(mostRecentOrder.clientId) || 0,
          code: mostRecentOrder.clientCode,
          name: mostRecentOrder.clientName,
          firstName: clientInfo.firstName || mostRecentOrder.clientFirstName,
          lastName: clientInfo.lastName || mostRecentOrder.clientLastName,
          company: clientInfo.company || mostRecentOrder.clientCompany,
          phone: clientInfo.phone || mostRecentOrder.clientPhone,
          email: clientInfo.email || mostRecentOrder.clientEmail,
          address: clientInfo.address || mostRecentOrder.clientAddress,
          nationalId: clientInfo.nationalId || mostRecentOrder.clientNationalId,
          serviceType: getTranslationTypeText(mostRecentOrder.translationType) || 'تائیدات خارجه',
          translateDate: mostRecentOrder.createdAt ? new Date(mostRecentOrder.createdAt).toLocaleDateString('fa-IR') : '',
          deliveryDate: mostRecentOrder.status === 'ready' ? new Date(mostRecentOrder.updatedAt).toLocaleDateString('fa-IR') : '',
          status: 'acceptance' // Client status is always acceptance, order statuses are different
        };
      
      setOrders(clientOrders);
      } else {
        // Load orders for this client
        const unifiedData = await unifiedAPI.getUnifiedOrders();
        const clientOrders = unifiedData.orders.filter(order => 
          order.clientCode === clientData?.code
        );
      setOrders(clientOrders);
      }
      
      if (clientData) {
        setClient(clientData);
      }
      
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  }, [clientName, loadInvoiceSettings]);

  useEffect(() => {
    if (clientName) {
      loadClientData();
    }
  }, [clientName, loadClientData]);

  const handleBackToClients = () => {
    router.push('/dashboard?tab=clients');
  };

  const handleDownloadInvoice = async () => {
    if (!client || orders.length === 0) {
      showNotification('هیچ سفارشی برای دانلود فاکتور موجود نیست', 'error');
      return;
    }

    try {
      // Create a temporary container for the invoice
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '210mm'; // A5 landscape width
      tempContainer.style.height = '148mm'; // A5 landscape height
      tempContainer.style.backgroundColor = 'white';
      
      // Render the invoice component
      const invoiceElement = document.createElement('div');
      tempContainer.appendChild(invoiceElement);
      document.body.appendChild(tempContainer);
      
      // Use React to render the invoice
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(invoiceElement);
      
      await new Promise<void>((resolve) => {
        root.render(<InvoiceHTML client={client} orders={orders} invoiceSettings={invoiceSettings || undefined} />);
        setTimeout(resolve, 1000); // Wait for rendering
      });
      
      // Convert to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A5 landscape width in pixels at 96 DPI
        height: 562 // A5 landscape height in pixels at 96 DPI
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a5'); // landscape A5
      const imgWidth = 210; // A5 landscape width in mm
      const imgHeight = 148; // A5 landscape height in mm
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Download PDF
      const fileName = `فاکتور_${client.code}_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
      // Clean up
      root.unmount();
      document.body.removeChild(tempContainer);
      
      showNotification('فاکتور با موفقیت دانلود شد', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('خطا در تولید فاکتور', 'error');
    }
  };


  const handleEditField = (field: string) => {
    if (!client || field === 'code') return; // Don't allow editing code
    
    setEditingField(field);
    const fieldValue = client[field as keyof Client] as string || '';
    
    // Convert to Persian numbers for numeric fields
    if (field === 'phone' || field === 'nationalId') {
      setEditValue(fieldValue); // Keep original value for editing
    } else {
      setEditValue(fieldValue);
    }
    
    setIsAnimating(true);
    
    // Small delay for animation
    setTimeout(() => {
      setIsEditModalOpen(true);
      setIsAnimating(false);
    }, 50);
  };

  const handleEditOrderField = (orderId: string, field: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    setEditingOrderId(orderId);
    setEditingOrderField(field);
    
    // Get field value
    let fieldValue = '';
    switch (field) {
      case 'serviceType':
        fieldValue = order.serviceType || '';
        break;
      case 'translationType':
        fieldValue = order.translationType || '';
        break;
      case 'numberOfPages':
        fieldValue = order.numberOfPages?.toString() || '';
        break;
      case 'languageFrom':
        fieldValue = order.languageFrom || '';
        break;
      case 'languageTo':
        fieldValue = order.languageTo || '';
        break;
      case 'urgency':
        fieldValue = order.urgency || '';
        break;
      case 'specialInstructions':
        fieldValue = order.specialInstructions || '';
        break;
    }
    
    setEditOrderValue(fieldValue);
    setIsAnimating(true);
    
    // Small delay for animation
    setTimeout(() => {
      setIsOrderEditModalOpen(true);
      setIsAnimating(false);
    }, 50);
  };

  const handleUpdateField = async () => {
    if (!client || !editingField) return;
    
    setIsUpdating(true);
    try {
      const updatedClient = await updateClientInfo(client.id, editingField, editValue);
      
      if (updatedClient && updatedClient.success) {
        // Update the client state immediately for better UX
        setClient({ ...client, [editingField]: editValue });
        
        // Small delay for smooth animation
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditingField('');
          setEditValue('');
        }, 150);
        
        // Show success message
        showNotification('اطلاعات با موفقیت بروزرسانی شد', 'success');
        
        // Don't reload since we already updated the state above
        // The UI already shows the updated value immediately
      }
    } catch (error) {
      console.error('Error updating field:', error);
      showNotification('خطا در بروزرسانی اطلاعات', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseModal = () => {
    setIsAnimating(true);
    setIsEditModalOpen(false);
    
    setTimeout(() => {
      setEditingField('');
      setEditValue('');
      setIsAnimating(false);
    }, 300); // Match animation duration
  };

  const handleCloseOrderModal = () => {
    setIsAnimating(true);
    setIsOrderEditModalOpen(false);
    
    setTimeout(() => {
      setEditingOrderId('');
      setEditingOrderField('');
      setEditOrderValue('');
      setIsAnimating(false);
    }, 300); // Match animation duration
  };

  const handleUpdateOrderField = async () => {
    if (!editingOrderId || !editingOrderField) return;
    
    setIsOrderUpdating(true);
    try {
      const updatedOrder = await updateOrderInfo(editingOrderId, editingOrderField, editOrderValue);
      
      if (updatedOrder && updatedOrder.success) {
        // Update the orders state immediately
        const updatedOrders = orders.map(order => 
          order.id === editingOrderId ? { 
            ...order, 
            [editingOrderField]: editingOrderField === 'numberOfPages' ? parseInt(editOrderValue.replace(/[^0-9]/g, '')) || 0 : editOrderValue
          } : order
        );
        
        setOrders(updatedOrders);
        
        // Close modal with animation
        setIsAnimating(true);
        setIsOrderEditModalOpen(false);
        
        setTimeout(() => {
          setEditingOrderId('');
          setEditingOrderField('');
          setEditOrderValue('');
          setIsAnimating(false);
        }, 150);
        
        showNotification('اطلاعات خدمت با موفقیت بروزرسانی شد', 'success');
        
        // Don't reload all data - we already updated the order state
        // The immediate state update above is enough for UI consistency
      }
    } catch (error) {
      console.error('Error updating order field:', error);
      showNotification('خطا در بروزرسانی اطلاعات خدمت', 'error');
    } finally {
      setIsOrderUpdating(false);
    }
  };

  const updateClientInfo = async (clientId: number, field: string, value: string) => {
    
    const fieldMap: Record<string, string> = {
      'firstName': 'client_first_name',
      'lastName': 'client_last_name',
      'company': 'client_company',
      'phone': 'client_phone',
      'email': 'client_email',
      'address': 'client_address',
      'nationalId': 'client_national_id',
      'serviceType': 'service_type'
    };
    
    const wpField = fieldMap[field];
    if (!wpField) throw new Error('Invalid field');
    
    // Convert Persian numbers to English for storage
    const valueForStorage = field === 'phone' || field === 'nationalId' 
      ? value.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()) 
      : value;
    
    
    // Get auth headers from localStorage or cookies
    let authHeaders = {};
    try {
      let userData = localStorage.getItem('user_data');
      
      if (!userData) {
        const cookies = document.cookie.split(';');
        const userCookie = cookies.find(cookie => cookie.trim().startsWith('user_data='));
        if (userCookie) {
          userData = decodeURIComponent(userCookie.split('=')[1]);
        }
      }
      
      if (userData) {
        const user = JSON.parse(userData);
        if (user.token) {
          authHeaders = {
            'Authorization': `Bearer ${user.token}`,
            'X-WP-Nonce': user.nonce || ''
          };
        }
      }
    } catch (error) {
      console.warn('Could not get auth headers:', error);
    }
    
    
    const url = `https://admin.viratranslate.ir/wp-json/custom/v1/clients/${clientId}/update`;
    const requestBody = {
      field: wpField,
      value: valueForStorage
    };


    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update: ${response.status} - ${errorText}`);
    }

    return await response.json();
  };

  const updateOrderInfo = async (orderId: string, field: string, value: string) => {
    const fieldMap: Record<string, string> = {
      'serviceType': 'service_type',
      'translationType': 'translation_type',
      'numberOfPages': 'number_of_pages',
      'languageFrom': 'language_from',
      'languageTo': 'language_to',
      'urgency': 'urgency',
      'specialInstructions': 'special_instructions'
    };
    
    const wpField = fieldMap[field];
    if (!wpField) throw new Error('Invalid field');
    
    // Convert Persian numbers to English for storage
    const valueForStorage = field === 'numberOfPages' 
      ? value.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()) 
      : value;
    
    // Use unified-orders endpoint for updating
    const url = `https://admin.viratranslate.ir/wp-json/custom/v1/unified-orders/${orderId}`;
    const requestBody: Record<string, string> = {};
    requestBody[wpField] = valueForStorage;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update order: ${response.status} - ${errorText}`);
    }

    return await response.json();
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#F7F2F2' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-[#656051]">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#F7F2F2' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-[#656051]">اطلاعات مشتری یافت نشد</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#F7F2F2' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackToClients}
            className="flex items-center gap-1 text-sm text-[#656051] hover:text-[#48453F] transition-colors cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            بازگشت
          </button>
        </div>

        {/* Profile Header */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-[#48453F]">
              {getDisplayName(client)} - <span className="text-[#687B69]">{toPersianNumbers(client.code)}</span>
          </h1>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(orders.length > 0 ? orders[0].status : 'acceptance')}`}>
            {getStatusText(orders.length > 0 ? orders[0].status : 'acceptance')}
          </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 flex border-b border-[#C0B8AC66]">
          {[
            { key: 'userInfo', label: 'اطلاعات' },
            { key: 'visits', label: 'مراجعات' },
            { key: 'financial', label: 'مالی' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'userInfo' | 'visits' | 'financial')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'border-[#687B69] text-[#687B69]'
                  : 'border-transparent text-[#656051] hover:text-[#48453F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'userInfo' && (
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-[#C0B8AC66] p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-[#687B6926] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#687B69]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-[#48453F]">اطلاعات شخصی</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Client Code */}
                <div className="bg-[#F7F2F214] rounded-lg border border-[#C0B8AC66] p-3">
                      <div>
                    <label className="text-xs text-[#656051]">کد مشتری</label>
                    <div className="text-sm font-medium text-[#48453F] mt-1">{client.code || 'ثبت نشده'}</div>
                    </div>
                  </div>

                {/* First Name */}
                <div className="bg-[#F7F2F214] rounded-lg border border-[#C0B8AC66] p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-[#656051]">نام</label>
                      <div className="text-sm font-medium text-[#48453F] mt-1">
                        {client.firstName || 'ثبت نشده'}
                      </div>
                      </div>
                      <button 
                      onClick={() => handleEditField('firstName')}
                      className="w-5 h-5 text-[#C0B8AC] hover:text-[#656051] transition-colors mt-1 cursor-pointer"
                      >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                {/* Last Name */}
                <div className="bg-[#F7F2F214] rounded-lg border border-[#C0B8AC66] p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-[#656051]">نام خانوادگی</label>
                      <div className="text-sm font-medium text-[#48453F] mt-1">
                        {client.lastName || 'ثبت نشده'}
                      </div>
                      </div>
                      <button 
                      onClick={() => handleEditField('lastName')}
                      className="w-5 h-5 text-[#C0B8AC] hover:text-[#656051] transition-colors mt-1 cursor-pointer"
                      >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                {/* Company Name */}
                <div className="bg-[#F7F2F214] rounded-lg border border-[#C0B8AC66] p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-[#656051]">نام شرکت</label>
                      <div className="text-sm font-medium text-[#48453F] mt-1">{client.company || 'ثبت نشده'}</div>
                    </div>
                    <button 
                      onClick={() => handleEditField('company')}
                      className="w-5 h-5 text-[#C0B8AC] hover:text-[#656051] transition-colors mt-1 cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-[#F7F2F214] rounded-lg border border-[#C0B8AC66] p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-[#656051]">شماره تلفن</label>
                      <div className="text-sm font-medium text-[#48453F] mt-1">{client.phone ? toPersianNumbers(client.phone) : 'ثبت نشده'}</div>
                      </div>
                      <button 
                        onClick={() => handleEditField('phone')}
                      className="w-5 h-5 text-[#C0B8AC] hover:text-[#656051] transition-colors mt-1 cursor-pointer"
                      >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      </button>
                  </div>
                </div>

                {/* Email - Spans 2 columns */}
                <div className="bg-[#F7F2F214] rounded-lg border border-[#C0B8AC66] p-3 col-span-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-[#656051]">ایمیل</label>
                      <div className="text-sm font-medium text-[#48453F] mt-1">{client.email || 'ثبت نشده'}</div>
                      </div>
                      <button 
                      onClick={() => handleEditField('email')}
                      className="w-5 h-5 text-[#C0B8AC] hover:text-[#656051] transition-colors mt-1 cursor-pointer"
                      >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      </button>
                    </div>
                  </div>

                {/* National ID */}
                <div className="bg-[#F7F2F214] rounded-lg border border-[#C0B8AC66] p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-[#656051]">کد ملی</label>
                      <div className="text-sm font-medium text-[#48453F] mt-1">{client.nationalId ? toPersianNumbers(client.nationalId) : 'ثبت نشده'}</div>
                      </div>
                      <button 
                      onClick={() => handleEditField('nationalId')}
                      className="w-5 h-5 text-[#C0B8AC] hover:text-[#656051] transition-colors mt-1 cursor-pointer"
                      >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                {/* Address - Full width */}
                <div className="bg-[#F7F2F214] rounded-lg border border-[#C0B8AC66] p-3 col-span-full">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="text-xs text-[#656051]">آدرس</label>
                      <div className="text-sm font-medium text-[#48453F] mt-1">{client.address || 'ثبت نشده'}</div>
                      </div>
                      <button 
                      onClick={() => handleEditField('address')}
                      className="w-5 h-5 text-[#C0B8AC] hover:text-[#656051] transition-colors mt-1 cursor-pointer"
                      >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      </button>
                    </div>
                  </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-lg border border-[#C0B8AC66] p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-[#2B593E26] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#2B593E]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                      </div>
                <h2 className="text-lg font-medium text-[#48453F]">جزئیات خدمات</h2>
              </div>
              
                {orders.length === 0 ? (
                <div className="text-center text-[#656051] py-4">
                  اطلاعات خدمات موجود نیست
                  </div>
                ) : (
              <div className="space-y-4">
                  <div className="text-sm text-[#656051] mb-3">
                    تعداد خدمات: <span className="font-medium text-[#48453F]">{toPersianNumbers(orders.length.toString())}</span>
                  </div>
                  
                  {orders.map((order) => (
                    <div key={order.id} className="bg-[#F7F2F214] border border-[#C0B8AC66] rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Service Info */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">کد سفارش:</span>
                            <span className="text-sm font-medium text-[#48453F]">{toPersianNumbers(order.id || order.orderCode || 'نامشخص')}</span>
                          </div>
                          
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">نوع خدمت:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#48453F]">{order.serviceType || 'نامشخص'}</span>
                      <button 
                                onClick={() => handleEditOrderField(order.id, 'serviceType')}
                                className="w-4 h-4 text-[#C0B8AC] hover:text-[#656051] transition-colors cursor-pointer"
                      >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                          
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">نوع ترجمه:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#48453F]">{getTranslationTypeText(order.translationType)}</span>
                    <button 
                                onClick={() => handleEditOrderField(order.id, 'translationType')}
                                className="w-4 h-4 text-[#C0B8AC] hover:text-[#656051] transition-colors cursor-pointer"
                    >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                </div>

                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">تعداد صفحات:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#48453F]">{toPersianNumbers(order.numberOfPages?.toString() || '0')}</span>
                    <button 
                                onClick={() => handleEditOrderField(order.id, 'numberOfPages')}
                                className="w-4 h-4 text-[#C0B8AC] hover:text-[#656051] transition-colors cursor-pointer"
                    >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
              </div>
            </div>

                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">زبان مبدأ:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#48453F]">{getLanguageText(order.languageFrom)}</span>
                              <button 
                                onClick={() => handleEditOrderField(order.id, 'languageFrom')}
                                className="w-4 h-4 text-[#C0B8AC] hover:text-[#656051] transition-colors cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                              </button>
                </div>
              </div>
              
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">زبان مقصد:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#48453F]">{getLanguageText(order.languageTo)}</span>
                              <button 
                                onClick={() => handleEditOrderField(order.id, 'languageTo')}
                                className="w-4 h-4 text-[#C0B8AC] hover:text-[#656051] transition-colors cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                  </div>
                          </div>
                        </div>
                        
                        {/* Price & Status */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">مبلغ کل:</span>
                            <span className="text-sm font-medium text-[#2B593E]">{toPersianNumbers((order.totalPrice || 0).toLocaleString())} ریال</span>
                          </div>
                          
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">وضعیت:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">فوریت:</span>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                order.urgency === 'very_urgent' ? 'bg-red-100 text-red-800' : 
                                order.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' : 
                                'bg-green-100 text-green-800'
                              }`}>
                                {order.urgency === 'urgent' ? 'فوری' : 
                                 order.urgency === 'very_urgent' ? 'خیلی فوری' : 
                                 order.urgency === 'normal' ? 'عادی' : 'نامشخص'}
                              </span>
                              <button 
                                onClick={() => handleEditOrderField(order.id, 'urgency')}
                                className="w-4 h-4 text-[#C0B8AC] hover:text-[#656051] transition-colors cursor-pointer"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </button>
                        </div>
                        </div>
                          
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">تاریخ ایجاد:</span>
                            <span className="text-sm font-medium text-[#48453F]">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
                        </div>
                          
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-[#656051]">آخرین بروزرسانی:</span>
                            <span className="text-sm font-medium text-[#48453F]">{order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-[#656051]">توضیحات:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#48453F]">{order.specialInstructions || 'تعریف نشده'}</span>
                          <button 
                            onClick={() => handleEditOrderField(order.id, 'specialInstructions')}
                            className="w-4 h-4 text-[#C0B8AC] hover:text-[#656051] transition-colors cursor-pointer"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                        </div>
                      </div>
                    </div>
                  ))}
                        </div>
                      )}
                    </div>
            
            {/* Project Progress */}
            {orders.length > 0 && (
              <div className="bg-white rounded-lg border border-[#C0B8AC66] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-[#A43E2F26] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#A43E2F]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-medium text-[#48453F]">پیشرفت پروژه</h2>
                </div>
                
                {/* Project Stages */}
                <div className="space-y-3">
                  {[
                    { key: 'acceptance', label: 'پذیرش', order: 1 },
                    { key: 'completion', label: 'تکمیل اطلاعات', order: 2 },
                    { key: 'translating', label: 'ترجمه', order: 3 },
                    { key: 'editing', label: 'ویرایش', order: 4 },
                    { key: 'office', label: 'امور دفتری', order: 5 },
                    { key: 'ready', label: 'آماده تحویل', order: 6 },
                    { key: 'archived', label: 'بایگانی', order: 7 }
                  ].map((stage) => {
                    const latestOrder = orders[0]; // Get latest order status
                    const isCurrentStage = latestOrder.status === stage.key;
                    const isCompleted = getStageOrder(latestOrder.status) >= stage.order;
                    const isClickable = getStageOrder(latestOrder.status) >= stage.order - 1;
                    
                    return (
                      <button
                        key={stage.key}
                        onClick={() => isClickable && handleStatusUpdate(stage.key)}
                        disabled={!isClickable}
                        className={`w-full p-3 rounded-lg border text-right transition-all duration-200 cursor-pointer flex items-center justify-between ${
                          isCompleted && !isCurrentStage
                            ? 'bg-[#2B593E26] border-[#2B593E66] text-[#2B593E]'
                            : isCurrentStage
                            ? 'bg-[#A43E2F26] border-[#A43E2F66] text-[#A43E2F]'
                            : 'bg-[#F7F2F214] border-[#C0B8AC66] text-[#656051] hover:bg-[#F7F2F2]'
                        } ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                      >
                        <span className="text-sm font-medium">{stage.label}</span>
                        <div className="flex items-center gap-2">
                          {isCompleted && !isCurrentStage ? (
                            <svg className="w-4 h-4 text-[#2B593E]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className={`w-3 h-3 rounded-full ${
                              isCurrentStage ? 'bg-[#A43E2F]' : 'bg-[#C0B8AC66]'
                            }`}></span>
                )}
              </div>
                      </button>
                    );
                  })}
            </div>
                
                {/* Current Status Info */}
                <div className="mt-4 pt-4 border-t border-[#C0B8AC66]">
                  <div className="text-sm text-[#656051] text-center">
                    وضعیت فعلی: <span className="font-medium text-[#48453F]">{getStatusText(orders[0].status)}</span>
              </div>
            </div>
              </div>
            )}
          </div>
        )}

        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <div className="bg-white rounded-lg border border-[#C0B8AC66] p-4">
            <h2 className="text-md font-medium text-[#48453F] mb-3">مراجعات</h2>
            <div className="text-center text-[#656051] py-4">
              اطلاعات مراجعات موجود نیست
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="bg-white rounded-lg border border-[#C0B8AC66] p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-medium text-[#48453F]">اطلاعات مالی</h2>
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-[#a5b1a3] text-white rounded-lg hover:bg-[#6b7869] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                دانلود فاکتور PDF
              </button>
            </div>
            
            {orders.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-[#F7F2F214] rounded-lg p-4 border border-[#C0B8AC66]">
                  <h3 className="text-lg font-semibold text-[#48453F] mb-3">خلاصه مالی</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#2B593E]">
                        {toPersianNumbers(orders.length.toString())}
                      </div>
                      <div className="text-sm text-[#656051]">تعداد سفارشات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#2B593E]">
                        {toPersianNumbers(orders.reduce((sum, order) => sum + (order.numberOfPages || 0), 0).toString())}
                      </div>
                      <div className="text-sm text-[#656051]">مجموع صفحات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#2B593E]">
                        {toPersianNumbers(orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toLocaleString())}
                      </div>
                      <div className="text-sm text-[#656051]">مجموع مبلغ (ریال)</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-md font-semibold text-[#48453F]">جزئیات سفارشات</h4>
                  {orders.map((order, index) => (
                    <div key={order.id} className="bg-white border border-[#C0B8AC66] rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-[#48453F]">
                            سفارش {toPersianNumbers((index + 1).toString())} - {getTranslationTypeText(order.translationType)}
                          </div>
                          <div className="text-sm text-[#656051]">
                            {getLanguageText(order.languageFrom)} → {getLanguageText(order.languageTo)} | 
                            {toPersianNumbers(order.numberOfPages?.toString() || '0')} صفحه
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-[#2B593E]">
                            {toPersianNumbers((order.totalPrice || 0).toLocaleString())} ریال
                          </div>
                          <div className="text-xs text-[#656051]">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-[#656051] py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p>هیچ سفارشی برای این مشتری ثبت نشده است</p>
          </div>
        )}
      </div>
        )}

        {/* Edit Modal */}
        {(isEditModalOpen || isAnimating) && (
          <div className={`fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 transition-opacity duration-300 ${isEditModalOpen && !isAnimating ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 transform shadow-2xl transition-all duration-300 ${isEditModalOpen && !isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#48453F]">ویرایش اطلاعات</h3>
                <button 
                  onClick={handleCloseModal}
                  className="w-6 h-6 text-[#656051] hover:text-[#48453F] cursor-pointer hover:scale-110 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
      </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#656051] mb-2">
                  {editingField === 'firstName' && 'ویرایش نام'}
                  {editingField === 'lastName' && 'ویرایش نام خانوادگی'}
                  {editingField === 'company' && 'ویرایش نام شرکت'}
                  {editingField === 'phone' && 'ویرایش شماره تلفن'}
                  {editingField === 'email' && 'ویرایش ایمیل'}
                  {editingField === 'nationalId' && 'ویرایش کد ملی'}
                  {editingField === 'address' && 'ویرایش آدرس'}
                  {editingField === 'serviceType' && 'ویرایش نوع خدمات'}
                </label>
                <input
                  type="text"
                  value={editingField === 'phone' || editingField === 'nationalId' ? toPersianNumbers(editValue) : editValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    const persianValue = editingField === 'phone' || editingField === 'nationalId' ? value : value; // Convert if needed
                    setEditValue(persianValue);
                  }}
                  className="w-full px-3 py-2 border border-[#C0B8AC66] rounded-md focus:outline-none focus:ring-2 focus:ring-[#687B69] text-[#48453F] text-right dir-rtl"
                  placeholder={
                    editingField === 'email' ? 'مثال: user@domain.com' :
                    editingField === 'phone' ? 'مثال: ۰۹۱۲۳۴۵۶۷۸۹' :
                    editingField === 'nationalId' ? 'مثال: ۱۲۳۴۵۶۷۸۹۰' :
                    'مقدار جدید را وارد کنید'
                  }
                  style={{ 
                    textAlign: 'right', 
                    direction: 'rtl'
                  }}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-[#C0B8AC66] rounded-md text-[#656051] hover:bg-[#F7F2F2] transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                >
                  لغو
                </button>
                <button
                  onClick={handleUpdateField}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-[#a5b1a3] text-white rounded-md hover:bg-[#6b7869] transition-all duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {isUpdating ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Order Edit Modal */}
      {(isOrderEditModalOpen || isAnimating) && (
        <div className={`fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 transition-opacity duration-300 ${isOrderEditModalOpen && !isAnimating ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 transform shadow-2xl transition-all duration-300 ${isOrderEditModalOpen && !isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#48453F]">ویرایش خدمت</h3>
              <button 
                onClick={handleCloseOrderModal}
                className="w-6 h-6 text-[#656051] hover:text-[#48453F] cursor-pointer hover:scale-110 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#656051] mb-2">
                {editingOrderField === 'serviceType' && 'ویرایش نوع خدمت'}
                {editingOrderField === 'translationType' && 'ویرایش نوع ترجمه'}
                {editingOrderField === 'numberOfPages' && 'ویرایش تعداد صفحات'}
                {editingOrderField === 'languageFrom' && 'ویرایش زبان مبدأ'}
                {editingOrderField === 'languageTo' && 'ویرایش زبان مقصد'}
                {editingOrderField === 'urgency' && 'ویرایش فوریت'}
                {editingOrderField === 'specialInstructions' && 'ویرایش توضیحات'}
              </label>
              {editingOrderField === 'serviceType' && (
                <select
                  value={editOrderValue}
                  onChange={(e) => setEditOrderValue(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C0B8AC66] rounded-md focus:outline-none focus:ring-2 focus:ring-[#687B69] text-[#48453F] text-right dir-rtl"
                  style={{ textAlign: 'right', direction: 'rtl' }}
                >
                  <option value="ترجمه">ترجمه</option>
                  <option value="تائیدات دادگستری">تائیدات دادگستری</option>
                  <option value="تائیدات خارجه">تائیدات خارجه</option>
                  <option value="برابر اصل">برابر اصل</option>
                </select>
              )}
              
              {editingOrderField === 'translationType' && (
                <select
                  value={editOrderValue}
                  onChange={(e) => setEditOrderValue(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C0B8AC66] rounded-md focus:outline-none focus:ring-2 focus:ring-[#687B69] text-[#48453F] text-right dir-rtl"
                  style={{ textAlign: 'right', direction: 'rtl' }}
                >
                  <option value="certified">ترجمه رسمی</option>
                  <option value="simple">ترجمه ساده</option>
                  <option value="sworn">ترجمه سوگند</option>
                  <option value="notarized">ترجمه محضری</option>
                </select>
              )}
              
              {editingOrderField === 'languageFrom' && (
                <select
                  value={editOrderValue}
                  onChange={(e) => setEditOrderValue(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C0B8AC66] rounded-md focus:outline-none focus:ring-2 focus:ring-[#687B69] text-[#48453F] text-right dir-rtl"
                  style={{ textAlign: 'right', direction: 'rtl' }}
                >
                  <option value="persian">فارسی</option>
                  <option value="english">انگلیسی</option>
                  <option value="arabic">عربی</option>
                  <option value="french">فرانسوی</option>
                  <option value="german">آلمانی</option>
                  <option value="other">سایر</option>
                </select>
              )}
              
              {editingOrderField === 'languageTo' && (
                <select
                  value={editOrderValue}
                  onChange={(e) => setEditOrderValue(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C0B8AC66] rounded-md focus:outline-none focus:ring-2 focus:ring-[#687B69] text-[#48453F] text-right dir-rtl"
                  style={{ textAlign: 'right', direction: 'rtl' }}
                >
                  <option value="persian">فارسی</option>
                  <option value="english">انگلیسی</option>
                  <option value="arabic">عربی</option>
                  <option value="french">فرانسوی</option>
                  <option value="german">آلمانی</option>
                  <option value="other">سایر</option>
                </select>
              )}
              
              {editingOrderField === 'urgency' && (
                <select
                  value={editOrderValue}
                  onChange={(e) => setEditOrderValue(e.target.value)}
                  className="w-full px-3 py-2 border border-[#C0B8AC66] rounded-md focus:outline-none focus:ring-2 focus:ring-[#687B69] text-[#48453F] text-right dir-rtl"
                  style={{ textAlign: 'right', direction: 'rtl' }}
                >
                  <option value="normal">عادی</option>
                  <option value="urgent">فوری</option>
                  <option value="very_urgent">خیلی فوری</option>
                </select>
              )}
              
              {(editingOrderField === 'numberOfPages' || editingOrderField === 'specialInstructions') && (
                <input
                  type={editingOrderField === 'numberOfPages' ? 'number' : 'text'}
                  value={editingOrderField === 'numberOfPages' ? toPersianNumbers(editOrderValue) : editOrderValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    const persianValue = editingOrderField === 'numberOfPages' ? value : value;
                    setEditOrderValue(persianValue);
                  }}
                  className="w-full px-3 py-2 border border-[#C0B8AC66] rounded-md focus:outline-none focus:ring-2 focus:ring-[#687B69] text-[#48453F] text-right dir-rtl"
                  placeholder="مقدار جدید را وارد کنید"
                  style={{ 
                    textAlign: 'right', 
                    direction: 'rtl'
                  }}
                />
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCloseOrderModal}
                className="flex-1 px-4 py-2 border border-[#C0B8AC66] rounded-md text-[#656051] hover:bg-[#F7F2F2] transition-all duration-200 cursor-pointer hover:scale-[1.02]"
              >
                لغو
              </button>
              <button
                onClick={handleUpdateOrderField}
                disabled={isOrderUpdating}
                className="flex-1 px-4 py-2 bg-[#a5b1a3] text-white rounded-md hover:bg-[#6b7869] transition-all duration-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.02] disabled:hover:scale-100"
              >
                {isOrderUpdating ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Component */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
      />
    </div>
  );
};

export default ClientProfile;