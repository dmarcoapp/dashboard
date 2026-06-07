import { apiClient, tokenStorage } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import { appConfig } from '@/lib/app-config';
import { mockUser } from '@/lib/mock-data';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  EmailVerifyRequest,
  PasswordResetRequestPayload,
  PasswordResetPayload,
  User,
} from '@/types/api';

export const authService = {
  async login(email: string, password: string, twoFactorCode?: string): Promise<LoginResponse> {
    if (appConfig.mockMode) {
      // Simulate login in mock mode
      const mockResponse: LoginResponse = {
        token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        refresh_token_expiration: new Date(Date.now() + 3600 * 1000).toISOString(),
      };
      tokenStorage.set({
        accessToken: mockResponse.token,
        refreshToken: mockResponse.refresh_token,
        expiresIn: 3600,
      });
      return mockResponse;
    }

    const requestBody: LoginRequest = {
      username: email,
      password,
      ...(twoFactorCode ? { two_factor_code: twoFactorCode } : {}),
    };
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.login,
      requestBody,
      { skipAuth: true }
    );
    
    tokenStorage.set({
      accessToken: response.token,
      refreshToken: response.refresh_token,
      expiresIn: 3600, // Default to 1 hour, or parse from refresh_token_expiration
    });
    
    return response;
  },

  async register(data: RegisterRequest): Promise<void> {
    if (appConfig.mockMode) {
      return; // Simulate successful registration
    }
    await apiClient.post(API_ENDPOINTS.register, data, { skipAuth: true });
  },

  async logout(): Promise<void> {
    if (appConfig.mockMode) {
      tokenStorage.clear();
      return;
    }
    try {
      const tokens = tokenStorage.get();
      await apiClient.post(API_ENDPOINTS.logout, {
        refresh_token: tokens?.refreshToken ?? '',
      });
    } finally {
      tokenStorage.clear();
    }
  },

  async verifyEmail(data: EmailVerifyRequest): Promise<void> {
    if (appConfig.mockMode) {
      return; // Simulate successful verification
    }
    await apiClient.post(API_ENDPOINTS.emailVerify, data, { skipAuth: true });
  },

  async resendVerification(email: string): Promise<void> {
    if (appConfig.mockMode) {
      return; // Simulate successful resend
    }
    await apiClient.post(API_ENDPOINTS.resendVerification, { email }, { skipAuth: true });
  },

  async requestPasswordReset(data: PasswordResetRequestPayload): Promise<void> {
    if (appConfig.mockMode) {
      return; // Simulate successful request
    }
    await apiClient.post(API_ENDPOINTS.passwordResetRequest, data, { skipAuth: true });
  },

  async resetPassword(data: PasswordResetPayload): Promise<void> {
    if (appConfig.mockMode) {
      return; // Simulate successful reset
    }
    await apiClient.post(API_ENDPOINTS.passwordReset, data, { skipAuth: true });
  },

  async getCurrentUser(): Promise<User> {
    if (appConfig.mockMode) {
      return mockUser;
    }
    return apiClient.get<User>(API_ENDPOINTS.profile);
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.get()?.accessToken;
  },
};
