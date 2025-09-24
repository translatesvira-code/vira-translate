// import { auth } from './wordpress-auth';

export interface Client {
  id: number;
  code: string;
  name: string;
  serviceType: string;
  translateDate: string;
  deliveryDate: string;
  status: 'accepted' | 'translating' | 'editing' | 'ready' | 'delivered' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface CreateClientData {
  name: string;
  code: string;
  serviceType: string;
  translateDate?: string;
  deliveryDate?: string;
  status?: 'accepted' | 'translating' | 'editing' | 'ready' | 'delivered' | 'archived';
}

export interface UpdateClientData {
  name?: string;
  code?: string;
  serviceType?: string;
  translateDate?: string;
  deliveryDate?: string;
  status?: 'accepted' | 'translating' | 'editing' | 'ready' | 'delivered' | 'archived';
}

class ClientsAPI {
  private baseUrl = 'https://admin.viratranslate.ir/wp-json/wp/v2';
  private customPostType = 'clients'; // Custom post type for clients

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

  // Get all clients
  async getClients(): Promise<Client[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      // Try to get from custom post type first
      const response = await fetch(`${this.baseUrl}/${this.customPostType}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const posts = await response.json();
        return posts.map((post: Record<string, unknown>) => this.mapPostToClient(post));
      }

      // Fallback: try to get from posts with meta
      const postsResponse = await fetch(`${this.baseUrl}/posts?meta_key=client_data`, {
        method: 'GET',
        headers,
      });

      if (postsResponse.ok) {
        const posts = await postsResponse.json();
        return posts.map((post: Record<string, unknown>) => this.mapPostToClient(post));
      }

      // If no custom post type exists, return empty array
      console.log('No clients found in WordPress, returning empty array');
      return [];

    } catch (error) {
      console.error('Error fetching clients:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // Create new client
  async createClient(clientData: CreateClientData): Promise<Client | null> {
    try {
      const headers = await this.getAuthHeaders();
      
      const postData = {
        title: clientData.name,
        content: `کد سفارش: ${clientData.code}\nنوع خدمت: ${clientData.serviceType}`,
        status: 'publish',
        meta: {
          client_code: clientData.code,
          client_name: clientData.name,
          service_type: clientData.serviceType,
          translate_date: clientData.translateDate || '',
          delivery_date: clientData.deliveryDate || '',
          client_status: clientData.status || 'accepted',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      console.log('🔍 Creating client with data:', postData);

      // Try custom post type first
      const response = await fetch(`${this.baseUrl}/${this.customPostType}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(postData),
      });

      console.log('📋 Custom post type response status:', response.status);

      if (response.ok) {
        const post = await response.json();
        console.log('✅ Client created in custom post type:', post);
        return this.mapPostToClient(post);
      } else {
        const errorText = await response.text();
        console.log('❌ Custom post type failed:', errorText);
      }

