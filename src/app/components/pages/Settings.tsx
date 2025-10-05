'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianNumbers } from '../../utils/numbers';
import { settingsAPI, ServiceSettings, CategorySettings, SettingsData, DocumentItem, LanguageSettings, TranslatorsSettings, InvoiceSettings } from '../../lib/settings-api';
import Notification from '../Notification';
import { Button, Select, Input, RadioButton } from '../ui';

// Interfaces are now imported from settings-api

// Language options
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

  // Translators state
  const [translators, setTranslators] = useState<TranslatorsSettings>({
    translators: [],
    assistants: [],
    editors: []
  });
  const [invoice, setInvoice] = useState<InvoiceSettings>({
    header: {
      officeNumber: '',
      translatorName: '',
      officeName: '',
      city: '',
      address: '',
      phone: '',
      whatsapp: '',
      telegram: '',
      eitaa: ''
    },
    footer: ''
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
        
        // Load translators if available
      if (settingsData.translators) {
        setTranslators(settingsData.translators);
      }
      if (settingsData.invoice) {
        setInvoice(settingsData.invoice);
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
                ? service.additionValue.toString().replace(/[0-9]/g, (digit: string) => {
                    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                    return persianDigits[parseInt(digit)];
                  })
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
                item.inquiryPrices.forEach((inquiry, index) => {
                  newPriceDisplays[`item_${item.id}_inquiry_${index}`] = inquiry.price > 0 
                    ? formatPersianNumber(inquiry.price.toString()) 
                    : '';
                });
              }
            });
          }
        });
        
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
              const inquiryTotal = (updated.inquiryPrices || []).reduce((sum, inquiry) => sum + inquiry.price, 0);
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
            const updated = { ...item, inquiryPrices: [...(item.inquiryPrices || []), { title: '', price: 0 }] };
            const inquiryTotal = updated.inquiryPrices.reduce((sum, inquiry) => sum + inquiry.price, 0);
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
            const inquiryTotal = updated.inquiryPrices.reduce((sum, inquiry) => sum + inquiry.price, 0);
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
              inquiryPrices: (item.inquiryPrices || []).map((inquiry, index) => 
                index === priceIndex ? { ...inquiry, price: value } : inquiry
              )
            };
            const inquiryTotal = updated.inquiryPrices.reduce((sum, inquiry) => sum + inquiry.price, 0);
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

  const updateInquiryTitle = (categoryId: string, itemId: string, priceIndex: number, title: string) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        const updatedItems = category.items.map(item => {
          if (item.id === itemId) {
            return { 
              ...item, 
              inquiryPrices: (item.inquiryPrices || []).map((inquiry, index) => 
                index === priceIndex ? { ...inquiry, title } : inquiry
              )
            };
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

  const removeLanguageGroup = (groupPairs: Array<{from: string, to: string, index: number}>) => {
    const indicesToRemove = groupPairs.map(pair => pair.index).sort((a, b) => b - a);
    setLanguages(prev => ({
      ...prev,
      pairs: prev.pairs.filter((_, index) => !indicesToRemove.includes(index))
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

  // Generate unique 6-digit random code for translators
  const generateCode = (type: 'translator' | 'assistant' | 'editor', existingCodes: string[]): string => {
    let code: string;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (existingCodes.includes(code));
    
    return code;
  };

  // Add translator functions
  const addTranslator = (type: 'translators' | 'assistants' | 'editors', name: string) => {
    if (!name.trim()) return;
    
    const existingCodes = [
      ...translators.translators.map(t => t.code),
      ...translators.assistants.map(t => t.code),
      ...translators.editors.map(t => t.code)
    ];
    
    const codeType = type === 'translators' ? 'translator' : type === 'assistants' ? 'assistant' : 'editor';
    const newCode = generateCode(codeType, existingCodes);
    
    const newTranslator = {
      id: `${type}-${Date.now()}`,
      name: name.trim(),
      code: newCode
    };
    
    setTranslators(prev => ({
      ...prev,
      [type]: [...prev[type], newTranslator]
    }));
  };

  const removeTranslator = (type: 'translators' | 'assistants' | 'editors', id: string) => {
    setTranslators(prev => ({
      ...prev,
      [type]: prev[type].filter(t => t.id !== id)
    }));
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

  // Group language pairs by their bidirectional relationship
  const getGroupedLanguagePairs = () => {
    const groups: Array<{
      id: string;
      pairs: Array<{from: string, to: string, index: number}>;
    }> = [];
    
    const processed = new Set<number>();
    
    languages.pairs.forEach((pair, index) => {
      if (processed.has(index)) return;
      
      const groupId = `${pair.from}-${pair.to}`;
      const reversePair = languages.pairs.find((p, i) => 
        i !== index && p.from === pair.to && p.to === pair.from
      );
      
      const groupPairs = [{...pair, index}];
      if (reversePair) {
        const reverseIndex = languages.pairs.findIndex((p, i) => 
          i !== index && p.from === pair.to && p.to === pair.from
        );
        groupPairs.push({...reversePair, index: reverseIndex});
        processed.add(reverseIndex);
      }
      
      groups.push({
        id: groupId,
        pairs: groupPairs
      });
      
      processed.add(index);
    });
    
    return groups;
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const settingsData: SettingsData = {
        services,
        categories,
        languages,
        translators,
        invoice
      };

      const success = await settingsAPI.saveSettings(settingsData);
      
      if (success) {
        showNotification('تنظیمات با موفقیت ذخیره شد', 'success');
      } else {
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
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f9f8f5' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold" style={{ color: '#4b483f' }}>تنظیمات سیستم</h1>
            
            {/* Tab Navigation */}
            <div className="mt-4 flex border-b border-[#C0B8AC66]">
              {[
                { key: 'services', label: 'خدمات' },
                { key: 'languages', label: 'تعاریف' },
                { key: 'invoice', label: 'تنظیمات فاکتور' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'services' | 'languages' | 'invoice')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab.key
                      ? 'border-[#a5b1a3] text-[#a5b1a3]'
                      : 'border-transparent text-[#656051] hover:text-[#48453F]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Services Tab */}
          {activeTab === 'services' && (
            <>
              {/* Services Section */}
          <div className="rounded-lg border border-gray-200 p-6 mb-8" style={{ backgroundColor: '#fcfbf9' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">خدمات ثابت</h2>
            
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                  <Input
                    label="نام خدمت"
                    type="text"
                    value={service.name}
                    disabled
                  />
                  
                  <Input
                    label="قیمت پایه (ریال)"
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
                    placeholder="قیمت پایه را وارد کنید"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نوع اضافات</label>
                    <div className="flex gap-2">
                      <RadioButton
                        name={`additionType_${service.id}`}
                        value="percentage"
                        checked={service.additionType === 'percentage'}
                        onChange={(value) => updateService(service.id, 'additionType', value)}
                        label="درصد"
                      />
                      <RadioButton
                        name={`additionType_${service.id}`}
                        value="amount"
                        checked={service.additionType === 'amount'}
                        onChange={(value) => updateService(service.id, 'additionType', value)}
                        label="مبلغ"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Input
                      label={`مقدار اضافات ${service.additionType === 'percentage' ? '(%)' : '(ریال)'}`}
                      type="text"
                      value={priceDisplays[`service_${service.id}_addition`] || ''}
                      onInput={(e) => {
                        const inputValue = (e.target as HTMLInputElement).value;
                        
                        if (service.additionType === 'percentage') {
                          // For percentage, allow numbers and convert to Persian
                          const cleanValue = inputValue.replace(/[^0-9]/g, '');
                          const persianValue = cleanValue.replace(/[0-9]/g, (digit: string) => {
                            const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                            return persianDigits[parseInt(digit)];
                          });
                          setPriceDisplays(prev => ({
                            ...prev,
                            [`service_${service.id}_addition`]: persianValue
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
                      placeholder={`مقدار اضافات ${service.additionType === 'percentage' ? 'درصد' : 'ریال'} را وارد کنید`}
                    />
                  </div>
                  
                  <Input
                    label="جمع کل"
                    type="text"
                    value={toPersianNumbers(service.total.toLocaleString())}
                    disabled
                    className="bg-green-50 text-green-700 font-medium"
                  />
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
                        <Button
                          onClick={() => addDocumentItem(category.id)}
                          variant="primary"
                          size="sm"
                          className="px-3 py-1"
                        >
                          + افزودن آیتم
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {(category.items || []).map((item) => (
                        <div key={item.id} className="p-4 bg-[#a5b1a3]/10 rounded-lg border border-[#a5b1a3]/20">
                          {/* Main Item Row */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                            <div>
                              <Input
                                label="نام آیتم"
                                type="text"
                                value={item.name}
                                onChange={(e) => updateDocumentItem(category.id, item.id, 'name', e.target.value)}
                                placeholder="نام آیتم را وارد کنید"
                              />
                            </div>
                            
                            <div>
                              <Input
                                label="قیمت ترجمه (ریال)"
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
                                placeholder="قیمت ترجمه را وارد کنید"
                              />
                            </div>
                            
                            <div>
                              <Input
                                label="قیمت خدمات دفتری (ریال)"
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
                                placeholder="قیمت خدمات دفتری را وارد کنید"
                              />
                            </div>
                            
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <Input
                                  label="جمع کل"
                                  type="text"
                                  value={toPersianNumbers(item.total.toLocaleString())}
                                  disabled
                                  className="bg-green-50 text-green-700 font-medium"
                                />
                              </div>
                              <button
                                onClick={() => removeDocumentItem(category.id, item.id)}
                                className="w-10 h-10 bg-[#A43E2F] hover:bg-[#992A1F] text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-lg"
                                title="حذف آیتم"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Inquiry Section */}
                          <div className="border-t border-[#a5b1a3]/20 pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={item.hasInquiry}
                                  onChange={(e) => updateDocumentItem(category.id, item.id, 'hasInquiry', e.target.checked)}
                                  className="w-4 h-4 text-[#687B69] border-gray-300 rounded focus:ring-[#687B69] accent-[#687B69]"
                                />
                                <label className="text-sm font-medium text-gray-700">گزینه استعلام</label>
                              </div>
                              {item.hasInquiry && (
                                <Button
                                  onClick={() => addInquiryPrice(category.id, item.id)}
                                  variant="primary"
                                  size="sm"
                                  className="px-3 py-1"
                                >
                                  + افزودن هزینه استعلام
                                </Button>
                              )}
                            </div>
                            
                            {item.hasInquiry && (
                              <div className="space-y-2">
                                {(item.inquiryPrices || []).map((price, index) => (
                                  <div key={index} className="flex items-end gap-2">
                                    <div className="flex-1">
                                      <Input
                                        label="عنوان استعلام"
                                        type="text"
                                        placeholder="عنوان استعلام را وارد کنید"
                                        value={price.title || ''}
                                        onChange={(e) => updateInquiryTitle(category.id, item.id, index, e.target.value)}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <Input
                                        label="مبلغ هزینه استعلام (ریال)"
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
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeInquiryPrice(category.id, item.id, index)}
                                      className="w-10 h-10 bg-[#A43E2F] hover:bg-[#992A1F] text-white rounded-lg flex items-center justify-center transition-colors"
                                      title="حذف هزینه استعلام"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="w-10 h-10 bg-[#C9DDC726] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="bg-gradient-to-r from-[#EDECE614] to-[#E4D8C714] rounded-xl p-6 border border-[#C0B8AC66]">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">افزودن جفت زبان جدید</h3>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">زبان مبدأ</label>
                      <Select
                        options={languageOptions}
                        value={languages.from}
                        onChange={(value) => setLanguages(prev => ({ ...prev, from: value }))}
                        placeholder="زبان مبدأ را انتخاب کنید"
                      />
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
                      <Select
                        options={languageOptions}
                        value={languages.to}
                        onChange={(value) => setLanguages(prev => ({ ...prev, to: value }))}
                        placeholder="زبان مقصد را انتخاب کنید"
                      />
                    </div>

                    <div className="flex-1">
                      <Button
                        onClick={addLanguagePair}
                        variant="primary"
                        size="sm"
                        className="w-full px-6 py-3 shadow-sm hover:shadow-md cursor-pointer"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        }
                      >
                        افزودن
                      </Button>
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
                    <span className="bg-[#C9DDC726] text-[#687B69] text-xs font-medium px-2 py-1 rounded-full">
                      {toPersianNumbers(languages.pairs.length)}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {getGroupedLanguagePairs().map((group) => (
                      <div key={group.id} className="relative group">
                        <div className="flex gap-3">
                          {/* Language pair cards */}
                          {group.pairs.map((pair, pairIndex) => {
                            const hasReversePair = languages.pairs.some(existingPair => 
                              existingPair.from === pair.to && existingPair.to === pair.from
                            );
                            
                            return (
                              <div key={pairIndex} className="flex-1 bg-white rounded-lg border border-gray-200 p-2 hover:border-[#A5B8A3] hover:shadow-sm transition-all duration-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#C9DDC726] rounded-lg flex items-center justify-center">
                                      <svg className="w-4 h-4 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-gray-800 font-medium text-sm">
                                        {getLanguageText(pair.from)} ← {getLanguageText(pair.to)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Reverse pair creation button - only show if reverse doesn't exist */}
                                  {!hasReversePair && (
                                    <button
                                      onClick={() => createReversePair(pair.from, pair.to)}
                                      className="w-6 h-6 bg-[#a5b1a3] hover:bg-[#6b7869] text-white rounded-full transition-all cursor-pointer flex items-center justify-center"
                                      title="ایجاد جفت معکوس"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 1024 1024">
                                        <path d="M293.376 645.290667A256.085333 256.085333 0 0 0 753.408 597.333333h89.173333a341.461333 341.461333 0 0 1-610.816 109.568L128 810.666667v-256h256l-90.624 90.624z m437.290667-266.624A256.170667 256.170667 0 0 0 270.506667 426.666667H181.333333a341.546667 341.546667 0 0 1 610.986667-109.653334L896 213.333333v256h-256l90.666667-90.666666z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Delete button for the entire group */}
                          <button
                            onClick={() => removeLanguageGroup(group.pairs)}
                            className="w-8 h-8 bg-[#A43E2F] hover:bg-[#992A1F] text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-lg self-center"
                            title="حذف تمام جفت زبان‌های این گروه"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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

          {/* Translators Section - Separate */}
          {activeTab === 'languages' && (
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-800">تعریف مترجم‌ها</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Translators */}
                <div className="bg-gradient-to-r from-[#EDECE614] to-[#E4D8C714] rounded-xl p-6 border border-[#C0B8AC66]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#C9DDC726] rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-md font-semibold text-gray-800">مترجم</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {translators.translators.map((translator) => (
                      <div key={translator.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={translator.name}
                            disabled
                            className="text-sm font-semibold text-gray-800 bg-gray-50"
                          />
                        </div>
                        <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          {translator.code}
                        </div>
                        <button
                          onClick={() => removeTranslator('translators', translator.id)}
                          className="w-8 h-8 bg-[#A43E2F] hover:bg-[#992A1F] text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-lg"
                          title="حذف مترجم"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="نام مترجم جدید"
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTranslator('translators', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = (e.target as HTMLButtonElement).parentElement?.querySelector('input') as HTMLInputElement;
                          if (input) {
                            addTranslator('translators', input.value);
                            input.value = '';
                          }
                        }}
                        variant="primary"
                        size="sm"
                        className="px-3 py-2"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        }
                      >
                        افزودن
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Assistants */}
                <div className="bg-gradient-to-r from-[#EDECE614] to-[#E4D8C714] rounded-xl p-6 border border-[#C0B8AC66]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#C9DDC726] rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-md font-semibold text-gray-800">مترجم یار</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {translators.assistants.map((assistant) => (
                      <div key={assistant.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={assistant.name}
                            disabled
                            className="text-sm font-semibold text-gray-800 bg-gray-50"
                          />
                        </div>
                        <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          {assistant.code}
                        </div>
                        <button
                          onClick={() => removeTranslator('assistants', assistant.id)}
                          className="w-8 h-8 bg-[#A43E2F] hover:bg-[#992A1F] text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-lg"
                          title="حذف مترجم یار"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="نام مترجم یار جدید"
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTranslator('assistants', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = (e.target as HTMLButtonElement).parentElement?.querySelector('input') as HTMLInputElement;
                          if (input) {
                            addTranslator('assistants', input.value);
                            input.value = '';
                          }
                        }}
                        variant="primary"
                        size="sm"
                        className="px-3 py-2"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        }
                      >
                        افزودن
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Editors */}
                <div className="bg-gradient-to-r from-[#EDECE614] to-[#E4D8C714] rounded-xl p-6 border border-[#C0B8AC66]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#C9DDC726] rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h4 className="text-md font-semibold text-gray-800">ویراستار</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {translators.editors.map((editor) => (
                      <div key={editor.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={editor.name}
                            disabled
                            className="text-sm font-semibold text-gray-800 bg-gray-50"
                          />
                        </div>
                        <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          {editor.code}
                        </div>
                        <button
                          onClick={() => removeTranslator('editors', editor.id)}
                          className="w-8 h-8 bg-[#A43E2F] hover:bg-[#992A1F] text-white rounded-lg transition-all cursor-pointer flex items-center justify-center shadow-lg"
                          title="حذف ویراستار"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="نام ویراستار جدید"
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTranslator('editors', (e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = (e.target as HTMLButtonElement).parentElement?.querySelector('input') as HTMLInputElement;
                          if (input) {
                            addTranslator('editors', input.value);
                            input.value = '';
                          }
                        }}
                        variant="primary"
                        size="sm"
                        className="px-3 py-2"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        }
                      >
                        افزودن
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Settings Tab */}
          {activeTab === 'invoice' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">تنظیمات فاکتور</h2>
              
              <div className="space-y-6">
                {/* Header Fields */}
                <div>
                  <h3 className="text-md font-medium text-gray-800 mb-4">اطلاعات هدر فاکتور</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* شماره دفتر */}
                    <Input
                      label="شماره دفتر"
                      type="text"
                      value={invoice.header.officeNumber}
                      onChange={(e) => setInvoice(prev => ({
                        ...prev,
                        header: { ...prev.header, officeNumber: e.target.value }
                      }))}
                      placeholder="شماره دفتر را وارد کنید"
                      required
                    />

                    {/* نام و نام خانوادگی مترجم */}
                    <Input
                      label="نام و نام خانوادگی مترجم"
                      type="text"
                      value={invoice.header.translatorName}
                      onChange={(e) => setInvoice(prev => ({
                        ...prev,
                        header: { ...prev.header, translatorName: e.target.value }
                      }))}
                      placeholder="نام مترجم را وارد کنید"
                    />

                    {/* نام دفتر */}
                    <Input
                      label="نام دفتر"
                      type="text"
                      value={invoice.header.officeName}
                      onChange={(e) => setInvoice(prev => ({
                        ...prev,
                        header: { ...prev.header, officeName: e.target.value }
                      }))}
                      placeholder="نام دفتر را وارد کنید"
                    />

                    {/* شهر */}
                    <Input
                      label="شهر"
                      type="text"
                      value={invoice.header.city}
                      onChange={(e) => setInvoice(prev => ({
                        ...prev,
                        header: { ...prev.header, city: e.target.value }
                      }))}
                      placeholder="شهر را وارد کنید"
                      required
                    />

                    {/* آدرس */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        آدرس <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={invoice.header.address}
                        onChange={(e) => setInvoice(prev => ({
                          ...prev,
                          header: { ...prev.header, address: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#687B69] focus:border-[#687B69] text-gray-900"
                        rows={2}
                        placeholder="آدرس کامل را وارد کنید"
                      />
                    </div>

                    {/* شماره تماس */}
                    <Input
                      label="شماره تماس"
                      type="text"
                      value={invoice.header.phone}
                      onChange={(e) => setInvoice(prev => ({
                        ...prev,
                        header: { ...prev.header, phone: e.target.value }
                      }))}
                      placeholder="شماره تماس را وارد کنید"
                      required
                    />

                    {/* واتس‌اپ */}
                    <Input
                      label="واتس‌اپ"
                      type="text"
                      value={invoice.header.whatsapp}
                      onChange={(e) => setInvoice(prev => ({
                        ...prev,
                        header: { ...prev.header, whatsapp: e.target.value }
                      }))}
                      placeholder="شماره واتس‌اپ را وارد کنید"
                    />

                    {/* تلگرام */}
                    <Input
                      label="تلگرام"
                      type="text"
                      value={invoice.header.telegram}
                      onChange={(e) => setInvoice(prev => ({
                        ...prev,
                        header: { ...prev.header, telegram: e.target.value }
                      }))}
                      placeholder="آیدی تلگرام را وارد کنید"
                    />

                    {/* ایتا */}
                    <Input
                      label="ایتا"
                      type="text"
                      value={invoice.header.eitaa}
                      onChange={(e) => setInvoice(prev => ({
                        ...prev,
                        header: { ...prev.header, eitaa: e.target.value }
                      }))}
                      placeholder="آیدی ایتا را وارد کنید"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات فاکتور</label>
                  <textarea
                    value={invoice.footer}
                    onChange={(e) => setInvoice(prev => ({ ...prev, footer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#687B69] focus:border-[#687B69] text-gray-900"
                    rows={3}
                    placeholder="متن توضیحات فاکتور را وارد کنید"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#687B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                فرم را کامل کنید و سپس ذخیره کنید
              </div>
            </div>
            <Button
              onClick={saveSettings}
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              className="px-8 py-3 shadow-lg cursor-pointer"
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
            </Button>
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