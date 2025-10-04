// import { auth } from './wordpress-auth';

export interface ServiceSettings {
  id: string;
  name: string;
  price: number;
  additionType: 'percentage' | 'amount';
  additionValue: number;
  total: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  translationPrice: number;
  officeServicePrice: number;
  hasInquiry: boolean;
  inquiryPrices: number[];
  total: number;
}

export interface CategorySettings {
  id: string;
  name: string;
  items: DocumentItem[];
}

export interface LanguagePair {
  from: string;
  to: string;
}

export interface LanguageSettings {
  from: string;
  to: string;
  pairs: LanguagePair[];
}

export interface SettingsData {
  services: ServiceSettings[];
  categories: CategorySettings[];
  languages?: LanguageSettings;
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
        { 
          id: '1', 
          name: 'هویتی', 
          items: []
        },
        { 
          id: '2', 
          name: 'تحصیلی', 
          items: []
        },
        { 
          id: '3', 
          name: 'مالی', 
          items: []
        },
        { 
          id: '4', 
          name: 'پزشکی', 
          items: [
            { id: '4-1', name: 'برگه آزمایش پزشکی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '4-2', name: 'نسخه پزشک', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '4-3', name: 'گواهی پزشکی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '4-4', name: 'گزارش پزشکی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '4-5', name: 'گزارش پزشکی قانونی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 }
          ]
        },
        { 
          id: '5', 
          name: 'اسناد', 
          items: [
            { id: '5-1', name: 'سند مالکیت تک‌برگی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-2', name: 'سند مالکیت دفترچه‌ای', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-3', name: 'سند وسایل نقلیه', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-4', name: 'مبایعه‌نامه/اجاره‌نامه با کد رهگیری', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-5', name: 'مبایعه‌نامه/اجاره‌نامه/صلح‌نامه محضری', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-6', name: 'استعلامات اداره ثبت', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-7', name: 'گزارش ارزیابی و کارشناسی املاک', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-8', name: 'اوراق محضری (تعهدنامه، اقرارنامه، استشهادیه)', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-9', name: 'وکالت‌نامه', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-10', name: 'اوراق قضائی (حصر وراثت، دادنامه)', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-11', name: 'سند نوع ۱', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '5-12', name: 'سند نوع ۲', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 }
          ]
        },
        { 
          id: '6', 
          name: 'کاری', 
          items: [
            { id: '6-1', name: 'گواهی اشتغال', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-2', name: 'حکم کارگزینی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-3', name: 'حکم بازنشستگی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-4', name: 'حکم افزایش حقوق', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-5', name: 'حکم اعضای هیئت علمی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-6', name: 'فیش حقوقی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-7', name: 'سابقه بیمه تأمین اجتماعی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-8', name: 'برگه مرخصی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-9', name: 'کارت شناسایی شغلی (کارت بازرگانی، مباشرت، نظام پزشکی)', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-10', name: 'پروانه دائم پزشکی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-11', name: 'پروانه وکالت', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-12', name: 'پروانه مهندسی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-13', name: 'پروانه مطب', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-14', name: 'پروانه مسئولیت فنی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-15', name: 'دفترچه وکالت/ کارشناسی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-16', name: 'جواز کسب', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-17', name: 'مدرک شغلی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-18', name: 'گواهی شغلی متفرقه', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '6-19', name: 'دفترچه بیمه', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 }
          ]
        },
        { 
          id: '7', 
          name: 'آموزشی', 
          items: [
            { id: '7-1', name: 'کارنامه توصیفی ابتدائی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-2', name: 'ریزنمرات تحصیلی آموزش-پرورش (ابتدائی- متوسطه)', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-3', name: 'ریزنمرات دبیرستان (کل)', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-4', name: 'دیپلم پایان تحصیلات متوسطه', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-5', name: 'گواهی پایان دوره پیش‌دانشگاهی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-6', name: 'دانش‌نامه (دانشگاهی)', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-7', name: 'ریزنمرات دانشگاه', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-8', name: 'گواهی اشتغال به تحصیل', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-9', name: 'گواهی ریزنمرات', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-10', name: 'سرفصل دروس', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-11', name: 'گواهی فنی-حرفه‌ای', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-12', name: 'گواهی حوزه علمیه', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-13', name: 'گواهی رتبه', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-14', name: 'گواهی آموزش دوره‌های مراکز دولتی یا خصوصی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 },
            { id: '7-15', name: 'مدرک آموزشی', translationPrice: 0, officeServicePrice: 0, hasInquiry: false, inquiryPrices: [], total: 0 }
          ]
        }
      ],
      languages: {
        from: '',
        to: '',
        pairs: [
          { from: 'persian', to: 'english' },
          { from: 'english', to: 'persian' },
          { from: 'arabic', to: 'persian' },
          { from: 'persian', to: 'arabic' }
        ]
      }
    };
  }
}

export const settingsAPI = new SettingsAPI();
