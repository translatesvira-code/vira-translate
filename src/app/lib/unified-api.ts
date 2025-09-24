// Unified API for managing orders and clients together

export interface UnifiedOrder {
  id: string;
  orderCode: string;
  clientCode: string;
  clientId: string;
  clientType: 'person' | 'company';
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  translationType: string;
  documentType: string;
  languageFrom: string;
  languageTo: string;
  numberOfPages: number;
  urgency: 'normal' | 'urgent' | 'very_urgent';
  specialInstructions: string;
  status: 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready';
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
  status: 'accepted' | 'translating' | 'editing' | 'ready' | 'delivered' | 'archived';
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
  orderCode: string;
  clientCode: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientType?: 'person' | 'company';
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
          clientPhone: orderData.clientPhone || '',
          clientEmail: orderData.clientEmail || '',
          clientAddress: orderData.clientAddress || '',
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
          clientPhone: String(order.client_phone || ''),
          clientEmail: String(order.client_email || ''),
          clientAddress: String(order.client_address || ''),
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
            status: ((order.client_data as Record<string, unknown>).status as 'accepted' | 'translating' | 'editing' | 'ready' | 'delivered' | 'archived') || 'accepted',
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

  // Delete unified order (deletes both order and optionally client)
  async deleteUnifiedOrder(orderId: string, deleteClient: boolean = false): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      
      // First get the order to find the client ID
      const orders = await this.getUnifiedOrders();
      const order = orders.orders.find(o => o.id === orderId);
      
      if (!order) {
        return false;
      }
      
      // Delete the order
      const orderDeleteResponse = await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/orders/${orderId}`, {
        method: 'DELETE',
        headers,
      });
      
      if (orderDeleteResponse.ok) {
        // If requested, also delete the client
        if (deleteClient && order.clientId) {
          await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/clients/${order.clientId}`, {
            method: 'DELETE',
            headers,
          });
        }
        
        return true;
      } else {
        return false;
      }

    } catch (error) {
      console.error('❌ Error deleting unified order:', error);
      return false;
    }
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
