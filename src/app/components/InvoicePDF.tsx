'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { toPersianNumbers } from '../utils/numbers';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    direction: 'rtl'
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #687B69',
    paddingBottom: 20
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#48453F',
    textAlign: 'center',
    marginBottom: 10
  },
  companyInfo: {
    fontSize: 12,
    color: '#656051',
    textAlign: 'center',
    lineHeight: 1.5
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2B593E',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30
  },
  clientInfo: {
    marginBottom: 30,
    backgroundColor: '#F7F2F2',
    padding: 20,
    borderRadius: 8
  },
  clientInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#48453F',
    marginBottom: 15
  },
  clientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  clientInfoLabel: {
    fontSize: 12,
    color: '#656051',
    fontWeight: 'bold'
  },
  clientInfoValue: {
    fontSize: 12,
    color: '#48453F'
  },
  ordersSection: {
    marginBottom: 30
  },
  ordersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#48453F',
    marginBottom: 15
  },
  orderItem: {
    backgroundColor: '#F7F2F2',
    padding: 15,
    marginBottom: 10,
    borderRadius: 6,
    border: '1 solid #C0B8AC66'
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  orderCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2B593E'
  },
  orderStatus: {
    fontSize: 12,
    color: '#687B69',
    backgroundColor: '#687B6926',
    padding: '4 8',
    borderRadius: 4
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  orderDetailLabel: {
    fontSize: 10,
    color: '#656051',
    fontWeight: 'bold'
  },
  orderDetailValue: {
    fontSize: 10,
    color: '#48453F'
  },
  totalSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#2B593E26',
    borderRadius: 8,
    border: '2 solid #2B593E66'
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2B593E',
    textAlign: 'center',
    marginBottom: 10
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2B593E',
    textAlign: 'center'
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #C0B8AC66',
    textAlign: 'center'
  },
  footerText: {
    fontSize: 10,
    color: '#656051',
    marginBottom: 5
  }
});

interface InvoicePDFProps {
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

const InvoicePDF: React.FC<InvoicePDFProps> = ({ client, orders }) => {
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
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>شرکت ویرا ترجمه</Text>
          <Text style={styles.companyInfo}>
            آدرس: تهران، خیابان ولیعصر، پلاک 123{'\n'}
            تلفن: 021-12345678 | ایمیل: info@viratranslate.ir
          </Text>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>فاکتور خدمات ترجمه</Text>

        {/* Client Information */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientInfoTitle}>اطلاعات مشتری</Text>
          
          <View style={styles.clientInfoRow}>
            <Text style={styles.clientInfoLabel}>کد مشتری:</Text>
            <Text style={styles.clientInfoValue}>{toPersianNumbers(client.code)}</Text>
          </View>
          
          <View style={styles.clientInfoRow}>
            <Text style={styles.clientInfoLabel}>نام:</Text>
            <Text style={styles.clientInfoValue}>
              {client.company || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name}
            </Text>
          </View>
          
          {client.phone && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoLabel}>تلفن:</Text>
              <Text style={styles.clientInfoValue}>{toPersianNumbers(client.phone)}</Text>
            </View>
          )}
          
          {client.email && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoLabel}>ایمیل:</Text>
              <Text style={styles.clientInfoValue}>{client.email}</Text>
            </View>
          )}
          
          {client.address && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoLabel}>آدرس:</Text>
              <Text style={styles.clientInfoValue}>{client.address}</Text>
            </View>
          )}
        </View>

        {/* Orders Section */}
        <View style={styles.ordersSection}>
          <Text style={styles.ordersTitle}>خدمات درخواستی</Text>
          
          {orders.map((order, index) => (
            <View key={order.id} style={styles.orderItem}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderCode}>
                  سفارش {toPersianNumbers((index + 1).toString())} - کد: {toPersianNumbers(order.orderCode || order.id)}
                </Text>
                <Text style={styles.orderStatus}>{getStatusText(order.status)}</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>نوع ترجمه:</Text>
                <Text style={styles.orderDetailValue}>{getTranslationTypeText(order.translationType)}</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>زبان:</Text>
                <Text style={styles.orderDetailValue}>
                  {getLanguageText(order.languageFrom)} → {getLanguageText(order.languageTo)}
                </Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>تعداد صفحات:</Text>
                <Text style={styles.orderDetailValue}>{toPersianNumbers(order.numberOfPages?.toString() || '0')}</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>مبلغ:</Text>
                <Text style={styles.orderDetailValue}>
                  {toPersianNumbers((order.totalPrice || 0).toLocaleString())} ریال
                </Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>تاریخ سفارش:</Text>
                <Text style={styles.orderDetailValue}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                </Text>
              </View>
              
              {order.specialInstructions && (
                <View style={styles.orderDetails}>
                  <Text style={styles.orderDetailLabel}>توضیحات:</Text>
                  <Text style={styles.orderDetailValue}>{order.specialInstructions}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <Text style={styles.totalTitle}>مجموع کل</Text>
          <Text style={styles.totalAmount}>
            {toPersianNumbers(totalAmount.toLocaleString())} ریال
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>تاریخ صدور فاکتور: {currentDate}</Text>
          <Text style={styles.footerText}>با تشکر از اعتماد شما</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
