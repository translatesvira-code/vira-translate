export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  token?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class WordPressAuth {
  private baseUrl = 'https://admin.viratranslate.ir/wp-json';

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // JWT Auth endpoint
      const endpoint = `${this.baseUrl}/jwt-auth/v1/token`;

      const tokenResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        return { success: false, error: errorData.message || 'نام کاربری یا رمز عبور اشتباه است' };
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.token;

      // حالا اطلاعات کاربر با توکن JWT بگیر
      const userResponse = await fetch(`${this.baseUrl}/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        return { success: false, error: 'خطا در دریافت اطلاعات کاربر' };
      }

      const userData = await userResponse.json();

      return {
        success: true,
        user: {
          id: userData.id,
          username: userData.username || userData.name,
          name: userData.name || userData.username,
          role: userData.roles?.[0] || 'subscriber',
          token: token
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'خطا در ورود به سیستم' };
    }
  }

  async getCurrentUser(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/wp/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return null;

      const userData = await response.json();
      return {
        id: userData.id,
        username: userData.username || userData.name,
        name: userData.name || userData.username,
        role: userData.roles?.[0] || 'subscriber',
        token
      };
    } catch {
      return null;
    }
  }
}

export const auth = new WordPressAuth();
