'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toPersianNumbers } from '../../utils/numbers';
import { settingsAPI, ServiceSettings, CategorySettings, SettingsData } from '../../lib/settings-api';
import Notification from '../Notification';

// Interfaces are now imported from settings-api

const Settings: React.FC = () => {
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
    { id: '1', name: 'هویتی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrice: 0, total: 0 },
    { id: '2', name: 'تحصیلی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrice: 0, total: 0 },
    { id: '3', name: 'مالی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrice: 0, total: 0 },
    { id: '4', name: 'پزشکی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrice: 0, total: 0 }
  ]);

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
        setCategories(settingsData.categories);
        
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
        
        // Categories
        settingsData.categories.forEach(category => {
          // Always set translation price display, even if 0
          newPriceDisplays[`category_${category.id}_translation`] = category.translationPrice > 0 
            ? formatPersianNumber(category.translationPrice.toString()) 
            : '';
          
          // Always set office service price display, even if 0
          newPriceDisplays[`category_${category.id}_office`] = category.officeServicePrice > 0 
            ? formatPersianNumber(category.officeServicePrice.toString()) 
            : '';
          
          // Always set inquiry price display, even if 0
          newPriceDisplays[`category_${category.id}_inquiry`] = category.inquiryPrice > 0 
            ? formatPersianNumber(category.inquiryPrice.toString()) 
            : '';
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

  const updateCategory = (id: string, field: keyof CategorySettings, value: string | number | boolean) => {
    setCategories(prev => prev.map(category => {
      if (category.id === id) {
        const updated = { ...category, [field]: value };
        
        // Calculate total
        if (field === 'translationPrice' || field === 'officeServicePrice' || field === 'hasInquiry' || field === 'inquiryPrice') {
          updated.total = updated.translationPrice + updated.officeServicePrice + (updated.hasInquiry ? updated.inquiryPrice : 0);
        }
        
        return updated;
      }
      return category;
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const settingsData: SettingsData = {
        services,
        categories
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


  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">تنظیمات قیمت‌ها</h1>
          
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
            <h2 className="text-lg font-semibold text-gray-800 mb-4">دسته‌بندی‌های دیگر</h2>
            
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام دسته‌بندی</label>
                    <input
                      type="text"
                      value={category.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">قیمت ترجمه (ریال)</label>
                    <input
                      type="text"
                      value={priceDisplays[`category_${category.id}_translation`] || ''}
                      onInput={(e) => {
                        const inputValue = (e.target as HTMLInputElement).value;
                        const formattedValue = formatPersianNumber(inputValue);
                        
                        setPriceDisplays(prev => ({
                          ...prev,
                          [`category_${category.id}_translation`]: formattedValue
                        }));
                        
                        handlePriceInput(formattedValue, (numericValue) => {
                          updateCategory(category.id, 'translationPrice', numericValue);
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
                      value={priceDisplays[`category_${category.id}_office`] || ''}
                      onInput={(e) => {
                        const inputValue = (e.target as HTMLInputElement).value;
                        const formattedValue = formatPersianNumber(inputValue);
                        
                        setPriceDisplays(prev => ({
                          ...prev,
                          [`category_${category.id}_office`]: formattedValue
                        }));
                        
                        handlePriceInput(formattedValue, (numericValue) => {
                          updateCategory(category.id, 'officeServicePrice', numericValue);
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-gray-900 text-right font-persian-numbers"
                      dir="ltr"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">گزینه استعلام</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={category.hasInquiry}
                        onChange={(e) => updateCategory(category.id, 'hasInquiry', e.target.checked)}
                        className="ml-2"
                      />
                      <span className="text-sm text-gray-800">دارد</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">هزینه استعلام (ریال)</label>
                    <input
                      type="text"
                      value={priceDisplays[`category_${category.id}_inquiry`] || ''}
                      onInput={(e) => {
                        const inputValue = (e.target as HTMLInputElement).value;
                        const formattedValue = formatPersianNumber(inputValue);
                        
                        setPriceDisplays(prev => ({
                          ...prev,
                          [`category_${category.id}_inquiry`]: formattedValue
                        }));
                        
                        handlePriceInput(formattedValue, (numericValue) => {
                          updateCategory(category.id, 'inquiryPrice', numericValue);
                        });
                      }}
                      disabled={!category.hasInquiry}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-left disabled:bg-gray-100 disabled:text-gray-700"
                      dir="ltr"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">جمع کل</label>
                    <input
                      type="text"
                      value={toPersianNumbers(category.total.toLocaleString())}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-medium text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

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