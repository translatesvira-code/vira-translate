'use client';

import React, { useState, useEffect } from 'react';
import { Client } from '../../lib/clients-api';
import Input from './Input';
import Button from './Button';
import Select from './Select';

interface QuickEditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onSave: (updatedClient: Partial<Client>) => Promise<void>;
}

const QuickEditSidebar: React.FC<QuickEditSidebarProps> = ({
  isOpen,
  onClose,
  client,
  onSave
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    status: 'acceptance' as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Update form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        company: client.company || '',
        status: client.status || 'acceptance'
      });
    }
  }, [client]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleSave = async () => {
    if (!client) return;
    
    setIsSaving(true);
    try {
      await onSave({
        id: client.id,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        status: formData.status
      });
      handleClose();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions = [
    { value: 'acceptance', label: 'پذیرش' },
    { value: 'completion', label: 'تکمیل اطلاعات' },
    { value: 'translating', label: 'ترجمه' },
    { value: 'editing', label: 'ویرایش' },
    { value: 'office', label: 'امور دفتری' },
    { value: 'ready', label: 'آماده تحویل' },
    { value: 'archived', label: 'بایگانی' }
  ];

  if (!client) return null;

  return (
    <>
      {/* Backdrop with blur */}
      {isOpen && (
        <div 
          className={`fixed inset-0 z-40 transition-all duration-300 ${
            !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ 
            backdropFilter: !isClosing ? 'blur(4px)' : 'blur(0px)', 
            backgroundColor: !isClosing ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0)',
            transition: 'backdrop-filter 0.3s ease-in-out, background-color 0.3s ease-in-out, opacity 0.3s ease-in-out'
          }}
          onClick={handleClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col"
        style={{
          transform: isOpen && !isClosing ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: isOpen && !isClosing ? 'slideInRight 0.1s ease-out forwards' : isClosing ? 'slideOutRight 0.1s ease-in forwards' : 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">ویرایش سریع</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Form Fields */}
          <div className="flex-1 p-6 space-y-4">
            {/* Status First */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وضعیت کاربر
              </label>
              <Select
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived' }))}
                options={statusOptions}
                placeholder="وضعیت را انتخاب کنید"
              />
            </div>

            <Input
              label="نام"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="نام را وارد کنید"
            />

            <Input
              label="نام خانوادگی"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="نام خانوادگی را وارد کنید"
            />

            <Input
              label="نام شرکت"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="نام شرکت را وارد کنید"
            />
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 transition-all duration-200 hover:scale-105"
                variant="primary"
              >
                {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
              <Button
                onClick={handleClose}
                variant="secondary"
                className="flex-1 transition-all duration-200 hover:scale-105"
              >
                انصراف
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickEditSidebar;
