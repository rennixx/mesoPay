/**
 * FIB (First Iraqi Bank) Gateway Client for Node.js
 * Handles OAuth2 authentication and payment operations
 */

import axios, { AxiosInstance } from 'axios';
import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentProvider } from '../index';

export interface FIBConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}

export interface FIBTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface FIBTokenInfo {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}

export interface FIBPaymentRequest {
  amount: number;
  order_id: string;
  callback_url: string;
  webhook_url: string;
  metadata?: Record<string, string>;
}

export interface FIBPaymentResponse {
  payment_id: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  redirect_url: string;
  deep_link?: string;
}

/**
 * FIB Gateway Client with OAuth2 token management
 */
export class FIBClient {
  private client: AxiosInstance;
  private config: FIBConfig;
  private tokenInfo: FIBTokenInfo | null = null;

  constructor(config: FIBConfig) {
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
   * Validate amount for FIB (1K - 100M IQD)
   */
  private validateAmount(amount: number): void {
    const min = 1000;
    const max = 100000000;
    if (amount < min || amount > max) {
      throw new Error(`Amount must be between ${min} and ${max} IQD`);
    }
  }

  /**
   * Get OAuth2 access token with caching
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.tokenInfo && Date.now() < this.tokenInfo.expiresAt - 300000) {
      // Token is valid and not expiring within 5 minutes
      return this.tokenInfo.accessToken;
    }

    // Fetch new token
    return await this.fetchToken();
  }

  /**
   * Fetch new OAuth2 token from FIB
   */
  private async fetchToken(): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);

      const response = await this.client.post<FIBTokenResponse>(
        '/oauth/token',
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data;

      // Cache token with expiry
      this.tokenInfo = {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        refreshToken: data.refresh_token,
      };

      return data.access_token;
    } catch (error: any) {
      throw new Error(`FIB OAuth token fetch failed: ${error.message}`);
    }
  }

  /**
   * Create a payment transaction
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.validateAmount(request.amount);

    const accessToken = await this.getAccessToken();

    const body: FIBPaymentRequest = {
      amount: request.amount,
      order_id: request.orderId,
      callback_url: request.callbackUrl,
      webhook_url: request.webhookUrl,
      metadata: request.metadata,
    };

    try {
      const response = await this.client.post<FIBPaymentResponse>(
        '/payments',
        body,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = response.data;

      return {
        transactionId: data.payment_id,
        redirectUrl: data.redirect_url,
        deepLink: data.deep_link,
        status: this.mapStatus(data.status),
        provider: PaymentProvider.FIB,
      };
    } catch (error: any) {
      // If unauthorized, clear token and retry once
      if (error.response?.status === 401 && this.tokenInfo) {
        this.tokenInfo = null;
        const newToken = await this.getAccessToken();
        const retryResponse = await this.client.post<FIBPaymentResponse>(
          '/payments',
          body,
          {
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
          }
        );

        const data = retryResponse.data;
        return {
          transactionId: data.payment_id,
          redirectUrl: data.redirect_url,
          deepLink: data.deep_link,
          status: this.mapStatus(data.status),
          provider: PaymentProvider.FIB,
        };
      }

      throw new Error(`FIB payment creation failed: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.client.get<{status: string}>(
        `/payments/${transactionId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      return this.mapStatus(response.data.status);
    } catch (error: any) {
      throw new Error(`FIB status check failed: ${error.message}`);
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

  /**
   * Clear cached token (use for testing or manual refresh)
   */
  clearToken(): void {
    this.tokenInfo = null;
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

export default FIBClient;
