'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create simple styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000000',
    paddingBottom: 20
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10
  },
  companyInfo: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 1.5
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30
  },
  clientInfo: {
    marginBottom: 30,
    backgroundColor: '#F5F5F5',
    padding: 20
  },
  clientInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15
  },
  clientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  clientInfoLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: 'bold'
  },
  clientInfoValue: {
    fontSize: 12,
    color: '#000000'
  },
  ordersSection: {
    marginBottom: 30
  },
  ordersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 15
  },
  orderItem: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    marginBottom: 10,
    border: '1 solid #CCCCCC'
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  orderCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000'
  },
  orderStatus: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#E0E0E0',
    padding: '4 8'
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  orderDetailLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: 'bold'
  },
  orderDetailValue: {
    fontSize: 10,
    color: '#000000'
  },
  totalSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#E8F5E8',
    border: '2 solid #4CAF50'
  },
  totalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center'
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #CCCCCC',
    textAlign: 'center'
  },
  footerText: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 5
  }
});

interface SimpleInvoicePDFProps {
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

const SimpleInvoicePDF: React.FC<SimpleInvoicePDFProps> = ({ client, orders }) => {
  const getTranslationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'certified': 'Certified Translation',
      'simple': 'Simple Translation',
      'sworn': 'Sworn Translation',
      'notarized': 'Notarized Translation'
    };
    return typeMap[type] || type;
  };

  const getLanguageText = (lang: string) => {
    const languages: Record<string, string> = {
      'persian': 'Persian',
      'english': 'English',
      'arabic': 'Arabic',
      'french': 'French',
      'german': 'German',
      'other': 'Other'
    };
    return languages[lang] || lang;
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'acceptance': 'Acceptance',
      'completion': 'Completion',
      'translation': 'Translation',
      'translating': 'Translation',
      'editing': 'Editing',
      'office': 'Office',
      'ready': 'Ready',
      'archived': 'Archived'
    };
    return statusMap[status] || status;
  };

  const totalAmount = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const currentDate = new Date().toLocaleDateString('en-US');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Vira Translate Company</Text>
          <Text style={styles.companyInfo}>
            Address: Tehran, Valiasr St, No. 123{'\n'}
            Phone: 021-12345678 | Email: info@viratranslate.ir
          </Text>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>Translation Services Invoice</Text>

        {/* Client Information */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientInfoTitle}>Client Information</Text>
          
          <View style={styles.clientInfoRow}>
            <Text style={styles.clientInfoLabel}>Client Code:</Text>
            <Text style={styles.clientInfoValue}>{client.code}</Text>
          </View>
          
          <View style={styles.clientInfoRow}>
            <Text style={styles.clientInfoLabel}>Name:</Text>
            <Text style={styles.clientInfoValue}>
              {client.company || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.name}
            </Text>
          </View>
          
          {client.phone && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoLabel}>Phone:</Text>
              <Text style={styles.clientInfoValue}>{client.phone}</Text>
            </View>
          )}
          
          {client.email && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoLabel}>Email:</Text>
              <Text style={styles.clientInfoValue}>{client.email}</Text>
            </View>
          )}
          
          {client.address && (
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoLabel}>Address:</Text>
              <Text style={styles.clientInfoValue}>{client.address}</Text>
            </View>
          )}
        </View>

        {/* Orders Section */}
        <View style={styles.ordersSection}>
          <Text style={styles.ordersTitle}>Requested Services</Text>
          
          {orders.map((order, index) => (
            <View key={order.id} style={styles.orderItem}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderCode}>
                  Order {index + 1} - Code: {order.orderCode || order.id}
                </Text>
                <Text style={styles.orderStatus}>{getStatusText(order.status)}</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>Translation Type:</Text>
                <Text style={styles.orderDetailValue}>{getTranslationTypeText(order.translationType)}</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>Language:</Text>
                <Text style={styles.orderDetailValue}>
                  {getLanguageText(order.languageFrom)} → {getLanguageText(order.languageTo)}
                </Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>Number of Pages:</Text>
                <Text style={styles.orderDetailValue}>{order.numberOfPages?.toString() || '0'}</Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>Amount:</Text>
                <Text style={styles.orderDetailValue}>
                  {(order.totalPrice || 0).toLocaleString()} Rial
                </Text>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderDetailLabel}>Order Date:</Text>
                <Text style={styles.orderDetailValue}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US') : 'Unknown'}
                </Text>
              </View>
              
              {order.specialInstructions && (
                <View style={styles.orderDetails}>
                  <Text style={styles.orderDetailLabel}>Instructions:</Text>
                  <Text style={styles.orderDetailValue}>{order.specialInstructions}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <Text style={styles.totalTitle}>Total Amount</Text>
          <Text style={styles.totalAmount}>
            {totalAmount.toLocaleString()} Rial
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Invoice Date: {currentDate}</Text>
          <Text style={styles.footerText}>Thank you for your trust</Text>
        </View>
      </Page>
    </Document>
  );
};

export default SimpleInvoicePDF;
