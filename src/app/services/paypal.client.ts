import { PayPalService } from './paypal.service';
import { getPayPalConfig, validatePayPalConfig } from '../config/paypal.config';
import type { CreateOrderRequest, CreateOrderResponse, CaptureOrderRequest, CaptureOrderResponse } from './paypal.types';

/**
 * PayPal API client for frontend use
 * Provides a simplified interface for PayPal operations with error handling
 */
class PayPalClient {
  private service: PayPalService | null = null;
  private initialized = false;

  /**
   * Initialize the PayPal client
   * Should be called once at app startup
   */
  initialize(): void {
    try {
      const config = getPayPalConfig();
      validatePayPalConfig(config);
      this.service = new PayPalService(config);
      this.initialized = true;
      console.info('PayPal integration initialized successfully');
    } catch (error) {
      console.warn('PayPal integration not configured:', error instanceof Error ? error.message : 'Unknown error');
      this.initialized = false;
      this.service = null;
    }
  }

  /**
   * Check if PayPal is available
   */
  isAvailable(): boolean {
    return this.initialized && this.service !== null;
  }

  /**
   * Create a tip order
   */
  async createTipOrder(amount: number, message?: string): Promise<CreateOrderResponse> {
    if (!this.service) {
      throw new Error('PayPal service not initialized. Tips are currently unavailable.');
    }

    const request: CreateOrderRequest = {
      amount,
      currency: 'USD',
      description: 'PaintApp Tip',
      message,
    };

    return this.service.createOrder(request);
  }

  /**
   * Capture a tip order
   */
  async captureTipOrder(orderId: string): Promise<CaptureOrderResponse> {
    if (!this.service) {
      throw new Error('PayPal service not initialized. Tips are currently unavailable.');
    }

    const request: CaptureOrderRequest = {
      orderId,
    };

    return this.service.captureOrder(request);
  }

  /**
   * Verify an order
   */
  async verifyOrder(orderId: string): Promise<{ status: string; amount?: number }> {
    if (!this.service) {
      throw new Error('PayPal service not initialized. Tips are currently unavailable.');
    }

    return this.service.verifyOrder(orderId);
  }
}

// Export singleton instance
export const paypalClient = new PayPalClient();
