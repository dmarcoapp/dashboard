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

// A dashboard served by the container gets /config.js, written before nginx
// starts. A built dashboard with neither that file nor a build-time API address
// has nothing to go on, and every value below falls back to a guess, so say it
// out loud rather than leaving someone to wonder where the requests are going.
if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  !window.__DMARCO_CONFIG__ &&
  !import.meta.env.VITE_API_BASE_URL
) {
  console.error(
    'DMARCo: /config.js did not load, so the built-in defaults are in use. Check that it is served and not cached.',
  );
}

export const apiBaseUrl: string =
  runtimeConfig.apiBaseUrl?.trim() || import.meta.env.VITE_API_BASE_URL || '';

export const disableRegistration: boolean =
  runtimeConfig.disableRegistration ?? import.meta.env.VITE_DISABLE_REGISTRATION === 'true';

// Mock mode is whatever the runtime configuration says. Without an answer it
// follows the build, and only a build that said nothing at all falls back to the
// API address, which is the development case: nothing to talk to, so show the
// sample data. A build that switched mocking off never turns it back on by
// itself, or a real installation quietly serves demo numbers.
const buildMockMode = import.meta.env.VITE_MOCK_MODE;

export const mockMode: boolean =
  runtimeConfig.mockMode ??
  (buildMockMode === 'false' ? false : buildMockMode === 'true' || !apiBaseUrl);
