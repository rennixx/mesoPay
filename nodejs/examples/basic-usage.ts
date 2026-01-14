/**
 * Basic usage example for Mesopotamia SDK
 * Demonstrates payment creation, status checking, and webhook handling
 */

import { MesopotamiaSDK, PaymentProvider, Environment } from '../src';
import express from 'express';
import { webhookMiddleware, WebhookRouter } from '../src/middleware';

// Initialize SDK
const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX,
  enableLogging: true,
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: 'your-zaincash-merchant-id',
      apiKey: 'your-api-key',
      apiSecret: 'your-secret',
    },
    [PaymentProvider.FASTPAY]: {
      merchantId: 'store123',
      apiKey: 'store123',
      apiSecret: 'pass123',
    },
    [PaymentProvider.FIB]: {
      merchantId: 'client123',
      apiKey: 'client123',
      apiSecret: 'secret123',
    },
  },
});

// Example 1: Create a payment
async function createPaymentExample() {
  try {
    const payment = await sdk.createPayment({
      provider: PaymentProvider.FASTPAY,
      amount: 50000,
      orderId: 'ORDER-' + Date.now(),
      callbackUrl: 'https://example.com/callback',
      webhookUrl: 'https://example.com/webhook',
      description: 'Test payment',
    });

    console.log('Payment created successfully!');
    console.log('Transaction ID:', payment.transactionId);
    console.log('Redirect URL:', payment.redirectUrl);
    console.log('Deep Link:', payment.deepLink);

    return payment;
  } catch (error: any) {
    console.error('Payment creation failed:', error.message);
  }
}

// Example 2: Check payment status
async function checkStatusExample(transactionId: string) {
  try {
    const status = await sdk.getPaymentStatus(
      PaymentProvider.FASTPAY,
      transactionId
    );

    console.log('Payment status:', status);
  } catch (error: any) {
    console.error('Status check failed:', error.message);
  }
}

// Example 3: Refund a payment (FastPay only)
async function refundExample(transactionId: string) {
  try {
    const refund = await sdk.refundPayment(
      transactionId,
      50000,
      'Customer requested refund'
    );

    console.log('Refund created:', refund.refund_id);
  } catch (error: any) {
    console.error('Refund failed:', error.message);
  }
}

// Example 4: Setup Express server with webhooks
function setupWebhookServer() {
  const app = express();

  // Create webhook router
  const webhookRouter = new WebhookRouter(sdk);

  // Register webhook handlers for each provider
  webhookRouter.register({
    sdk,
    provider: PaymentProvider.ZAIN_CASH,
    onPaymentSuccess: async (payload) => {
      console.log('ZainCash payment successful!', payload);
      // Update your database, send email, etc.
    },
    onPaymentFailure: async (payload) => {
      console.log('ZainCash payment failed:', payload);
    },
  });

  webhookRouter.register({
    sdk,
    provider: PaymentProvider.FASTPAY,
    onPaymentSuccess: async (payload) => {
      console.log('FastPay payment successful!', payload);
    },
    onPaymentFailure: async (payload) => {
      console.log('FastPay payment failed:', payload);
    },
  });

  webhookRouter.register({
    sdk,
    provider: PaymentProvider.FIB,
    onPaymentSuccess: async (payload) => {
      console.log('FIB payment successful!', payload);
    },
    onPaymentFailure: async (payload) => {
      console.log('FIB payment failed:', payload);
    },
  });

  // Use webhook router
  app.use('/webhooks', webhookRouter.createRouter());

  // Payment creation endpoint
  app.post('/api/payment', async (req, res) => {
    try {
      const { provider, amount, orderId } = req.body;

      const payment = await sdk.createPayment({
        provider,
        amount,
        orderId,
        callbackUrl: 'https://example.com/callback',
        webhookUrl: 'https://example.com/webhook',
      });

      res.json({
        success: true,
        payment,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Status check endpoint
  app.get('/api/payment/:provider/:transactionId', async (req, res) => {
    try {
      const { provider, transactionId } = req.params;

      const status = await sdk.getPaymentStatus(
        provider as PaymentProvider,
        transactionId
      );

      res.json({
        success: true,
        status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Webhook endpoint: http://localhost:${PORT}/webhooks/<provider>`);
  });
}

// Example 5: Manual webhook verification
function manualWebhookVerificationExample() {
  const express = require('express');
  const app = express();

  // Parse raw body for signature verification
  app.use('/webhook/fastpay', (req: any, res: any, next: any) => {
    const data: Buffer[] = [];
    req.on('data', (chunk: Buffer) => data.push(chunk));
    req.on('end', () => {
      (req as any).rawBody = Buffer.concat(data);
      next();
    });
  });

  app.post('/webhook/fastpay', (req: any, res: any) => {
    const signature = req.headers['x-mesopotamia-signature'] as string;
    const timestamp = req.headers['x-mesopotamia-timestamp'] as string;
    const payload = (req as any).rawBody.toString();

    // Verify webhook
    const isValid = sdk.verifyWebhook(
      PaymentProvider.FASTPAY,
      signature,
      payload,
      timestamp ? parseInt(timestamp, 10) : undefined
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    const webhookData = JSON.parse(payload);
    console.log('Webhook received:', webhookData);

    res.json({ success: true });
  });

  app.listen(3001, () => {
    console.log('Manual webhook server running on port 3001');
  });
}

// Example 6: Using with TypeScript and async/await
class PaymentService {
  constructor(private sdk: MesopotamiaSDK) { }

  async processOrder(orderId: string, amount: number): Promise<string> {
    const payment = await this.sdk.createPayment({
      provider: PaymentProvider.ZAIN_CASH,
      amount,
      orderId,
      callbackUrl: `https://example.com/callback/${orderId}`,
      webhookUrl: `https://example.com/webhook`,
    });

    // Save payment to database
    // await this.db.payments.create({
    //   orderId,
    //   transactionId: payment.transactionId,
    //   status: 'pending',
    // });

    return payment.redirectUrl;
  }

  async handleWebhook(payload: any): Promise<void> {
    if (payload.status === 'completed') {
      // Update order in database
      // await this.db.orders.update({
      //   transactionId: payload.transaction_id,
      //   status: 'paid',
      // });
    }
  }
}

// Run examples
async function main() {
  console.log('=== Mesopotamia SDK Examples ===\n');

  // Example 1: Create payment
  console.log('1. Creating payment...');
  const payment = await createPaymentExample();

  if (payment) {
    // Example 2: Check status
    console.log('\n2. Checking payment status...');
    await checkStatusExample(payment.transactionId);

    // Example 3: Refund (uncomment to test)
    // console.log('\n3. Refunding payment...');
    // await refundExample(payment.transactionId);
  }

  // Example 4: Setup webhook server (commented out - runs indefinitely)
  // console.log('\n4. Starting webhook server...');
  // setupWebhookServer();
}

// Export for use in other files
export {
  createPaymentExample,
  checkStatusExample,
  refundExample,
  setupWebhookServer,
  manualWebhookVerificationExample,
  PaymentService,
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