      // Fallback: create as regular post
      console.log('🔄 Trying regular posts endpoint...');
      const postsResponse = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(postData),
      });

      console.log('📋 Regular posts response status:', postsResponse.status);

      if (postsResponse.ok) {
        const post = await postsResponse.json();
        console.log('✅ Client created as regular post:', post);
        return this.mapPostToClient(post);
      } else {
        const errorText = await postsResponse.text();
        console.log('❌ Regular posts failed:', errorText);
      }

      return null;

    } catch (error) {
      console.error('Error creating client:', error);
      return null;
    }
  }

  // Update client
  async updateClient(id: number, clientData: UpdateClientData): Promise<Client | null> {
    try {
      const headers = await this.getAuthHeaders();
      
      const updateData = {
        title: clientData.name,
        content: `کد سفارش: ${clientData.code}\nنوع خدمت: ${clientData.serviceType}`,
        meta: {
          client_code: clientData.code,
          client_name: clientData.name,
          service_type: clientData.serviceType,
          translate_date: clientData.translateDate || '',
          delivery_date: clientData.deliveryDate || '',
          client_status: clientData.status,
          updated_at: new Date().toISOString()
        }
      };

      // Try custom post type first
      const response = await fetch(`${this.baseUrl}/${this.customPostType}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const post = await response.json();
        return this.mapPostToClient(post);
      }

      // Fallback: update as regular post
      const postsResponse = await fetch(`${this.baseUrl}/posts/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      if (postsResponse.ok) {
        const post = await postsResponse.json();
        return this.mapPostToClient(post);
      }

      return null;

    } catch (error) {
      console.error('Error updating client:', error);
      return null;
    }
  }

  // Delete client
  async deleteClient(id: number): Promise<boolean> {
    try {
      console.log('🗑️ Deleting client with ID:', id);
      
      // Get authentication headers
      const headers = await this.getAuthHeaders();
      
      // Debug: List all clients to see what's available
      console.log('🔍 Debug: Listing all clients to find the correct one...');
      const allClientsResponse = await fetch(`${this.baseUrl}/clients`, {
        method: 'GET',
        headers,
      });
      
      if (allClientsResponse.ok) {
        const allClients = await allClientsResponse.json();
        console.log('📋 All clients in WordPress:', allClients);
        
        // Log all client IDs for debugging
        const clientIds = allClients.map((client: Record<string, unknown>) => client.id);
        console.log('🔍 Available client IDs:', clientIds);
        console.log('🔍 Looking for client ID:', id);
        
        // Find client by ID
        const clientToDelete = allClients.find((client: Record<string, unknown>) => client.id === id);
        if (clientToDelete) {
          console.log('✅ Found client to delete:', clientToDelete);
        } else {
          console.log('❌ Client not found in WordPress clients list');
          
          // Try to find by client_code instead
          console.log('🔍 Trying to find by client_code...');
          const clientByCode = allClients.find((client: Record<string, unknown>) => {
            const meta = client.meta as Record<string, unknown>;
            return meta && meta.client_code === id.toString();
          });
          
          if (clientByCode) {
            console.log('✅ Found client by code:', clientByCode);
            // Update the ID to the actual WordPress ID
            id = clientByCode.id as number;
            console.log('🔄 Updated ID to:', id);
          }
        }
      }
      
      // First check if client exists in WordPress
      console.log('🔍 Checking if client exists in WordPress...');
      const getResponse = await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/clients/${id}`, {
        method: 'GET',
        headers,
      });

      console.log('📋 GET response status:', getResponse.status);

      if (getResponse.ok) {
        console.log('✅ Client exists in WordPress, attempting deletion...');
        
        // Client exists, try to delete it
        const deleteResponse = await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/clients/${id}`, {
          method: 'DELETE',
          headers,
        });

        console.log('📋 DELETE response status:', deleteResponse.status);

        if (deleteResponse.ok) {
          const result = await deleteResponse.json();
          console.log('✅ Client deleted from WordPress:', result);
          return true;
        } else {
          console.log('❌ DELETE failed, trying PUT to trash...');
          
          // Try PUT to trash
          const trashResponse = await fetch(`https://admin.viratranslate.ir/wp-json/wp/v2/clients/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              status: 'trash'
            }),
          });

          if (trashResponse.ok) {
            console.log('✅ Client moved to trash');
            return true;
          }
        }
      } else {
        console.log('❌ Client not found in WordPress (404)');
      }

      // If client doesn't exist in WordPress, it's probably frontend-only
      console.log('✅ Client not found in WordPress - allowing frontend to remove from local state');
      return true;

    } catch (error) {
      console.error('❌ Error deleting client:', error);
      return false;
    }
  }

  // Map WordPress post to Client object
  private mapPostToClient(post: Record<string, unknown>): Client {
    const meta = (post.meta as Record<string, unknown>) || {};
    
    return {
      id: Number(post.id) || 0,
      code: (meta.client_code as string) || `TR${(post.id as number || 0).toString().padStart(4, '0')}`,
      name: (meta.client_name as string) || ((post.title as Record<string, unknown>)?.rendered as string) || 'نامشخص',
      serviceType: (meta.service_type as string) || 'ترجمه رسمی',
      translateDate: (meta.translate_date as string) || '',
      deliveryDate: (meta.delivery_date as string) || '',
      status: (meta.client_status as 'accepted' | 'translating' | 'editing' | 'ready' | 'delivered' | 'archived') || 'accepted',
      created_at: (meta.created_at as string) || (post.date as string),
      updated_at: (meta.updated_at as string) || (post.modified as string)
    };
  }
}export const clientsAPI = new ClientsAPI();


