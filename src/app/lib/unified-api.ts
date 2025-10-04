// Unified API for managing orders and clients together

export interface UnifiedOrder {
  id: string;
  orderCode: string;
  clientCode: string;
  clientId: string;
  clientType: 'person' | 'company';
  clientName: string;
  clientFirstName: string;
  clientLastName: string;
  clientCompany: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientNationalId: string;
  serviceType: string;
  translationType: string;
  documentType: string;
  languageFrom: string;
  languageTo: string;
  numberOfPages: number;
  urgency: 'normal' | 'urgent' | 'very_urgent';
  specialInstructions: string;
  status: 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready' | 'archived';
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  history: OrderHistory[];
  clientData?: ClientData;
}

export interface ClientData {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  address: string;
  type: 'person' | 'company';
  status: 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  status: string;
  changedBy: string;
  changedAt: string;
  notes: string;
}

export interface CreateUnifiedOrderData {
  clientCode: string;
  clientName: string;
  clientFirstName: string;
  clientLastName: string;
  clientCompany: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientNationalId?: string;
  clientType?: 'person' | 'company';
  serviceType?: string;
  status?: 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived';
  translationType: string;
  documentType: string;
  languageFrom: string;
  languageTo: string;
  numberOfPages: number;
  urgency?: 'normal' | 'urgent' | 'very_urgent';
  specialInstructions?: string;
  totalPrice?: number;
}

class UnifiedAPI {
  private baseUrl = 'https://admin.viratranslate.ir/wp-json/custom/v1';

  private async getAuthHeaders() {
    // Try localStorage first
    let userData = localStorage.getItem('user_data');
    
    // If not found in localStorage, try cookies
    if (!userData) {
      const cookies = document.cookie.split(';');
      const userCookie = cookies.find(cookie => cookie.trim().startsWith('user_data='));
      if (userCookie) {
        userData = decodeURIComponent(userCookie.split('=')[1]);
      }
    }
    
    if (!userData) {
      throw new Error('User not authenticated');
    }
    
    const user = JSON.parse(userData);
    if (!user.token) {
      throw new Error('No authentication token found');
    }

    return {
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json',
    };
  }

  // Create unified order (creates both client and order)
  async createUnifiedOrder(orderData: CreateUnifiedOrderData): Promise<UnifiedOrder> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Send as JSON for WordPress REST API compatibility
      const jsonData = JSON.stringify(orderData);
      
      const response = await fetch(`${this.baseUrl}/unified-orders`, {
        method: 'POST',
        headers: {
          'Authorization': headers.Authorization,
          'Content-Type': 'application/json',
        },
        body: jsonData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Return the created order data
        return {
          id: result.order_id.toString(),
          orderCode: result.order_code,
          clientCode: result.client_code,
          clientId: result.client_id.toString(),
          clientType: orderData.clientType || 'person',
          clientName: orderData.clientName,
          clientFirstName: orderData.clientFirstName,
          clientLastName: orderData.clientLastName,
          clientCompany: orderData.clientCompany,
          clientPhone: orderData.clientPhone || '',
          clientEmail: orderData.clientEmail || '',
          clientAddress: orderData.clientAddress || '',
          clientNationalId: orderData.clientNationalId || '',
          serviceType: orderData.serviceType || 'ترجمه',
          translationType: orderData.translationType,
          documentType: orderData.documentType,
          languageFrom: orderData.languageFrom,
          languageTo: orderData.languageTo,
          numberOfPages: orderData.numberOfPages,
          urgency: orderData.urgency || 'normal',
          specialInstructions: orderData.specialInstructions || '',
          status: 'acceptance',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalPrice: orderData.totalPrice || 0,
          history: [{
            id: '1',
            orderId: result.order_id.toString(),
            status: 'acceptance',
            changedBy: 'system',
            changedAt: new Date().toISOString(),
            notes: 'سفارش ایجاد شد'
          }]
        };
      } else {
        const errorText = await response.text();
        
        // Try to parse error as JSON for better error messages
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            throw new Error(`Failed to create unified order: ${errorData.message}`);
          }
        } catch {
          // If not JSON, use the raw error text
        }
        
