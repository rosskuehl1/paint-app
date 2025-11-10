import { PayPalConfig } from '../services/paypal.types';

/**
 * PayPal configuration
 * Loads configuration from environment variables with sensible defaults
 */
export const getPayPalConfig = (): PayPalConfig => {
  const mode = (import.meta.env.VITE_PAYPAL_MODE as 'sandbox' | 'production') || 'sandbox';
  const baseUrl =
    mode === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  return {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_PAYPAL_CLIENT_SECRET || '',
    mode,
    baseUrl,
    recipientEmail: import.meta.env.VITE_PAYPAL_RECIPIENT_EMAIL || 'rosskuehl@gmail.com',
  };
};

/**
 * Validates PayPal configuration
 * @throws {Error} if configuration is invalid
 */
export const validatePayPalConfig = (config: PayPalConfig): void => {
  if (!config.clientId) {
    throw new Error('PayPal Client ID is required. Set VITE_PAYPAL_CLIENT_ID environment variable.');
  }

  if (!config.clientSecret) {
    throw new Error('PayPal Client Secret is required. Set VITE_PAYPAL_CLIENT_SECRET environment variable.');
  }

  if (!config.recipientEmail) {
    throw new Error('PayPal recipient email is required. Set VITE_PAYPAL_RECIPIENT_EMAIL environment variable.');
  }

  if (config.mode !== 'sandbox' && config.mode !== 'production') {
    throw new Error('PayPal mode must be either "sandbox" or "production".');
  }
};

/**
 * Check if PayPal is properly configured
 */
export const isPayPalConfigured = (): boolean => {
  try {
    const config = getPayPalConfig();
    return Boolean(config.clientId && config.clientSecret && config.recipientEmail);
  } catch {
    return false;
  }
};
