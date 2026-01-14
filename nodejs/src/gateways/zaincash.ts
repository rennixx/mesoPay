/**
 * ZainCash Gateway Client for Node.js
 * Handles JWT-based authentication and payment operations
 */

import axios, { AxiosInstance } from 'axios';
import { generateJwtHs256, verifyJwtHs256 } from '../crypto';
import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentProvider } from '../index';

export interface ZainCashConfig {
  merchantId: string;
  secret: string;
  baseUrl: string;
}

export interface ZainCashPaymentRequest {
  amount: number;
  orderId: string;
  callbackUrl: string;
  webhookUrl?: string;
  serviceType?: string;
}

export interface ZainCashPaymentResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  redirect_url: string;
  deep_link?: string;
}

export class ZainCashClient {
  private client: AxiosInstance;
  private config: ZainCashConfig;

  constructor(config: ZainCashConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MesopotamiaSDK/0.1.0',
      },
      timeout: 30000,
    });
  }

  /**
   * Validate amount for ZainCash (1K - 5M IQD)
   */
  private validateAmount(amount: number): void {
    const min = 1000;
    const max = 5000000;
    if (amount < min || amount > max) {
      throw new Error(`Amount must be between ${min} and ${max} IQD`);
    }
  }

  /**
   * Create a payment transaction
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.validateAmount(request.amount);

    // Generate JWT token
    const token = generateJwtHs256(
      this.config.merchantId,
      request.amount,
      request.orderId,
      request.callbackUrl,
      request.webhookUrl,
      this.config.secret,
    );

    try {
      const response = await this.client.post('/payments', {
        token,
        amount: request.amount,
        order_id: request.orderId,
      });

      const data = response.data as ZainCashPaymentResponse;

      return {
        transactionId: data.id,
        redirectUrl: data.redirect_url,
        deepLink: data.deep_link,
        status: this.mapStatus(data.status),
        provider: PaymentProvider.ZAIN_CASH,
      };
    } catch (error: any) {
      throw new Error(`ZainCash payment creation failed: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const response = await this.client.get(`/payments/${transactionId}`);
      const data = response.data as ZainCashPaymentResponse;
      return this.mapStatus(data.status);
    } catch (error: any) {
      throw new Error(`ZainCash status check failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(signature: string, payload: string): boolean {
    try {
      verifyJwtHs256(signature, this.config.secret);
      return true;
    } catch {
      return false;
    }
  }

  private mapStatus(status: string): PaymentStatus {
    switch (status) {
      case 'completed':
        return PaymentStatus.COMPLETED;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'expired':
        return PaymentStatus.EXPIRED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}

export default ZainCashClient;
