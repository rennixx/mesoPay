/**
 * Integration tests for Mesopotamia SDK Node.js
 * Run with: npm test
 * Requires mock gateway running on localhost:8080
 */

import { MesopotamiaSDK, PaymentProvider, Environment, MesopotamiaError } from '../src';
import { generateHmacSha256, generateJwtHs256, verifyWebhookSignature } from '../src/crypto';
import axios from 'axios';

const MOCK_GATEWAY_URL = 'http://localhost:8080';

describe('MesopotamiaSDK Integration Tests', () => {
  let sdk: MesopotamiaSDK;

  beforeAll(() => {
    sdk = new MesopotamiaSDK({
      environment: Environment.SANDBOX,
      enableLogging: false,
      providers: {
        [PaymentProvider.ZAIN_CASH]: {
          merchantId: '5c9c8c7e-f3f1-4f3e-9e3e-3e9f3e9f3e9f',
          apiKey: 'test-api-key',
          apiSecret: 'test-secret',
          baseUrl: `${MOCK_GATEWAY_URL}/zaincash`,
        },
        [PaymentProvider.FASTPAY]: {
          merchantId: 'store123',
          apiKey: 'store123',
          apiSecret: 'pass123',
          baseUrl: `${MOCK_GATEWAY_URL}/fastpay`,
        },
        [PaymentProvider.FIB]: {
          merchantId: 'client123',
          apiKey: 'client123',
          apiSecret: 'secret123',
          baseUrl: `${MOCK_GATEWAY_URL}/fib`,
        },
      },
    });
  });

  describe('SDK Initialization', () => {
    it('should initialize SDK with configuration', () => {
      expect(sdk).toBeInstanceOf(MesopotamiaSDK);
      expect(MesopotamiaSDK.version).toBe('0.1.0');
    });

    it('should throw error for unconfigured provider', async () => {
      const testSdk = new MesopotamiaSDK({
        environment: Environment.SANDBOX,
        providers: {},
      });

      await expect(testSdk.createPayment({
        provider: PaymentProvider.FASTPAY,
        amount: 50000,
        orderId: 'TEST',
        callbackUrl: 'http://example.com',
        webhookUrl: 'http://example.com',
      })).rejects.toThrow(MesopotamiaError);
    });
  });

  describe('FastPay Gateway', () => {
    it('should create a payment successfully', async () => {
      const payment = await sdk.createPayment({
        provider: PaymentProvider.FASTPAY,
        amount: 50000,
        orderId: `TEST-FP-${Date.now()}`,
        callbackUrl: 'http://example.com/callback',
        webhookUrl: 'http://example.com/webhook',
      });

      expect(payment).toBeDefined();
      expect(payment.transactionId).toMatch(/^fp_/);
      expect(payment.redirectUrl).toContain('http');
      expect(payment.status).toBeDefined();
      expect(payment.provider).toBe(PaymentProvider.FASTPAY);
    });

    it('should validate amount range', async () => {
      // Below minimum (500)
      await expect(sdk.createPayment({
        provider: PaymentProvider.FASTPAY,
        amount: 100,
        orderId: 'TEST-VALIDATION-1',
        callbackUrl: 'http://example.com',
        webhookUrl: 'http://example.com',
      })).rejects.toThrow('Amount must be between 500 and 10000000 IQD');

      // Above maximum (10M)
      await expect(sdk.createPayment({
        provider: PaymentProvider.FASTPAY,
        amount: 20000000,
        orderId: 'TEST-VALIDATION-2',
        callbackUrl: 'http://example.com',
        webhookUrl: 'http://example.com',
      })).rejects.toThrow('Amount must be between 500 and 10000000 IQD');
    });

    it('should get payment status', async () => {
      const payment = await sdk.createPayment({
        provider: PaymentProvider.FASTPAY,
        amount: 50000,
        orderId: `TEST-STATUS-${Date.now()}`,
        callbackUrl: 'http://example.com/callback',
        webhookUrl: 'http://example.com/webhook',
      });

      const status = await sdk.getPaymentStatus(
        PaymentProvider.FASTPAY,
        payment.transactionId
      );

      expect(status).toBeDefined();
    });
  });

  describe('ZainCash Gateway', () => {
    it('should create a payment successfully', async () => {
      const payment = await sdk.createPayment({
        provider: PaymentProvider.ZAIN_CASH,
        amount: 25000,
        orderId: `TEST-ZC-${Date.now()}`,
        callbackUrl: 'http://example.com/callback',
        webhookUrl: 'http://example.com/webhook',
      });

      expect(payment).toBeDefined();
      expect(payment.transactionId).toMatch(/^zc_/);
      expect(payment.provider).toBe(PaymentProvider.ZAIN_CASH);
    });

    it('should validate amount range', async () => {
      await expect(sdk.createPayment({
        provider: PaymentProvider.ZAIN_CASH,
        amount: 500,
        orderId: 'TEST-ZC-VALIDATION',
        callbackUrl: 'http://example.com',
        webhookUrl: 'http://example.com',
      })).rejects.toThrow('Amount must be between 1000 and 5000000 IQD');
    });
  });

  describe('FIB Gateway', () => {
    it('should create a payment successfully', async () => {
      const payment = await sdk.createPayment({
        provider: PaymentProvider.FIB,
        amount: 100000,
        orderId: `TEST-FIB-${Date.now()}`,
        callbackUrl: 'http://example.com/callback',
        webhookUrl: 'http://example.com/webhook',
      });

      expect(payment).toBeDefined();
      expect(payment.transactionId).toMatch(/^fib_/);
      expect(payment.provider).toBe(PaymentProvider.FIB);
    });

    it('should validate amount range', async () => {
      await expect(sdk.createPayment({
        provider: PaymentProvider.FIB,
        amount: 500,
        orderId: 'TEST-FIB-VALIDATION',
        callbackUrl: 'http://example.com',
        webhookUrl: 'http://example.com',
      })).rejects.toThrow('Amount must be between 1000 and 100000000 IQD');
    });
  });

  describe('Webhook Verification', () => {
    it('should verify FastPay webhook signature', () => {
      const payload = JSON.stringify({
        transaction_id: 'fp_test_123',
        status: 'completed',
        amount: 50000,
      });

      const secret = 'pass123';
      const signature = 'sha256=' + generateHmacSha256(secret, payload);

      const isValid = sdk.verifyWebhook(
        PaymentProvider.FASTPAY,
        signature,
        payload
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({
        transaction_id: 'fp_test_123',
        status: 'completed',
      });

      const isValid = sdk.verifyWebhook(
        PaymentProvider.FASTPAY,
        'sha256=invalid_signature',
        payload
      );

      expect(isValid).toBe(false);
    });

    it('should verify webhook with timestamp', () => {
      const payload = JSON.stringify({
        transaction_id: 'test',
        status: 'completed',
      });

      const timestamp = Math.floor(Date.now() / 1000);
      const secret = 'pass123';
      const payloadWithTs = payload + timestamp;
      const signature = 'sha256=' + generateHmacSha256(secret, payloadWithTs);

      const isValid = sdk.verifyWebhook(
        PaymentProvider.FASTPAY,
        signature,
        payload,
        timestamp
      );

      expect(isValid).toBe(true);
    });
  });

  describe('JWT Generation (ZainCash)', () => {
    it('should generate valid JWT token', () => {
      const token = generateJwtHs256(
        'merchant123',
        50000,
        'ORDER-001',
        'http://example.com/callback',
        'http://example.com/webhook',
        'test-secret'
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('Mock Gateway Integration', () => {
    it('should create payment via mock gateway', async () => {
      const response = await axios.post(
        `${MOCK_GATEWAY_URL}/fastpay/payment/init`,
        {
          amount: 50000,
          order_id: `MOCK-TEST-${Date.now()}`,
          callback_url: 'http://example.com/callback',
          webhook_url: 'http://example.com/webhook',
        },
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('store123:pass123').toString('base64'),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('payment_id');
      expect(response.data).toHaveProperty('redirect_url');
    });

    it('should simulate webhook via mock gateway', async () => {
      // First create a payment
      const paymentResponse = await axios.post(
        `${MOCK_GATEWAY_URL}/fastpay/payment/init`,
        {
          amount: 50000,
          order_id: `WEBHOOK-TEST-${Date.now()}`,
          callback_url: 'http://example.com/callback',
          webhook_url: 'http://example.com/webhook',
        },
        {
          headers: {
            'Authorization': 'Basic ' + Buffer.from('store123:pass123').toString('base64'),
          },
        }
      );

      // Then simulate webhook for that payment
      const webhookResponse = await axios.post(
        `${MOCK_GATEWAY_URL}/fastpay/webhook/simulate`,
        {
          payment_id: paymentResponse.data.payment_id,
          status: 'completed',
        }
      );

      expect(webhookResponse.status).toBe(200);
      expect(webhookResponse.data).toHaveProperty('X-Mesopotamia-Signature');
      expect(webhookResponse.data).toHaveProperty('payload');
    });

    it('should handle mock gateway health check', async () => {
      const response = await axios.get(`${MOCK_GATEWAY_URL}/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
    });
  });
});