        throw new Error(`Failed to create unified order: ${errorText}`);
      }

    } catch (error) {
      console.error('Error creating unified order:', error);
      throw error;
    }
  }

  // Get all unified orders with complete client data
  async getUnifiedOrders(params?: {
    status?: string;
    clientId?: string;
    perPage?: number;
    page?: number;
  }): Promise<{ orders: UnifiedOrder[]; total: number; pages: number; currentPage: number; perPage: number }> {
    try {
      const headers = await this.getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.clientId) queryParams.append('client_id', params.clientId);
      if (params?.perPage) queryParams.append('per_page', params.perPage.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      
      const url = `${this.baseUrl}/unified-orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Transform the response to match our interface
        const orders: UnifiedOrder[] = result.orders.map((order: Record<string, unknown>) => ({
          id: String(order.id || ''),
          orderCode: String(order.order_code || ''),
          clientCode: String(order.client_code || ''),
          clientId: String(order.client_id || ''),
          clientType: (order.client_type as 'person' | 'company') || 'person',
          clientName: String(order.client_name || ''),
          clientFirstName: String(order.client_first_name || ''),
          clientLastName: String(order.client_last_name || ''),
          clientCompany: String(order.client_company || ''),
          clientPhone: String(order.client_phone || ''),
          clientEmail: String(order.client_email || ''),
          clientAddress: String(order.client_address || ''),
          clientNationalId: String(order.client_national_id || ''),
          serviceType: String(order.service_type || 'ترجمه'),
          translationType: String(order.translation_type || ''),
          documentType: String(order.document_type || ''),
          languageFrom: String(order.language_from || ''),
          languageTo: String(order.language_to || ''),
          numberOfPages: parseInt(String(order.number_of_pages || '0')) || 0,
          urgency: (order.urgency as 'normal' | 'urgent' | 'very_urgent') || 'normal',
          specialInstructions: String(order.special_instructions || ''),
          status: (order.order_status as 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready') || 'acceptance',
          createdAt: String(order.created_at || ''),
          updatedAt: String(order.updated_at || ''),
          totalPrice: parseFloat(String(order.total_price || '0')) || 0,
          history: this.parseHistory(String(order.order_history || '')),
          clientData: order.client_data ? {
            id: String((order.client_data as Record<string, unknown>).id || ''),
            name: String((order.client_data as Record<string, unknown>).name || ''),
            code: String((order.client_data as Record<string, unknown>).code || ''),
            phone: String((order.client_data as Record<string, unknown>).phone || ''),
            email: String((order.client_data as Record<string, unknown>).email || ''),
            address: String((order.client_data as Record<string, unknown>).address || ''),
            type: ((order.client_data as Record<string, unknown>).type as 'person' | 'company') || 'person',
            status: ((order.client_data as Record<string, unknown>).status as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived') || 'acceptance',
            createdAt: String((order.client_data as Record<string, unknown>).created_at || ''),
            updatedAt: String((order.client_data as Record<string, unknown>).updated_at || '')
          } : undefined
        }));
        
        return {
          orders,
          total: result.total,
          pages: result.pages,
          currentPage: result.current_page,
          perPage: result.per_page
        };
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to get unified orders: ${errorText}`);
      }

    } catch (error) {
      console.error('Error fetching unified orders:', error);
      throw error;
    }
  }

  // Get single unified order by ID
  async getUnifiedOrder(orderId: string): Promise<UnifiedOrder | null> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/unified-orders/${orderId}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        return this.mapOrderToUnifiedOrder(result);
      } else {
        const errorText = await response.text();
        console.error('Failed to get unified order:', errorText);
        return null;
      }

    } catch (error) {
      console.error('Error getting unified order:', error);
      return null;
    }
  }

  // Update unified order
  async updateUnifiedOrder(orderId: string, orderData: Partial<UnifiedOrder>): Promise<UnifiedOrder | null> {
    try {
      const headers = await this.getAuthHeaders();
      
      const updateData = {
        order_code: orderData.orderCode,
        client_code: orderData.clientCode,
        client_id: orderData.clientId,
        client_type: orderData.clientType,
        client_name: orderData.clientName,
        client_first_name: orderData.clientFirstName,
        client_last_name: orderData.clientLastName,
        client_company: orderData.clientCompany,
        client_phone: orderData.clientPhone,
        client_email: orderData.clientEmail,
        client_address: orderData.clientAddress,
        client_national_id: orderData.clientNationalId,
        translation_type: orderData.translationType,
        document_type: orderData.documentType,
        language_from: orderData.languageFrom,
        language_to: orderData.languageTo,
        number_of_pages: orderData.numberOfPages,
        urgency: orderData.urgency,
        special_instructions: orderData.specialInstructions,
        order_status: orderData.status,
        total_price: orderData.totalPrice,
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${this.baseUrl}/unified-orders/${orderId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const result = await response.json();
        return this.mapOrderToUnifiedOrder(result);
      } else {
        const errorText = await response.text();
        console.error('Failed to update unified order:', errorText);
        return null;
      }

    } catch (error) {
      console.error('Error updating unified order:', error);
      return null;
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string, changedBy: string = 'user', notes: string = ''): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          status,
          changed_by: changedBy,
          notes
        }),
      });
      
      if (response.ok) {
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to update order status:', errorText);
        return false;
      }

    } catch (error) {
      console.error('❌ Error updating order status:', error);
      return false;
    }
  }

  // Delete unified order (deletes both order and optionally client)
  async deleteUnifiedOrder(orderId: string, deleteClient: boolean = false): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Use custom endpoint for deletion
      const response = await fetch(`${this.baseUrl}/unified-orders/${orderId}?delete_client=${deleteClient}`, {
        method: 'DELETE',
        headers,
      });
      
      if (response.ok) {
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to delete unified order:', errorText);
        return false;
      }

    } catch (error) {
      console.error('❌ Error deleting unified order:', error);
      return false;
    }
  }


  // Map order data to UnifiedOrder interface
  private mapOrderToUnifiedOrder(order: Record<string, unknown>): UnifiedOrder {
    return {
      id: String(order.id || ''),
      orderCode: String(order.order_code || ''),
      clientCode: String(order.client_code || ''),
      clientId: String(order.client_id || ''),
      clientType: (order.client_type as 'person' | 'company') || 'person',
      clientName: String(order.client_name || ''),
      clientFirstName: String(order.client_first_name || ''),
      clientLastName: String(order.client_last_name || ''),
      clientCompany: String(order.client_company || ''),
      clientPhone: String(order.client_phone || ''),
      clientEmail: String(order.client_email || ''),
      clientAddress: String(order.client_address || ''),
      clientNationalId: String(order.client_national_id || ''),
      serviceType: String(order.service_type || 'ترجمه'),
      translationType: String(order.translation_type || ''),
      documentType: String(order.document_type || ''),
      languageFrom: String(order.language_from || ''),
      languageTo: String(order.language_to || ''),
      numberOfPages: parseInt(String(order.number_of_pages || '0')) || 0,
      urgency: (order.urgency as 'normal' | 'urgent' | 'very_urgent') || 'normal',
      specialInstructions: String(order.special_instructions || ''),
      status: (order.order_status as 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready') || 'acceptance',
      createdAt: String(order.created_at || ''),
      updatedAt: String(order.updated_at || ''),
      totalPrice: parseFloat(String(order.total_price || '0')) || 0,
      history: this.parseHistory(String(order.order_history || '')),
      clientData: order.client_data ? {
        id: String((order.client_data as Record<string, unknown>).id || ''),
        name: String((order.client_data as Record<string, unknown>).name || ''),
        code: String((order.client_data as Record<string, unknown>).code || ''),
        phone: String((order.client_data as Record<string, unknown>).phone || ''),
        email: String((order.client_data as Record<string, unknown>).email || ''),
        address: String((order.client_data as Record<string, unknown>).address || ''),
        type: ((order.client_data as Record<string, unknown>).type as 'person' | 'company') || 'person',
        status: ((order.client_data as Record<string, unknown>).status as 'acceptance' | 'completion' | 'translating' | 'editing' | 'office' | 'ready' | 'archived') || 'acceptance',
        createdAt: String((order.client_data as Record<string, unknown>).created_at || ''),
        updatedAt: String((order.client_data as Record<string, unknown>).updated_at || '')
      } : undefined
    };
  }

  // Parse order history from JSON string
  private parseHistory(historyJson: string): OrderHistory[] {
    try {
      if (!historyJson) return [];
      return JSON.parse(historyJson);
    } catch (error) {
      console.error('Error parsing order history:', error);
      return [];
    }
  }
}

export const unifiedAPI = new UnifiedAPI();
