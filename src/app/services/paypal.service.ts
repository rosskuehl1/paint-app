import {
  PayPalConfig,
  PayPalAccessToken,
  PayPalOrderResponse,
  PayPalCaptureResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CaptureOrderRequest,
  CaptureOrderResponse,
  PayPalError,
} from './paypal.types';
import { buildAppUrl } from '../config/app-paths';

/**
 * PayPal Service
 * Handles all PayPal API interactions with proper error handling and security
 */
export class PayPalService {
  private config: PayPalConfig;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(config: PayPalConfig) {
    this.config = config;
  }

  /**
   * Get PayPal access token with caching
   * Tokens are cached until they expire to minimize API calls
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await fetch(`${this.config.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
      }

      const data = (await response.json()) as PayPalAccessToken;
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('PayPal authentication error:', error);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  /**
   * Create a PayPal order for a tip/donation
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      // Validate amount
      if (request.amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      // Round to 2 decimal places
      const amount = Math.round(request.amount * 100) / 100;
      const currency = request.currency || 'USD';

      const accessToken = await this.getAccessToken();

      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: request.description || 'PaintApp Tip',
            custom_id: request.message || undefined,
            payee: {
              email_address: this.config.recipientEmail,
            },
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'PaintApp',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: buildAppUrl('payment/success'),
          cancel_url: buildAppUrl('payment/cancel'),
        },
      };

      const response = await fetch(`${this.config.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        await response.json().catch(() => ({}));
        throw new Error(`Failed to create PayPal order: ${response.statusText}`);
      }

      const orderData = (await response.json()) as PayPalOrderResponse;

      // Find approval URL
      const approvalUrl = orderData.links?.find((link) => link.rel === 'approve')?.href;

      return {
        orderId: orderData.id,
        approvalUrl,
        status: orderData.status,
      };
    } catch (error) {
      console.error('PayPal order creation error:', error);
      const paypalError: PayPalError = {
        code: 'ORDER_CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create order',
        details: error,
      };
      throw paypalError;
    }
  }

  /**
   * Capture a PayPal order after user approval
   */
  async captureOrder(request: CaptureOrderRequest): Promise<CaptureOrderResponse> {
    try {
      if (!request.orderId) {
        throw new Error('Order ID is required');
      }

      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.config.baseUrl}/v2/checkout/orders/${request.orderId}/capture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        await response.json().catch(() => ({}));
        throw new Error(`Failed to capture PayPal order: ${response.statusText}`);
      }

      const captureData = (await response.json()) as PayPalCaptureResponse;

      // Extract capture details
      const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

      return {
        orderId: captureData.id,
        status: captureData.status,
        captureId: capture?.id,
        amount: capture?.amount ? parseFloat(capture.amount.value) : undefined,
        currency: capture?.amount?.currency_code,
      };
    } catch (error) {
      console.error('PayPal order capture error:', error);
      const paypalError: PayPalError = {
        code: 'ORDER_CAPTURE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to capture order',
        details: error,
      };
      throw paypalError;
    }
  }

  /**
   * Verify an order exists and get its status
   */
  async verifyOrder(orderId: string): Promise<{ status: string; amount?: number }> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.config.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to verify PayPal order: ${response.statusText}`);
      }

      const orderData = (await response.json()) as PayPalOrderResponse;

      return {
        status: orderData.status,
      };
    } catch (error) {
      console.error('PayPal order verification error:', error);
      throw new Error('Failed to verify order');
    }
  }
}
