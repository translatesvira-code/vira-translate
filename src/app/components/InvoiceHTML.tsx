'use client';

import React from 'react';
import { toPersianNumbers } from '../utils/numbers';

interface InvoiceHTMLProps {
  client: {
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
  };
  orders: Array<{
    id: string;
    orderCode: string;
    translationType: string;
    languageFrom: string;
    languageTo: string;
    numberOfPages: number;
    totalPrice: number;
    status: string;
    createdAt: string;
    specialInstructions?: string;
  }>;
}

const InvoiceHTML: React.FC<InvoiceHTMLProps> = ({ client, orders }) => {
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

  const totalAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const currentDate = new Date().toLocaleDateString('fa-IR');

  return (
    <div 
      id="invoice-content" 
      className="bg-white p-8 max-w-4xl mx-auto"
      style={{ 
        fontFamily: 'Samim, Arial, sans-serif',
        direction: 'rtl',
        lineHeight: '1.6'
      }}
    >
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-[#687B69]">
        <h1 className="text-3xl font-bold text-[#48453F] mb-2">شرکت ویرا ترجمه</h1>
        <p className="text-[#656051] text-sm">
          آدرس: تهران، خیابان ولیعصر، پلاک ۱۲۳<br />
          تلفن: ۰۲۱-۱۲۳۴۵۶۷۸ | ایمیل: info@viratranslate.ir
        </p>
      </div>

      {/* Invoice Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#2B593E]">فاکتور خدمات ترجمه</h2>
        <p className="text-[#656051] mt-2">تاریخ صدور: {currentDate}</p>
      </div>

      {/* Client Information */}
      <div className="bg-[#F7F2F2] rounded-lg p-6 mb-8 border border-[#C0B8AC66]">
        <h3 className="text-lg font-bold text-[#48453F] mb-4">اطلاعات مشتری</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-[#656051] font-medium">کد مشتری:</span>
            <span className="text-[#48453F]">{toPersianNumbers(client.code)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#656051] font-medium">نام:</span>
            <span className="text-[#48453F]">
              {client.company || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name}
            </span>
          </div>
          {client.phone && (
            <div className="flex justify-between">
              <span className="text-[#656051] font-medium">تلفن:</span>
              <span className="text-[#48453F]">{toPersianNumbers(client.phone)}</span>
            </div>
          )}
          {client.email && (
            <div className="flex justify-between">
              <span className="text-[#656051] font-medium">ایمیل:</span>
              <span className="text-[#48453F]">{client.email}</span>
            </div>
          )}
          {client.address && (
            <div className="flex justify-between col-span-full">
              <span className="text-[#656051] font-medium">آدرس:</span>
              <span className="text-[#48453F]">{client.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Orders Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-[#48453F] mb-4">خدمات درخواستی</h3>
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div key={order.id} className="bg-[#F7F2F2] rounded-lg p-4 border border-[#C0B8AC66]">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold text-[#2B593E]">
                  سفارش {toPersianNumbers((index + 1).toString())} - کد: {toPersianNumbers(order.orderCode || order.id)}
                </h4>
                <span className="bg-[#687B6926] text-[#687B69] px-3 py-1 rounded-full text-sm font-medium">
                  {getStatusText(order.status)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#656051] font-medium">نوع ترجمه:</span>
                  <span className="text-[#48453F]">{getTranslationTypeText(order.translationType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#656051] font-medium">زبان:</span>
                  <span className="text-[#48453F]">
                    {getLanguageText(order.languageFrom)} → {getLanguageText(order.languageTo)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#656051] font-medium">تعداد صفحات:</span>
                  <span className="text-[#48453F]">{toPersianNumbers(order.numberOfPages?.toString() || '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#656051] font-medium">مبلغ:</span>
                  <span className="text-[#2B593E] font-bold">
                    {toPersianNumbers((order.totalPrice || 0).toLocaleString())} ریال
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#656051] font-medium">تاریخ سفارش:</span>
                  <span className="text-[#48453F]">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                  </span>
                </div>
                {order.specialInstructions && (
                  <div className="flex justify-between col-span-full">
                    <span className="text-[#656051] font-medium">توضیحات:</span>
                    <span className="text-[#48453F]">{order.specialInstructions}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Section */}
      <div className="bg-[#2B593E26] rounded-lg p-6 border-2 border-[#2B593E66] mb-8">
        <div className="text-center">
          <h3 className="text-xl font-bold text-[#2B593E] mb-2">مجموع کل</h3>
          <div className="text-3xl font-bold text-[#2B593E]">
            {toPersianNumbers(totalAmount.toLocaleString())} ریال
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-6 border-t border-[#C0B8AC66]">
        <p className="text-[#656051] text-sm mb-2">با تشکر از اعتماد شما</p>
        <p className="text-[#656051] text-xs">شرکت ویرا ترجمه - ارائه خدمات ترجمه تخصصی</p>
      </div>
    </div>
  );
};

export default InvoiceHTML;
