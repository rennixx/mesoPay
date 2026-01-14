/**
 * FastPay Gateway Client for Node.js
 * Handles Basic Auth and payment operations
 */

import axios, { AxiosInstance } from 'axios';
import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentProvider } from '../index';

export interface FastPayConfig {
  storeId: string;
  password: string;
  baseUrl: string;
}

export interface FastPayPaymentRequest {
  amount: number;
  order_id: string;
  callback_url: string;
  webhook_url: string;
  metadata?: Record<string, string>;
}

export interface FastPayPaymentResponse {
  payment_id: string;
  status: 'pending' | 'completed' | 'failed' | 'expired' | 'cancelled';
  redirect_url: string;
  deep_link?: string;
}

export interface FastPayRefundRequest {
  amount: number;
  reason?: string;
}

export interface FastPayRefundResponse {
  refund_id: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
}

export class FastPayClient {
  private client: AxiosInstance;
  private authHeader: string;

  constructor(config: FastPayConfig) {
    // Create Basic Auth header
    this.authHeader = `Basic ${Buffer.from(
      `${config.storeId}:${config.password}`
    ).toString('base64')}`;

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
        'User-Agent': 'MesopotamiaSDK/0.1.0',
      },
      timeout: 30000,
    });
  }

  /**
   * Validate amount for FastPay (500 - 10M IQD)
   */
  private validateAmount(amount: number): void {
    const min = 500;
    const max = 10000000;
    if (amount < min || amount > max) {
      throw new Error(`Amount must be between ${min} and ${max} IQD`);
    }
  }

  /**
   * Create a payment transaction
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.validateAmount(request.amount);

    const body: FastPayPaymentRequest = {
      amount: request.amount,
      order_id: request.orderId,
      callback_url: request.callbackUrl,
      webhook_url: request.webhookUrl,
      metadata: request.metadata,
    };

    try {
      const response = await this.client.post<FastPayPaymentResponse>(
        '/payments',
        body
      );

      const data = response.data;

      return {
        transactionId: data.payment_id,
        redirectUrl: data.redirect_url,
        deepLink: data.deep_link,
        status: this.mapStatus(data.status),
        provider: PaymentProvider.FASTPAY,
      };
    } catch (error: any) {
      throw new Error(`FastPay payment creation failed: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const response = await this.client.get<{status: string}>(
        `/payments/${transactionId}/status`
      );
      return this.mapStatus(response.data.status);
    } catch (error: any) {
      throw new Error(`FastPay status check failed: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   */
  async refund(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<FastPayRefundResponse> {
    try {
      const body: FastPayRefundRequest = { amount, reason };
      const response = await this.client.post<FastPayRefundResponse>(
        `/payments/${transactionId}/refund`,
        body
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`FastPay refund failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature (HMAC-SHA256)
   */
  verifyWebhook(signature: string, payload: string, secret: string): boolean {
    const crypto = require('crypto');
    const sigBytes = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(sigBytes),
      Buffer.from(expected)
    );
  }

  private mapStatus(status: string): PaymentStatus {
    switch (status) {
      case 'completed':
        return PaymentStatus.COMPLETED;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'expired':
        return PaymentStatus.EXPIRED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}

export default FastPayClient;
