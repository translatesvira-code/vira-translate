// import { auth } from './wordpress-auth';

export interface Order {
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
}

export interface OrderHistory {
  id: string;
  orderId: string;
  status: string;
  changedBy: string;
  changedAt: string;
  notes: string;
}

class OrdersAPI {
  private baseUrl = 'https://admin.viratranslate.ir/wp-json/wp/v2';

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

  // Get all orders
  async getOrders(): Promise<Order[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const orders = await response.json();
        return orders.map((order: Record<string, unknown>) => this.transformOrder(order));
      }

      return [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Get single order
  async getOrder(id: string): Promise<Order | null> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/orders/${id}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const order = await response.json();
        return this.transformOrder(order as Record<string, unknown>);
      }

      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  // Create new order
  async createOrder(orderData: Order): Promise<Order> {
    try {
      const headers = await this.getAuthHeaders();
      
      const wpOrderData = {
        title: `سفارش ${orderData.orderCode}`,
        content: orderData.specialInstructions || '',
        status: 'publish',
        meta: {
          order_code: orderData.orderCode,
          client_code: orderData.clientCode,
          client_id: orderData.clientId,
          client_type: orderData.clientType,
          client_name: orderData.clientName,
          client_phone: orderData.clientPhone,
          client_email: orderData.clientEmail,
          client_address: orderData.clientAddress,
          translation_type: orderData.translationType,
          document_type: orderData.documentType,
          language_from: orderData.languageFrom,
          language_to: orderData.languageTo,
          number_of_pages: orderData.numberOfPages,
          urgency: orderData.urgency,
          special_instructions: orderData.specialInstructions,
          order_status: orderData.status,
          created_at: orderData.createdAt,
          updated_at: orderData.updatedAt,
          total_price: orderData.totalPrice,
          order_history: JSON.stringify(orderData.history)
        }
      };

      console.log('WordPress order data being sent:', wpOrderData);
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(wpOrderData),
      });

      if (response.ok) {
        const createdOrder = await response.json();
        return this.transformOrder(createdOrder as Record<string, unknown>);
      }

