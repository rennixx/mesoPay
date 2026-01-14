/**
 * Tests for Mesopotamia SDK
 */

import {
  MesopotamiaSDK,
  PaymentProvider,
  Environment,
  PaymentStatus,
  MesopotamiaError,
  generateHmacSha256,
  verifyWebhookSignature,
} from './index';

describe('MesopotamiaSDK', () => {
  describe('SDK Initialization', () => {
    test('should initialize with sandbox environment', () => {
      const sdk = new MesopotamiaSDK({
        environment: Environment.SANDBOX,
        providers: {
          [PaymentProvider.ZAIN_CASH]: {
            merchantId: 'test_merchant',
            apiKey: 'test_key',
            apiSecret: 'test_secret',
          },
        },
      });

      expect(sdk).toBeDefined();
    });

    test('should accept multiple providers', () => {
      const sdk = new MesopotamiaSDK({
        environment: Environment.SANDBOX,
        providers: {
          [PaymentProvider.ZAIN_CASH]: {
            merchantId: 'zain_merchant',
            apiKey: 'zain_key',
            apiSecret: 'zain_secret',
          },
          [PaymentProvider.FASTPAY]: {
            merchantId: 'fast_merchant',
            apiKey: 'fast_key',
            apiSecret: 'fast_secret',
          },
          [PaymentProvider.FIB]: {
            merchantId: 'fib_merchant',
            apiKey: 'fib_key',
            apiSecret: 'fib_secret',
          },
        },
      });

      expect(sdk).toBeDefined();
    });
  });

  describe('PaymentProvider Enum', () => {
    test('should have correct values', () => {
      expect(PaymentProvider.ZAIN_CASH).toBe('zaincash');
      expect(PaymentProvider.FASTPAY).toBe('fastpay');
      expect(PaymentProvider.FIB).toBe('fib');
    });
  });

  describe('Environment Enum', () => {
    test('should have correct values', () => {
      expect(Environment.SANDBOX).toBe('sandbox');
      expect(Environment.PRODUCTION).toBe('production');
    });
  });

  describe('MesopotamiaError', () => {
    test('should create error with message', () => {
      const error = new MesopotamiaError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('MesopotamiaError');
    });

    test('should create error with code and provider', () => {
      const error = new MesopotamiaError(
        'Invalid credentials',
        'INVALID_CREDENTIALS',
        PaymentProvider.FASTPAY,
      );

      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.provider).toBe(PaymentProvider.FASTPAY);
    });
  });
});

describe('Crypto Utils', () => {
  describe('generateHmacSha256', () => {
    test('should generate consistent signatures', () => {
      const secret = 'test_secret';
      const payload = 'test_payload';

      const sig1 = generateHmacSha256(secret, payload);
      const sig2 = generateHmacSha256(secret, payload);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should generate different signatures for different inputs', () => {
      const secret = 'test_secret';
      const payload1 = 'payload_1';
      const payload2 = 'payload_2';

      const sig1 = generateHmacSha256(secret, payload1);
      const sig2 = generateHmacSha256(secret, payload2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyWebhookSignature', () => {
    test('should verify valid signature', () => {
      const secret = 'webhook_secret';
      const payload = '{"transaction_id":"tx_123","status":"completed"}';

      const validSig = generateHmacSha256(secret, payload);
      const result = verifyWebhookSignature(
        `sha256=${validSig}`,
        payload,
        secret,
      );

      expect(result).toBe(true);
    });

    test('should reject invalid signature', () => {
      const secret = 'webhook_secret';
      const payload = '{"transaction_id":"tx_123","status":"completed"}';

      const result = verifyWebhookSignature('sha256=invalid', payload, secret);
      expect(result).toBe(false);
    });

    test('should reject signature with wrong secret', () => {
      const secret = 'webhook_secret';
      const payload = '{"transaction_id":"tx_123","status":"completed"}';

      const validSig = generateHmacSha256(secret, payload);
      const result = verifyWebhookSignature(
        `sha256=${validSig}`,
        payload,
        'wrong_secret',
      );

      expect(result).toBe(false);
    });
  });
});
