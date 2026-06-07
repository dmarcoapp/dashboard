import { API_BASE_URL } from './api-config';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const TOKEN_KEY = 'dmarco_tokens';

export const tokenStorage = {
  get: (): TokenData | null => {
    const data = localStorage.getItem(TOKEN_KEY);
    return data ? JSON.parse(data) : null;
  },
  set: (tokens: TokenData) => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async refreshTokens(): Promise<boolean> {
    const tokens = tokenStorage.get();
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/v1/auth/token_refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });

      if (!response.ok) {
        tokenStorage.clear();
        return false;
      }

      const data = await response.json();
      tokenStorage.set({
        accessToken: data.token,
        refreshToken: data.refresh_token,
        expiresIn: 3600,
      });
      return true;
    } catch {
      tokenStorage.clear();
      return false;
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;
    
    const headers = new Headers(fetchOptions.headers);
    
    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (!skipAuth) {
      const tokens = tokenStorage.get();
      if (tokens?.accessToken) {
        headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && !skipAuth) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshTokens();
      }
      
      const refreshed = await this.refreshPromise;
      this.refreshPromise = null;

      if (refreshed) {
        // Retry the request with new token
        const tokens = tokenStorage.get();
        headers.set('Authorization', `Bearer ${tokens?.accessToken}`);
        
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers,
        });

        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            retryResponse.status,
            error.detail || error.message || 'Request failed',
            error.error
          );
        }

        return retryResponse.json();
      } else {
        // Redirect to login
        window.location.href = '/auth/login';
        throw new ApiError(401, 'Session expired');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        error.detail || error.message || 'Request failed',
        error.error
      );
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async getText(endpoint: string, options?: RequestOptions): Promise<string> {
    const { skipAuth = false, ...fetchOptions } = options || {};
    
    const headers = new Headers(fetchOptions.headers);

    if (!skipAuth) {
      const tokens = tokenStorage.get();
      if (tokens?.accessToken) {
        headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Request failed');
    }

    return response.text();
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public error?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
