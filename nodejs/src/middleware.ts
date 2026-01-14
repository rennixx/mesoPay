/**
 * Express middleware for webhook handling
 * Provides automatic signature verification for all payment providers
 */

import { Request, Response, NextFunction } from 'express';
import { MesopotamiaSDK, PaymentProvider } from './index';
import { verifyWebhookWithTimestamp } from './crypto';

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  transaction_id: string;
  payment_id?: string;
  status: string;
  amount?: number;
  order_id?: string;
  timestamp?: number;
  provider?: PaymentProvider;
  [key: string]: any;
}

/**
 * Webhook middleware options
 */
export interface WebhookMiddlewareOptions {
  /**
   * The SDK instance for provider configuration
   */
  sdk: MesopotamiaSDK;

  /**
   * Payment provider for this webhook endpoint
   */
  provider: PaymentProvider;

  /**
   * Secret for signature verification
   * If not provided, uses the SDK's configured secret
   */
  secret?: string;

  /**
   * Function to call when payment is successful
   */
  onPaymentSuccess: (payload: WebhookPayload) => void | Promise<void>;

  /**
   * Function to call when payment fails
   */
  onPaymentFailure?: (payload: WebhookPayload) => void | Promise<void>;

  /**
   * Raw body parser function (needed for signature verification)
   */
  rawBodyParser?: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * Parse raw body for signature verification
 */
export function rawBodyParser(req: Request, res: Response, next: NextFunction): void {
  const data: Buffer[] = [];

  req.on('data', (chunk: Buffer) => {
    data.push(chunk);
  });

  req.on('end', () => {
    req.rawBody = Buffer.concat(data);
    next();
  });
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
      webhookPayload?: WebhookPayload;
    }
  }
}

/**
 * Express middleware for handling payment webhooks
 * Verifies signatures and calls appropriate handlers
 */
export function webhookMiddleware(options: WebhookMiddlewareOptions) {
  const { sdk, provider, secret, onPaymentSuccess, onPaymentFailure } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get signature from headers
      const signature = req.headers['x-mesopotamia-signature'] as string ||
        req.headers['x-signature'] as string ||
        req.headers['signature'] as string;

      if (!signature) {
        return res.status(401).json({
          error: 'MISSING_SIGNATURE',
          message: 'Missing signature header',
        });
      }

      // Get timestamp from headers
      const timestampHeader = req.headers['x-mesopotamia-timestamp'] as string ||
        req.headers['x-timestamp'] as string;
      const timestamp = timestampHeader ? parseInt(timestampHeader, 10) : undefined;

      // Get raw body for signature verification
      const rawBody = req.rawBody || req.body;

      if (!rawBody) {
        return res.status(400).json({
          error: 'MISSING_BODY',
          message: 'Missing request body',
        });
      }

      // Verify signature
      const providerConfig = sdk['config'].providers[provider];
      const webhookSecret = secret || providerConfig?.apiSecret;
      if (!webhookSecret) {
        return res.status(500).json({
          error: 'MISSING_SECRET',
          message: 'Webhook secret not configured',
        });
      }
      const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

      const isValid = timestamp !== undefined
        ? verifyWebhookWithTimestamp(signature, payload, webhookSecret, timestamp).valid
        : sdk.verifyWebhook(provider, signature, payload);

      if (!isValid) {
        return res.status(401).json({
          error: 'INVALID_SIGNATURE',
          message: 'Signature verification failed',
        });
      }

      // Parse webhook payload
      let webhookPayload: WebhookPayload;

      if (typeof rawBody === 'string') {
        try {
          webhookPayload = JSON.parse(rawBody);
        } catch {
          webhookPayload = {
            transaction_id: '',
            status: 'unknown',
            ...req.body,
          };
        }
      } else {
        webhookPayload = rawBody as any;
      }

      // Add provider to payload if not present
      if (!webhookPayload.provider) {
        webhookPayload.provider = provider;
      }

      // Store parsed payload for use in route handlers
      req.webhookPayload = webhookPayload;

      // Handle based on status
      const status = webhookPayload.status?.toLowerCase();

      if (status === 'completed' || status === 'success' || status === 'paid') {
        await onPaymentSuccess(webhookPayload);
      } else if (onPaymentFailure && (status === 'failed' || status === 'error')) {
        await onPaymentFailure(webhookPayload);
      }

      // Send success response
      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });

    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        error: 'WEBHOOK_ERROR',
        message: error.message,
      });
    }
  };
}

/**
 * Factory for creating provider-specific webhook routes
 */
export class WebhookRouter {
  private sdk: MesopotamiaSDK;
  private handlers: Map<PaymentProvider, WebhookMiddlewareOptions>;

  constructor(sdk: MesopotamiaSDK) {
    this.sdk = sdk;
    this.handlers = new Map();
  }

  /**
   * Register a webhook handler for a provider
   */
  register(options: WebhookMiddlewareOptions): void {
    this.handlers.set(options.provider, options);
  }

  /**
   * Get middleware for a provider
   */
  getMiddleware(provider: PaymentProvider) {
    const options = this.handlers.get(provider);
    if (!options) {
      throw new Error(`No webhook handler registered for ${provider}`);
    }
    return webhookMiddleware(options);
  }

  /**
   * Create Express router with all webhook endpoints
   */
  createRouter() {
    const express = require('express');
    const router = express.Router();

    // Add raw body parser
    router.use(rawBodyParser);

    // Add webhook endpoint for each registered provider
    for (const [provider, options] of this.handlers.entries()) {
      const path = `/${provider}`;
      router.post(path, webhookMiddleware(options));
    }

    // Add health check endpoint
    router.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        providers: Array.from(this.handlers.keys()),
      });
    });

    return router;
  }
}

export default webhookMiddleware;
