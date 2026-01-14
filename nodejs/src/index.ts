/**
 * Mesopotamia SDK - Unified Iraqi payment gateway SDK for Node.js
 * Supporting ZainCash, FastPay, and FIB
 */

import { ZainCashClient } from './gateways/zaincash';
import { FastPayClient } from './gateways/fastpay';
import { FIBClient } from './gateways/fib';
import { verifyWebhookWithTimestamp } from './crypto';

/**
 * Payment gateway providers
 */
export enum PaymentProvider {
  ZAIN_CASH = 'zaincash',
  FASTPAY = 'fastpay',
  FIB = 'fib',
}

/**
 * Environment (sandbox or production)
 */
export enum Environment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

/**
 * Payment request
 */
export interface PaymentRequest {
  provider: PaymentProvider;
  amount: number;
  orderId: string;
  callbackUrl: string;
  webhookUrl: string;
  metadata?: Record<string, string>;
  description?: string;
}

/**
 * Payment response
 */
export interface PaymentResponse {
  transactionId: string;
  redirectUrl: string;
  deepLink?: string;
  status: PaymentStatus;
  provider: PaymentProvider;
}

/**
 * SDK configuration
 */
export interface SdkConfig {
  environment: Environment;
  providers: Partial<Record<PaymentProvider, ProviderConfig>>;
  timeoutMs?: number;
  enableLogging?: boolean;
}

/**
 * SDK error
 */
export class MesopotamiaError extends Error {
  constructor(
    message: string,
    public code?: string,
    public provider?: PaymentProvider,
  ) {
    super(message);
    this.name = 'MesopotamiaError';
  }
}

/**
 * Get base URL for provider and environment
 */
function getBaseUrl(provider: PaymentProvider, environment: Environment): string {
  const urls: Record<PaymentProvider, Record<Environment, string>> = {
    [PaymentProvider.ZAIN_CASH]: {
      [Environment.SANDBOX]: 'https://sandbox.zaincash.iq/api/v1',
      [Environment.PRODUCTION]: 'https://api.zaincash.iq/api/v1',
    },
    [PaymentProvider.FASTPAY]: {
      [Environment.SANDBOX]: 'https://sandbox-api.fast-pay.iq/v1',
      [Environment.PRODUCTION]: 'https://api.fast-pay.iq/v1',
    },
    [PaymentProvider.FIB]: {
      [Environment.SANDBOX]: 'https://sandbox-fib.iq/api/v2',
      [Environment.PRODUCTION]: 'https://api.fib.iq/api/v2',
    },
  };

  return urls[provider][environment];
}

/**
 * Get amount range for provider
 */
function getAmountRange(provider: PaymentProvider): [number, number] {
  const ranges: Record<PaymentProvider, [number, number]> = {
    [PaymentProvider.ZAIN_CASH]: [1000, 5000000],
    [PaymentProvider.FASTPAY]: [500, 10000000],
    [PaymentProvider.FIB]: [1000, 100000000],
  };

  return ranges[provider];
}

/**
 * Main SDK class
 */
export class MesopotamiaSDK {
  private config: SdkConfig;
  private clients: Map<PaymentProvider, ZainCashClient | FastPayClient | FIBClient>;

  constructor(config: SdkConfig) {
    this.config = {
      timeoutMs: 30000,
      enableLogging: false,
      ...config,
    };

    this.clients = new Map();
    this.initializeClients();
  }

  private initializeClients(): void {
    for (const [provider, providerConfig] of Object.entries(this.config.providers)) {
      const baseUrl = providerConfig.baseUrl || getBaseUrl(provider as PaymentProvider, this.config.environment);

      switch (provider as PaymentProvider) {
        case PaymentProvider.ZAIN_CASH:
          this.clients.set(
            PaymentProvider.ZAIN_CASH,
            new ZainCashClient({
              merchantId: providerConfig.merchantId,
              secret: providerConfig.apiSecret,
              baseUrl,
            })
          );
          break;

        case PaymentProvider.FASTPAY:
          this.clients.set(
            PaymentProvider.FASTPAY,
            new FastPayClient({
              storeId: providerConfig.merchantId,
              password: providerConfig.apiSecret,
              baseUrl,
            })
          );
          break;

        case PaymentProvider.FIB:
          this.clients.set(
            PaymentProvider.FIB,
            new FIBClient({
              clientId: providerConfig.merchantId,
              clientSecret: providerConfig.apiSecret,
              baseUrl,
            })
          );
          break;
      }
    }
  }

