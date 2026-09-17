// Runtime configuration.
//
// The production container writes `/config.js` on startup from its environment
// variables, so the same image can be pointed at any API without a rebuild.
// During development (and when the file is missing) the Vite build-time
// variables are used instead.

export type RuntimeConfig = {
  apiBaseUrl?: string;
  disableRegistration?: boolean;
  mockMode?: boolean;
};

declare global {
  interface Window {
    __DMARCO_CONFIG__?: RuntimeConfig;
  }
}

const runtimeConfig: RuntimeConfig =
  (typeof window !== 'undefined' && window.__DMARCO_CONFIG__) || {};

export const apiBaseUrl: string =
  runtimeConfig.apiBaseUrl?.trim() || import.meta.env.VITE_API_BASE_URL || '';

export const disableRegistration: boolean =
  runtimeConfig.disableRegistration ?? import.meta.env.VITE_DISABLE_REGISTRATION === 'true';

export const mockMode: boolean =
  runtimeConfig.mockMode ?? (import.meta.env.VITE_MOCK_MODE !== 'false' || !apiBaseUrl);
