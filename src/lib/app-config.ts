// App configuration from the runtime configuration and environment variables
import { disableRegistration, mockMode } from './runtime-config';

export const appConfig = {
  // Set to 'true' to disable registration
  disableRegistration,
  // Mock mode is enabled by default, disabled only when mock mode is turned off AND an API URL is configured
  mockMode,
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