  /**
   * Log message if logging is enabled
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[MesopotamiaSDK] ${message}`);
    }
  }

  /**
   * Create a payment transaction
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    this.log(`Creating payment: ${request.provider} - ${request.amount} IQD`);

    const client = this.clients.get(request.provider);
    if (!client) {
      throw new MesopotamiaError(
        `Provider not configured: ${request.provider}`,
        'PROVIDER_NOT_CONFIGURED',
        request.provider
      );
    }

    // Validate amount
    const [min, max] = getAmountRange(request.provider);
    if (request.amount < min || request.amount > max) {
      throw new MesopotamiaError(
        `Amount must be between ${min} and ${max} IQD`,
        'INVALID_AMOUNT',
        request.provider
      );
    }

    try {
      const response = await client.createPayment(request);
      this.log(`Payment created: ${response.transactionId}`);
      return response;
    } catch (error: any) {
      this.log(`Payment creation failed: ${error.message}`);
      throw new MesopotamiaError(
        error.message,
        'PAYMENT_FAILED',
        request.provider
      );
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(provider: PaymentProvider, transactionId: string): Promise<PaymentStatus> {
    this.log(`Getting payment status: ${transactionId}`);

    const client = this.clients.get(provider);
    if (!client) {
      throw new MesopotamiaError(
        `Provider not configured: ${provider}`,
        'PROVIDER_NOT_CONFIGURED',
        provider
      );
    }

    try {
      const status = await client.getPaymentStatus(transactionId);
      this.log(`Payment status: ${status}`);
      return status;
    } catch (error: any) {
      this.log(`Status check failed: ${error.message}`);
      throw new MesopotamiaError(
        error.message,
        'STATUS_CHECK_FAILED',
        provider
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(
    provider: PaymentProvider,
    signature: string,
    payload: string,
    timestamp?: number
  ): boolean {
    this.log(`Verifying webhook for ${provider}`);

    const client = this.clients.get(provider);
    if (!client) {
      throw new MesopotamiaError(
        `Provider not configured: ${provider}`,
        'PROVIDER_NOT_CONFIGURED',
        provider
      );
    }

    const providerConfig = this.config.providers[provider];
    if (!providerConfig) {
      throw new MesopotamiaError(
        `Provider not configured: ${provider}`,
        'PROVIDER_NOT_CONFIGURED',
        provider
      );
    }
    const secret = providerConfig.apiSecret;

    if (timestamp !== undefined) {
      const result = verifyWebhookWithTimestamp(signature, payload, secret, timestamp);
      if (!result.valid) {
        this.log(`Webhook verification failed: ${result.error}`);
        return false;
      }
      return true;
    }

    return client.verifyWebhook(signature, payload, secret);
  }

  /**
   * Refund a payment (FastPay only)
   */
  async refundPayment(
    transactionId: string,
    amount: number,
    reason?: string
  ): Promise<any> {
    this.log(`Refunding payment: ${transactionId}`);

    const client = this.clients.get(PaymentProvider.FASTPAY);
    if (!client || !(client instanceof FastPayClient)) {
      throw new MesopotamiaError(
        'Refunds are only supported for FastPay',
        'NOT_SUPPORTED',
        PaymentProvider.FASTPAY
      );
    }

    try {
      const result = await client.refund(transactionId, amount, reason);
      this.log(`Refund created: ${result.refund_id}`);
      return result;
    } catch (error: any) {
      this.log(`Refund failed: ${error.message}`);
      throw new MesopotamiaError(
        error.message,
        'REFUND_FAILED',
        PaymentProvider.FASTPAY
      );
    }
  }

  /**
   * Get SDK version
   */
  static get version(): string {
    return '0.1.0';
  }
}

// Re-exports
export * from './crypto';
export * from './client';
export * from './gateways';
export * from './middleware';

// Default export
export default MesopotamiaSDK;
