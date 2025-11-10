/**
 * PayPal integration types and interfaces
 */

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'production';
  baseUrl: string;
  recipientEmail: string;
}

export interface CreateOrderRequest {
  amount: number;
  currency?: string;
  description?: string;
  message?: string;
}

export interface CreateOrderOptions {
  signal?: AbortSignal;
}

export interface CreateOrderResponse {
  orderId: string;
  approvalUrl?: string;
  status: string;
}

export interface CaptureOrderRequest {
  orderId: string;
}

export interface CaptureOrderResponse {
  orderId: string;
  status: string;
  captureId?: string;
  amount?: number;
  currency?: string;
}

export interface PayPalError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PayPalAccessToken {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
}
