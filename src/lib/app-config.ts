// App configuration from environment variables

export const appConfig = {
  // Set to 'true' to disable registration
  disableRegistration: import.meta.env.VITE_DISABLE_REGISTRATION === 'true',
  // Mock mode is enabled by default, disabled only when VITE_MOCK_MODE=false AND an API URL is configured
  mockMode: import.meta.env.VITE_MOCK_MODE !== 'false' || !import.meta.env.VITE_API_BASE_URL,
  // Simulated loading delay in mock mode (ms)
  mockDelay: 800,
} as const;

// Utility to add fake delay in mock mode
export const mockDelay = (): Promise<void> => {
  if (appConfig.mockMode && appConfig.mockDelay > 0) {
    return new Promise(resolve => setTimeout(resolve, appConfig.mockDelay));
  }
  return Promise.resolve();
};
