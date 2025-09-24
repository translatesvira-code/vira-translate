// import { auth } from './wordpress-auth';

export interface ServiceSettings {
  id: string;
  name: string;
  price: number;
  additionType: 'percentage' | 'amount';
  additionValue: number;
  total: number;
}

export interface CategorySettings {
  id: string;
  name: string;
  translationPrice: number;
  officeServicePrice: number;
  hasInquiry: boolean;
  inquiryPrice: number;
  total: number;
}

export interface SettingsData {
  services: ServiceSettings[];
  categories: CategorySettings[];
}

class SettingsAPI {
  private baseUrl = 'https://admin.viratranslate.ir/wp-json';
  private customEndpoint = '/custom/v1/settings'; // Custom endpoint for settings

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

  // Get settings
  async getSettings(): Promise<SettingsData | null> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}${this.customEndpoint}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const settingsData = await response.json();
        console.log('Loaded settings from API:', settingsData);
        return settingsData;
      }

      // Return default settings if no data found
      console.log('No settings found, returning defaults');
      return this.getDefaultSettings();

    } catch (error) {
      console.error('Error fetching settings:', error);
      return this.getDefaultSettings();
    }
  }

  // Save settings
  async saveSettings(settings: SettingsData): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      
      console.log('Sending settings to WordPress API:', {
        url: `${this.baseUrl}${this.customEndpoint}`,
        method: 'POST',
        data: settings
      });

      const response = await fetch(`${this.baseUrl}${this.customEndpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(settings),
      });

      console.log('Save response status:', response.status);

      if (response.ok) {
        console.log('Settings saved successfully in WordPress');
        return true;
      }

      console.error('Save failed with status:', response.status);
      return false;

    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // Get default settings
  private getDefaultSettings(): SettingsData {
    return {
      services: [
        { id: '1', name: 'تائیدات دادگستری', price: 0, additionType: 'percentage', additionValue: 0, total: 0 },
        { id: '2', name: 'تائیدات خارجه', price: 0, additionType: 'percentage', additionValue: 0, total: 0 },
        { id: '3', name: 'برابر اصل', price: 0, additionType: 'percentage', additionValue: 0, total: 0 }
      ],
      categories: [
        { id: '1', name: 'هویتی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrice: 0, total: 0 },
        { id: '2', name: 'تحصیلی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrice: 0, total: 0 },
        { id: '3', name: 'مالی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrice: 0, total: 0 },
        { id: '4', name: 'پزشکی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrice: 0, total: 0 }
      ]
    };
  }
}

export const settingsAPI = new SettingsAPI();
