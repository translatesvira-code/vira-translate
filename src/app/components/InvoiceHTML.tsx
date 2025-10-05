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
  invoiceSettings?: {
    header: {
      officeNumber: string;
      translatorName: string;
      officeName: string;
      city: string;
      address: string;
      phone: string;
      whatsapp: string;
      telegram: string;
      eitaa: string;
    };
    footer: string;
  };
}

const InvoiceHTML: React.FC<InvoiceHTMLProps> = ({ client, orders, invoiceSettings }) => {
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
      style={{ 
        fontFamily: 'Samim, Arial, sans-serif',
        direction: 'rtl',
        lineHeight: '1.4',
        width: '210mm',
        height: '148mm',
        fontSize: '11px',
        backgroundColor: 'white',
        padding: '15px',
        margin: '0 auto'
      }}
    >
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '12px', 
        paddingBottom: '8px', 
        borderBottom: '1px solid #2D5A27'
      }}>
        <h1 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#2D5A27', 
          marginBottom: '6px'
        }}>
          {invoiceSettings?.header.officeName || 'شرکت ویرا ترجمه'}
        </h1>
        <div style={{ 
          color: '#495057', 
          fontSize: '10px', 
          lineHeight: '1.5'
        }}>
          {invoiceSettings?.header.translatorName && (
            <span>نام مترجم: {invoiceSettings.header.translatorName} | </span>
          )}
          {invoiceSettings?.header.officeNumber && (
            <span>شماره دفتر: {toPersianNumbers(invoiceSettings.header.officeNumber)} | </span>
          )}
          {invoiceSettings?.header.city && (
            <span>شهر: {invoiceSettings.header.city} | </span>
          )}
          {invoiceSettings?.header.address && (
            <span>آدرس: {invoiceSettings.header.address} | </span>
          )}
          {invoiceSettings?.header.phone && (
            <span>تلفن: {toPersianNumbers(invoiceSettings.header.phone)} | </span>
          )}
          {invoiceSettings?.header.whatsapp && (
            <span>واتس‌اپ: {toPersianNumbers(invoiceSettings.header.whatsapp)} | </span>
          )}
          {invoiceSettings?.header.telegram && (
            <span>تلگرام: {invoiceSettings.header.telegram} | </span>
          )}
          {invoiceSettings?.header.eitaa && (
            <span>ایتا: {invoiceSettings.header.eitaa}</span>
          )}
          {!invoiceSettings && (
            <span>آدرس: تهران، خیابان ولیعصر، پلاک ۱۲۳ | تلفن: ۰۲۱-۱۲۳۴۵۶۷۸ | ایمیل: info@viratranslate.ir</span>
          )}
        </div>
      </div>

      {/* Invoice Title */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: '#2D5A27',
        borderRadius: '4px',
        color: 'white'
      }}>
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '2px'
        }}>فاکتور خدمات ترجمه</h2>
        <p style={{ 
          fontSize: '11px', 
          opacity: '0.9',
          margin: '0'
        }}>تاریخ صدور: {currentDate}</p>
      </div>

      {/* Client Information */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px', 
        padding: '8px', 
        marginBottom: '10px', 
        border: '1px solid #2D5A27'
      }}>
        <h3 style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#2D5A27', 
          marginBottom: '6px',
          textAlign: 'center'
        }}>اطلاعات مشتری</h3>
        <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057', width: '50%' }}>کد مشتری:</td>
              <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27', width: '50%' }}>{toPersianNumbers(client.code)}</td>
              <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057', width: '50%' }}>نام:</td>
              <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27', width: '50%' }}>
                {client.company || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name}
              </td>
            </tr>
            {client.phone && (
              <tr>
                <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057' }}>تلفن:</td>
                <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27' }}>{toPersianNumbers(client.phone)}</td>
                {client.email ? (
                  <>
                    <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057' }}>ایمیل:</td>
                    <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27' }}>{client.email}</td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef' }}></td>
                    <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef' }}></td>
                  </>
                )}
              </tr>
            )}
            {client.address && (
              <tr>
                <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057' }}>آدرس:</td>
                <td style={{ padding: '4px 6px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27' }} colSpan={3}>{client.address}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Orders Section */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#2D5A27', 
          marginBottom: '6px',
          textAlign: 'center'
        }}>خدمات درخواستی</h3>
        <div>
          {orders.map((order, index) => (
            <div key={order.id} style={{ 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px', 
              padding: '8px', 
              border: '1px solid #2D5A27', 
              marginBottom: '6px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '6px',
                paddingBottom: '4px',
                borderBottom: '1px solid #2D5A27'
              }}>
                <h4 style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  color: '#2D5A27'
                }}>
                  سفارش {toPersianNumbers((index + 1).toString())} - کد: {toPersianNumbers(order.orderCode || order.id)}
                </h4>
                <span style={{ 
                  backgroundColor: '#2D5A27', 
                  color: 'white', 
                  padding: '2px 6px', 
                  borderRadius: '10px', 
                  fontSize: '9px', 
                  fontWeight: '600'
                }}>
                  {getStatusText(order.status)}
                </span>
              </div>
              
              <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057', width: '25%' }}>نوع ترجمه:</td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27', width: '25%' }}>{getTranslationTypeText(order.translationType)}</td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057', width: '25%' }}>زبان:</td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27', width: '25%' }}>
                      {getLanguageText(order.languageFrom)} → {getLanguageText(order.languageTo)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057' }}>تعداد صفحات:</td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27' }}>{toPersianNumbers(order.numberOfPages?.toString() || '0')}</td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057' }}>مبلغ:</td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27' }}>
                      {toPersianNumbers((order.totalPrice || 0).toLocaleString())} ریال
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057' }}>تاریخ سفارش:</td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                    </td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef' }}></td>
                    <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef' }}></td>
                  </tr>
                  {order.specialInstructions && (
                    <tr>
                      <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: '600', color: '#495057' }}>توضیحات:</td>
                      <td style={{ padding: '3px 5px', backgroundColor: 'white', border: '1px solid #e9ecef', fontWeight: 'bold', color: '#2D5A27' }} colSpan={3}>{order.specialInstructions}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* Total Section */}
      <div style={{ 
        backgroundColor: '#2D5A27', 
        borderRadius: '6px', 
        padding: '10px', 
        border: '2px solid #1a3d1a', 
        marginBottom: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '4px'
          }}>مجموع کل</h3>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {toPersianNumbers(totalAmount.toLocaleString())} ریال
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        paddingTop: '8px', 
        borderTop: '1px solid #2D5A27',
        backgroundColor: '#f8f9fa',
        borderRadius: '0 0 4px 4px',
        padding: '8px'
      }}>
        <p style={{ 
          color: '#2D5A27', 
          fontSize: '11px', 
          marginBottom: '4px',
          fontWeight: '600'
        }}>با تشکر از اعتماد شما</p>
        {invoiceSettings?.footer ? (
          <p style={{ 
            color: '#495057', 
            fontSize: '10px',
            fontStyle: 'italic'
          }}>{invoiceSettings.footer}</p>
        ) : (
          <p style={{ 
            color: '#495057', 
            fontSize: '10px',
            fontStyle: 'italic'
          }}>شرکت ویرا ترجمه - ارائه خدمات ترجمه تخصصی</p>
        )}
      </div>
    </div>
  );
};

export default InvoiceHTML;
