import 'package:flutter_test/flutter_test.dart';
import 'package:mesopotamia_sdk/mesopotamia_sdk.dart';

void main() {
  group('MesopotamiaSDK Tests', () {
    test('SDK initialization', () {
      final sdk = MesopotamiaSDK(
        environment: Environment.sandbox,
        providers: {
          PaymentProvider.zainCash: ProviderConfig(
            merchantId: 'test_merchant',
            apiKey: 'test_key',
            apiSecret: 'test_secret',
          ),
        },
      );

      expect(sdk.environment, Environment.sandbox);
      expect(sdk.providers.containsKey(PaymentProvider.zainCash), true);
    });

    test('PaymentRequest serialization', () {
      final request = PaymentRequest(
        provider: PaymentProvider.zainCash,
        amount: 50000,
        orderId: 'ORDER_123',
        callbackUrl: 'https://example.com/callback',
        webhookUrl: 'https://example.com/webhook',
      );

      final json = request.toJson();
      expect(json['amount'], 50000);
      expect(json['order_id'], 'ORDER_123');
    });

    test('PaymentResponse deserialization', () {
      final json = {
        'transaction_id': 'tx_123',
        'redirect_url': 'https://pay.example.com/tx_123',
        'status': 'pending',
        'provider': 'zaincash',
      };

      final response = PaymentResponse.fromJson(json);
      expect(response.transactionId, 'tx_123');
      expect(response.status, PaymentStatus.pending);
    });

    test('ProviderConfig serialization', () {
      final config = ProviderConfig(
        merchantId: 'merchant_123',
        apiKey: 'key_123',
        apiSecret: 'secret_123',
        baseUrl: 'https://custom.example.com',
      );

      final json = config.toJson();
      expect(json['merchant_id'], 'merchant_123');
      expect(json['base_url'], 'https://custom.example.com');
    });

    test('MesopotamiaError formatting', () {
      final error = MesopotamiaError(
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        provider: PaymentProvider.fastPay,
      );

      final str = error.toString();
      expect(str, contains('INVALID_CREDENTIALS'));
      expect(str, contains('fastPay'));
      expect(str, contains('Invalid credentials'));
    });
  });

  group('Enum Tests', () {
    test('PaymentProvider enum values', () {
      expect(PaymentProvider.values.length, 3);
      expect(PaymentProvider.zainCash.name, 'zainCash');
      expect(PaymentProvider.fastPay.name, 'fastPay');
      expect(PaymentProvider.fib.name, 'fib');
    });

    test('Environment enum values', () {
      expect(Environment.values.length, 2);
      expect(Environment.sandbox.name, 'sandbox');
      expect(Environment.production.name, 'production');
    });

    test('PaymentStatus enum values', () {
      expect(PaymentStatus.values.length, 5);
      expect(PaymentStatus.pending.name, 'pending');
      expect(PaymentStatus.completed.name, 'completed');
      expect(PaymentStatus.failed.name, 'failed');
    });
  });
}
