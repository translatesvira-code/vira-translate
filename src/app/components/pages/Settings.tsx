'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianNumbers } from '../../utils/numbers';
import { settingsAPI, ServiceSettings, CategorySettings, SettingsData, DocumentItem, LanguageSettings } from '../../lib/settings-api';
import Notification from '../Notification';

// Interfaces are now imported from settings-api

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'languages' | 'invoice'>('services');
  const [services, setServices] = useState<ServiceSettings[]>([
    { id: '1', name: 'تائیدات دادگستری', price: 0, additionType: 'percentage', additionValue: 0, total: 0 },
    { id: '2', name: 'تائیدات خارجه', price: 0, additionType: 'percentage', additionValue: 0, total: 0 },
    { id: '3', name: 'برابر اصل', price: 0, additionType: 'percentage', additionValue: 0, total: 0 }
  ]);

  // Helper functions for price formatting
  // const formatPrice = (value: number): string => {
  //   if (value === 0) return '';
  //   return value.toLocaleString('fa-IR');
  // };

  // const parsePrice = (value: string): number => {
  //   if (!value || value === '') return 0;
  //   // Remove commas and convert to number
  //   const cleanValue = value.replace(/,/g, '');
  //   return parseInt(cleanValue) || 0;
  // };

  // Format number with Persian digits and commas
  const formatPersianNumber = (value: string): string => {
    if (!value) return '';
    
    // Convert Persian digits to English first
    const englishValue = value.replace(/[۰-۹]/g, (digit) => {
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return persianDigits.indexOf(digit).toString();
    });
    
    // Remove all non-numeric characters except commas
    const cleanValue = englishValue.replace(/[^0-9,]/g, '');
    
    // Remove existing commas and add new ones
    const withoutCommas = cleanValue.replace(/,/g, '');
    const formatted = withoutCommas.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Convert to Persian digits
    return formatted.replace(/[0-9]/g, (digit) => {
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return persianDigits[parseInt(digit)];
    });
  };

  // Parse Persian number to regular number
  const parsePersianNumber = (value: string): number => {
    if (!value) return 0;
    
    // Convert Persian digits to English
    const englishValue = value.replace(/[۰-۹]/g, (digit) => {
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return persianDigits.indexOf(digit).toString();
    });
    
    // Remove commas and convert to number
    const cleanValue = englishValue.replace(/,/g, '');
    return parseInt(cleanValue) || 0;
  };

  // Handle price input with Persian formatting
  const handlePriceInput = (value: string, callback: (num: number) => void) => {
    const numericValue = parsePersianNumber(value);
    callback(numericValue);
  };

  const [categories, setCategories] = useState<CategorySettings[]>([
    { id: '1', name: 'هویتی', items: [] },
    { id: '2', name: 'تحصیلی', items: [] },
    { id: '3', name: 'مالی', items: [] },
    { id: '4', name: 'پزشکی', items: [] }
  ]);

  // Languages state
  const [languages, setLanguages] = useState<LanguageSettings>({
    from: 'persian',
    to: 'english',
    pairs: [
      { from: 'persian', to: 'english' },
      { from: 'english', to: 'persian' }
    ]
  });

  // Invoice settings state
  const [invoiceSettings, setInvoiceSettings] = useState<{
    header: string;
    footer: string;
  }>({
    header: 'نام دفتر ترجمه',
    footer: 'توضیحات فاکتور'
  });

  // Notification states
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  const [loading, setLoading] = useState(false);

  // Separate display states for price inputs
  const [priceDisplays, setPriceDisplays] = useState<{[key: string]: string}>({});

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settingsData = await settingsAPI.getSettings();
      if (settingsData) {
        setServices(settingsData.services);
        // Ensure all categories have items array
        const categoriesWithItems = settingsData.categories.map(category => ({
          ...category,
          items: category.items || []
        }));
        setCategories(categoriesWithItems);
        
        // Load languages if available
        if (settingsData.languages) {
          setLanguages(settingsData.languages);
        }
        
        // Update price displays based on loaded data
        const newPriceDisplays: {[key: string]: string} = {};
        
        // Services
        settingsData.services.forEach(service => {
          // Always set price display, even if 0
          newPriceDisplays[`service_${service.id}_price`] = service.price > 0 
            ? formatPersianNumber(service.price.toString()) 
            : '';
          
          // Always set addition display, even if 0
          newPriceDisplays[`service_${service.id}_addition`] = service.additionValue > 0 
            ? (service.additionType === 'percentage' 
                ? service.additionValue.toString() 
                : formatPersianNumber(service.additionValue.toString()))
            : '';
        });
        
        // Document items only
        categoriesWithItems.forEach(category => {
          if (category.items && Array.isArray(category.items)) {
            category.items.forEach(item => {
              newPriceDisplays[`item_${item.id}_translation`] = item.translationPrice > 0 
                ? formatPersianNumber(item.translationPrice.toString()) 
                : '';
              
              newPriceDisplays[`item_${item.id}_office`] = item.officeServicePrice > 0 
                ? formatPersianNumber(item.officeServicePrice.toString()) 
                : '';
              
              // Handle inquiry prices array
              if (item.inquiryPrices && Array.isArray(item.inquiryPrices)) {
                item.inquiryPrices.forEach((price, index) => {
                  newPriceDisplays[`item_${item.id}_inquiry_${index}`] = price > 0 
                    ? formatPersianNumber(price.toString()) 
                    : '';
                });
              }
            });
          }
        });
        
        console.log('Setting price displays:', newPriceDisplays);
        setPriceDisplays(newPriceDisplays);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('خطا در بارگذاری تنظیمات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    // Clear localStorage to avoid conflicts
    localStorage.removeItem('settings_price_displays');
  }, [loadSettings]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const updateService = (id: string, field: keyof ServiceSettings, value: string | number | boolean) => {
    setServices(prev => prev.map(service => {
      if (service.id === id) {
        const updated = { ...service, [field]: value };
        
        // Calculate total
        if (field === 'price' || field === 'additionType' || field === 'additionValue') {
          let addition = 0;
          if (updated.additionType === 'percentage') {
            addition = (updated.price * updated.additionValue) / 100;
          } else {
            addition = updated.additionValue;
          }
          updated.total = updated.price + addition;
        }
        
        return updated;
      }
      return service;
    }));
  };


  const updateDocumentItem = (categoryId: string, itemId: string, field: keyof DocumentItem, value: string | number | boolean) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        const updatedItems = category.items.map(item => {
          if (item.id === itemId) {
            const updated = { ...item, [field]: value };
            
            // Calculate total
            if (field === 'translationPrice' || field === 'officeServicePrice' || field === 'inquiryPrices') {
              const inquiryTotal = (updated.inquiryPrices || []).reduce((sum, price) => sum + price, 0);
              updated.total = updated.translationPrice + updated.officeServicePrice + inquiryTotal;
            }
            
            return updated;
          }
          return item;
        });
        
        return { ...category, items: updatedItems };
      }
      return category;
    }));
  };

  const addDocumentItem = (categoryId: string) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        const newItemId = `${categoryId}-${Date.now()}`;
        const newItem: DocumentItem = {
          id: newItemId,
          name: 'آیتم جدید',
          translationPrice: 0,
          officeServicePrice: 0,
          hasInquiry: false,
          inquiryPrices: [],
          total: 0
        };
        
        return { ...category, items: [...category.items, newItem] };
      }
      return category;
    }));
  };

  const removeDocumentItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        return { ...category, items: category.items.filter(item => item.id !== itemId) };
      }
      return category;
    }));
  };

  const addInquiryPrice = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        const updatedItems = category.items.map(item => {
          if (item.id === itemId) {
            const updated = { ...item, inquiryPrices: [...(item.inquiryPrices || []), 0] };
            const inquiryTotal = updated.inquiryPrices.reduce((sum, price) => sum + price, 0);
            updated.total = updated.translationPrice + updated.officeServicePrice + inquiryTotal;
            return updated;
          }
          return item;
        });
        return { ...category, items: updatedItems };
      }
      return category;
    }));
  };

  const removeInquiryPrice = (categoryId: string, itemId: string, priceIndex: number) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        const updatedItems = category.items.map(item => {
          if (item.id === itemId) {
            const updated = { 
              ...item, 
              inquiryPrices: (item.inquiryPrices || []).filter((_, index) => index !== priceIndex) 
            };
            const inquiryTotal = updated.inquiryPrices.reduce((sum, price) => sum + price, 0);
            updated.total = updated.translationPrice + updated.officeServicePrice + inquiryTotal;
            return updated;
          }
          return item;
        });
        return { ...category, items: updatedItems };
      }
      return category;
    }));
  };

  const updateInquiryPrice = (categoryId: string, itemId: string, priceIndex: number, value: number) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        const updatedItems = category.items.map(item => {
          if (item.id === itemId) {
            const updated = { 
              ...item, 
              inquiryPrices: (item.inquiryPrices || []).map((price, index) => 
                index === priceIndex ? value : price
              )
            };
            const inquiryTotal = updated.inquiryPrices.reduce((sum, price) => sum + price, 0);
            updated.total = updated.translationPrice + updated.officeServicePrice + inquiryTotal;
            return updated;
          }
          return item;
        });
        return { ...category, items: updatedItems };
      }
      return category;
    }));
  };


  const addLanguagePair = () => {
    if (languages.from && languages.to) {
      const newPair = { from: languages.from, to: languages.to };
      const exists = languages.pairs.some(pair => 
        pair.from === newPair.from && pair.to === newPair.to
      );
      
      if (!exists) {
        setLanguages(prev => ({
          ...prev,
          pairs: [...prev.pairs, newPair]
        }));
      }
    }
  };

  const removeLanguagePair = (index: number) => {
    setLanguages(prev => ({
      ...prev,
      pairs: prev.pairs.filter((_, i) => i !== index)
    }));
  };

  const createReversePair = (from: string, to: string) => {
    const newPair = { from: to, to: from };
    const exists = languages.pairs.some(pair => 
      pair.from === newPair.from && pair.to === newPair.to
    );
    
    if (!exists) {
      setLanguages(prev => ({
        ...prev,
        pairs: [...prev.pairs, newPair]
      }));
    }
  };

  const getLanguageText = (lang: string) => {
    const languages: Record<string, string> = {
      'persian': 'فارسی',
      'english': 'انگلیسی',
      'arabic': 'عربی',
      'french': 'فرانسوی',
      'german': 'آلمانی',
      'spanish': 'اسپانیایی',
      'italian': 'ایتالیایی',
      'russian': 'روسی',
      'chinese': 'چینی',
      'japanese': 'ژاپنی',
      'korean': 'کره‌ای',
      'turkish': 'ترکی',
      'other': 'سایر'
    };
    return languages[lang] || lang;
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const settingsData: SettingsData = {
        services,
        categories,
        languages
      };

      console.log('Saving settings to API:', settingsData);
      const success = await settingsAPI.saveSettings(settingsData);
      
      if (success) {
        console.log('Settings saved successfully to API');
        showNotification('تنظیمات با موفقیت ذخیره شد', 'success');
      } else {
        console.error('Failed to save settings to API');
        showNotification('خطا در ذخیره تنظیمات', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('خطا در ذخیره تنظیمات', 'error');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f4f1' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold" style={{ color: '#4b483f' }}>تنظیمات سیستم</h1>
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

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f5f4f1' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold" style={{ color: '#4b483f' }}>تنظیمات سیستم</h1>
            
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('services')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'services'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                خدمات
              </button>
              <button
                onClick={() => setActiveTab('languages')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'languages'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                زبان‌ها
              </button>
              <button
                onClick={() => setActiveTab('invoice')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  activeTab === 'invoice'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                تنظیمات فاکتور
              </button>
            </div>
          </div>
          
          {/* Services Tab */}
          {activeTab === 'services' && (
            <>
              {/* Services Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">خدمات ثابت</h2>
            
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام خدمت</label>
                    <input
                      type="text"
                      value={service.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">قیمت پایه (ریال)</label>
                    <input
                      type="text"
                      value={priceDisplays[`service_${service.id}_price`] || ''}
                      onInput={(e) => {
                        const inputValue = (e.target as HTMLInputElement).value;
                        const formattedValue = formatPersianNumber(inputValue);
                        
                        setPriceDisplays(prev => ({
                          ...prev,
                          [`service_${service.id}_price`]: formattedValue
                        }));
                        
                        // Update the actual service price
                        handlePriceInput(formattedValue, (numericValue) => {
                          updateService(service.id, 'price', numericValue);
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-900 text-right font-persian-numbers"
                      dir="ltr"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع اضافات</label>
                    <div className="flex gap-2">
                      <label className="flex items-center text-gray-800">
                        <input
                          type="radio"
                          name={`additionType_${service.id}`}
                          value="percentage"
                          checked={service.additionType === 'percentage'}
                          onChange={(e) => updateService(service.id, 'additionType', e.target.value)}
                          className="ml-2"
                        />
                        درصد
                      </label>
                      <label className="flex items-center text-gray-800">
                        <input
                          type="radio"
                          name={`additionType_${service.id}`}
                          value="amount"
                          checked={service.additionType === 'amount'}
                          onChange={(e) => updateService(service.id, 'additionType', e.target.value)}
                          className="ml-2"
                        />
                        مبلغ
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مقدار اضافات {service.additionType === 'percentage' ? '(%)' : '(ریال)'}
                    </label>
                    <input
                      type="text"
                      value={priceDisplays[`service_${service.id}_addition`] || ''}
                      onInput={(e) => {
                        const inputValue = (e.target as HTMLInputElement).value;
                        
                        if (service.additionType === 'percentage') {
                          // For percentage, just allow numbers
                          const cleanValue = inputValue.replace(/[^0-9]/g, '');
                          setPriceDisplays(prev => ({
                            ...prev,
                            [`service_${service.id}_addition`]: cleanValue
                          }));
                          updateService(service.id, 'additionValue', Number(cleanValue) || 0);
                        } else {
                          // For amount, format with Persian digits and commas
                          const formattedValue = formatPersianNumber(inputValue);
                          setPriceDisplays(prev => ({
                            ...prev,
                            [`service_${service.id}_addition`]: formattedValue
                          }));
                          handlePriceInput(formattedValue, (numericValue) => {
                            updateService(service.id, 'additionValue', numericValue);
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-900 text-right font-persian-numbers"
                      dir="ltr"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">جمع کل</label>
                    <input
                      type="text"
                      value={toPersianNumbers(service.total.toLocaleString())}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-medium text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-300 my-8"></div>

          {/* Categories Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">دسته‌بندی‌های اسناد</h2>
            
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Category Header */}
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <h3 className="text-lg font-medium text-gray-800">{category.name}</h3>
                    {category.items.length === 0 && (
                      <p className="text-gray-500 mt-2">اولین زیردسته را ایجاد کنید</p>
                    )}
                  </div>

                  {/* Document Items */}
                  <div className="ml-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-medium text-gray-700">آیتم‌های سند</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addDocumentItem(category.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          + افزودن آیتم
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {(category.items || []).map((item) => (
                        <div key={item.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          {/* Main Item Row */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">نام آیتم</label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateDocumentItem(category.id, item.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-800"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">قیمت ترجمه (ریال)</label>
                              <input
                                type="text"
                                value={priceDisplays[`item_${item.id}_translation`] || ''}
                                onInput={(e) => {
                                  const inputValue = (e.target as HTMLInputElement).value;
                                  const formattedValue = formatPersianNumber(inputValue);
                                  
                                  setPriceDisplays(prev => ({
                                    ...prev,
                                    [`item_${item.id}_translation`]: formattedValue
                                  }));
                                  
                                  handlePriceInput(formattedValue, (numericValue) => {
                                    updateDocumentItem(category.id, item.id, 'translationPrice', numericValue);
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-900 text-right font-persian-numbers"
                                dir="ltr"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">قیمت خدمات دفتری (ریال)</label>
                              <input
                                type="text"
                                value={priceDisplays[`item_${item.id}_office`] || ''}
                                onInput={(e) => {
                                  const inputValue = (e.target as HTMLInputElement).value;
                                  const formattedValue = formatPersianNumber(inputValue);
                                  
                                  setPriceDisplays(prev => ({
                                    ...prev,
                                    [`item_${item.id}_office`]: formattedValue
                                  }));
                                  
                                  handlePriceInput(formattedValue, (numericValue) => {
                                    updateDocumentItem(category.id, item.id, 'officeServicePrice', numericValue);
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-900 text-right font-persian-numbers"
                                dir="ltr"
                              />
                            </div>
                            
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">جمع کل</label>
                                <input
                                  type="text"
                                  value={toPersianNumbers(item.total.toLocaleString())}
                                  readOnly
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-medium text-left"
                                  dir="ltr"
                                />
                              </div>
                              <button
                                onClick={() => removeDocumentItem(category.id, item.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Inquiry Section */}
                          <div className="border-t border-blue-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={item.hasInquiry}
                                  onChange={(e) => updateDocumentItem(category.id, item.id, 'hasInquiry', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label className="text-sm font-medium text-gray-700">گزینه استعلام</label>
                              </div>
                              {item.hasInquiry && (
                                <button
                                  onClick={() => addInquiryPrice(category.id, item.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  + افزودن هزینه استعلام
                                </button>
                              )}
                            </div>
                            
                            {item.hasInquiry && (
                              <div className="space-y-2">
                                {(item.inquiryPrices || []).map((price, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="مبلغ هزینه استعلام (ریال)"
                                      value={priceDisplays[`item_${item.id}_inquiry_${index}`] || ''}
                                      onInput={(e) => {
                                        const inputValue = (e.target as HTMLInputElement).value;
                                        const formattedValue = formatPersianNumber(inputValue);
                                        
                                        setPriceDisplays(prev => ({
                                          ...prev,
                                          [`item_${item.id}_inquiry_${index}`]: formattedValue
                                        }));
                                        
                                        handlePriceInput(formattedValue, (numericValue) => {
                                          updateInquiryPrice(category.id, item.id, index, numericValue);
                                        });
                                      }}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-right font-persian-numbers"
                                      dir="ltr"
                                    />
                                    <button
                                      onClick={() => removeInquiryPrice(category.id, item.id, index)}
                                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded transition-colors duration-200"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
            </>
          )}

          {/* Languages Tab */}
          {activeTab === 'languages' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">تنظیمات زبان‌ها</h2>
                  <p className="text-sm text-gray-600">مدیریت جفت زبان‌های قابل ترجمه</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Language Pair Creator */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">افزودن جفت زبان جدید</h3>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">زبان مبدأ</label>
                      <select
                        value={languages.from}
                        onChange={(e) => setLanguages(prev => ({ ...prev, from: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                      >
                        <option value="persian">فارسی</option>
                        <option value="english">انگلیسی</option>
                        <option value="arabic">عربی</option>
                        <option value="french">فرانسوی</option>
                        <option value="german">آلمانی</option>
                        <option value="spanish">اسپانیایی</option>
                        <option value="italian">ایتالیایی</option>
                        <option value="russian">روسی</option>
                        <option value="chinese">چینی</option>
                        <option value="japanese">ژاپنی</option>
                        <option value="korean">کره‌ای</option>
                        <option value="turkish">ترکی</option>
                        <option value="other">سایر</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">زبان مقصد</label>
                      <select
                        value={languages.to}
                        onChange={(e) => setLanguages(prev => ({ ...prev, to: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white shadow-sm transition-all duration-200"
                      >
                        <option value="persian">فارسی</option>
                        <option value="english">انگلیسی</option>
                        <option value="arabic">عربی</option>
                        <option value="french">فرانسوی</option>
                        <option value="german">آلمانی</option>
                        <option value="spanish">اسپانیایی</option>
                        <option value="italian">ایتالیایی</option>
                        <option value="russian">روسی</option>
                        <option value="chinese">چینی</option>
                        <option value="japanese">ژاپنی</option>
                        <option value="korean">کره‌ای</option>
                        <option value="turkish">ترکی</option>
                        <option value="other">سایر</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <button
                        onClick={addLanguagePair}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        افزودن
                      </button>
                    </div>
                  </div>
                </div>

                {/* Language Pairs List */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">جفت زبان‌های موجود</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {toPersianNumbers(languages.pairs.length)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {languages.pairs.map((pair, index) => (
                      <div key={index} className="group bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-gray-800 font-medium text-sm">
                                {getLanguageText(pair.from)} → {getLanguageText(pair.to)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {/* Only show reverse button if reverse pair doesn't exist */}
                            {!languages.pairs.some(existingPair => 
                              existingPair.from === pair.to && existingPair.to === pair.from
                            ) && (
                              <button
                                onClick={() => createReversePair(pair.from, pair.to)}
                                className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer"
                                title="ایجاد حالت برعکس"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => removeLanguagePair(index)}
                              className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer"
                              title="حذف"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {languages.pairs.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">هنوز جفت زبانی اضافه نشده است</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Invoice Settings Tab */}
          {activeTab === 'invoice' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">تنظیمات فاکتور</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">هدر فاکتور</label>
                  <textarea
                    value={invoiceSettings.header}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, header: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    rows={3}
                    placeholder="متن هدر فاکتور را وارد کنید"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">فوتر فاکتور</label>
                  <textarea
                    value={invoiceSettings.footer}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, footer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    rows={3}
                    placeholder="متن فوتر فاکتور را وارد کنید"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                فرم را کامل کنید و سپس ذخیره کنید
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  ذخیره تنظیمات
                </>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Notification */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
        duration={5000}
      />
    </div>
  );
};

export default Settings;