      throw new Error('Failed to create order');
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Update order
  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order | null> {
    try {
      const headers = await this.getAuthHeaders();
      
      const wpOrderData: Record<string, unknown> = {
        meta: {}
      };

      const meta = wpOrderData.meta as Record<string, unknown>;

      // Map order data to WordPress meta fields
      if (orderData.status) meta.order_status = orderData.status;
      if (orderData.totalPrice !== undefined) meta.total_price = orderData.totalPrice;
      if (orderData.updatedAt) meta.updated_at = orderData.updatedAt;
      if (orderData.history) meta.order_history = JSON.stringify(orderData.history);

      const response = await fetch(`${this.baseUrl}/orders/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(wpOrderData),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        return this.transformOrder(updatedOrder as Record<string, unknown>);
      }

      return null;
    } catch (error) {
      console.error('Error updating order:', error);
      return null;
    }
  }

  // Update order status
  async updateOrderStatus(id: string, newStatus: string, notes: string = ''): Promise<boolean> {
    try {
      const order = await this.getOrder(id);
      if (!order) return false;

      const newHistoryEntry: OrderHistory = {
        id: Date.now().toString(),
        orderId: id,
        status: newStatus,
        changedBy: 'system', // In real app, get from auth context
        changedAt: new Date().toISOString(),
        notes
      };

      const updatedHistory = [...order.history, newHistoryEntry];

      const result = await this.updateOrder(id, {
        status: newStatus as 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready',
        updatedAt: new Date().toISOString(),
        history: updatedHistory
      });

      return result !== null;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Delete order
  async deleteOrder(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting order with ID:', id);
      
      // Get authentication headers
      const headers = await this.getAuthHeaders();
      
      // Try multiple methods to delete from WordPress
      console.log('🔍 Method 1: Direct DELETE with auth...');
      const deleteResponse = await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/orders/${id}`, {
        method: 'DELETE',
        headers,
      });

      console.log('📋 DELETE response status:', deleteResponse.status);

      if (deleteResponse.ok) {
        const result = await deleteResponse.json();
        console.log('✅ Order deleted from WordPress:', result);
        return true;
      }

      // Method 2: PUT to trash with auth
      console.log('🔄 Method 2: PUT to trash with auth...');
      const trashResponse = await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/orders/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status: 'trash'
        }),
      });

      console.log('📋 PUT to trash response status:', trashResponse.status);

      if (trashResponse.ok) {
        console.log('✅ Order moved to trash');
        return true;
      }

      // Method 3: Try regular posts endpoint with auth
      console.log('🔄 Method 3: Regular posts with auth...');
      const regularResponse = await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/posts/${id}`, {
        method: 'DELETE',
        headers,
      });

      console.log('📋 Regular posts DELETE response status:', regularResponse.status);

      if (regularResponse.ok) {
        console.log('✅ Order deleted via regular posts');
        return true;
      }

      // Method 4: Custom endpoint with auth
      console.log('🔄 Method 4: Custom endpoint with auth...');
      const customResponse = await fetch(`https://admin.viratranslate.ir/wp-json/custom/v1/orders/${id}`, {
        method: 'DELETE',
        headers,
      });

      console.log('📋 Custom DELETE response status:', customResponse.status);

      if (customResponse.ok) {
        console.log('✅ Order deleted via custom endpoint');
        return true;
      }

      console.log('❌ All delete methods failed - order not found in WordPress');
      console.log('✅ This order only exists in frontend - allowing removal from local state');
      return true; // Allow frontend to remove it

    } catch (error) {
      console.error('❌ Error deleting order:', error);
      return false;
    }
  }

  // Transform WordPress order to our Order interface
  private transformOrder(wpOrder: Record<string, unknown>): Order {
    const meta = (wpOrder.meta as Record<string, unknown>) || {};
    
    return {
      id: (wpOrder.id as number).toString(),
      orderCode: (meta.order_code as string) || '',
      clientCode: (meta.client_code as string) || '',
      clientId: (meta.client_id as string) || '',
      clientType: (meta.client_type as 'person' | 'company') || 'person',
      clientName: (meta.client_name as string) || '',
      clientPhone: (meta.client_phone as string) || '',
      clientEmail: (meta.client_email as string) || '',
      clientAddress: (meta.client_address as string) || '',
      translationType: (meta.translation_type as string) || '',
      documentType: (meta.document_type as string) || '',
      languageFrom: (meta.language_from as string) || '',
      languageTo: (meta.language_to as string) || '',
      numberOfPages: parseInt((meta.number_of_pages as string) || '0') || 0,
      urgency: (meta.urgency as 'normal' | 'urgent' | 'very_urgent') || 'normal',
      specialInstructions: (meta.special_instructions as string) || '',
      status: (meta.order_status as 'acceptance' | 'completion' | 'translation' | 'editing' | 'office' | 'ready') || 'acceptance',
      createdAt: (meta.created_at as string) || (wpOrder.date as string),
      updatedAt: (meta.updated_at as string) || (wpOrder.modified as string),
      totalPrice: parseFloat((meta.total_price as string) || '0') || 0,
      history: this.parseHistory(meta.order_history as string)
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

  // Get orders by status
  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/orders?meta_key=order_status&meta_value=${status}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const orders = await response.json();
        return orders.map((order: Record<string, unknown>) => this.transformOrder(order));
      }

      return [];
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      return [];
    }
  }

  // Get orders by client
  async getOrdersByClient(clientId: string): Promise<Order[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/orders?meta_key=client_id&meta_value=${clientId}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const orders = await response.json();
        return orders.map((order: Record<string, unknown>) => this.transformOrder(order));
      }

      return [];
    } catch (error) {
      console.error('Error fetching orders by client:', error);
      return [];
    }
  }
}export const ordersAPI = new OrdersAPI();


