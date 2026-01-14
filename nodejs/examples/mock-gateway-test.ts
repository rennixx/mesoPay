/**
 * Example demonstrating the SDK with the mock gateway
 * Run this after starting the mock gateway: cd mock-gateway && go run main.go
 */

import { MesopotamiaSDK, PaymentProvider, Environment } from '../src';

async function testWithMockGateway() {
  console.log('=== Testing Mesopotamia SDK with Mock Gateway ===\n');

  // Initialize SDK with mock gateway credentials
  const sdk = new MesopotamiaSDK({
    environment: Environment.SANDBOX,
    enableLogging: true,
    providers: {
      [PaymentProvider.ZAIN_CASH]: {
        merchantId: '5c9c8c7e-f3f1-4f3e-9e3e-3e9f3e9f3e9f',
        apiKey: 'test-api-key',
        apiSecret: 'test-secret',
        baseUrl: 'http://localhost:8080/zaincash',
      },
      [PaymentProvider.FASTPAY]: {
        merchantId: 'store123',
        apiKey: 'store123',
        apiSecret: 'pass123',
        baseUrl: 'http://localhost:8080/fastpay',
      },
      [PaymentProvider.FIB]: {
        merchantId: 'client123',
        apiKey: 'client123',
        apiSecret: 'secret123',
        baseUrl: 'http://localhost:8080/fib',
      },
    },
  });

  // Test 1: Create FastPay payment
  console.log('1. Testing FastPay payment creation...');
  try {
    const fastpayPayment = await sdk.createPayment({
      provider: PaymentProvider.FASTPAY,
      amount: 50000,
      orderId: 'TEST-' + Date.now(),
      callbackUrl: 'http://example.com/callback',
      webhookUrl: 'http://example.com/webhook',
    });

    console.log('✓ FastPay payment created');
    console.log(`  Transaction ID: ${fastpayPayment.transactionId}`);
    console.log(`  Redirect URL: ${fastpayPayment.redirectUrl}`);
    console.log(`  Status: ${fastpayPayment.status}\n`);

    // Test status check
    console.log('2. Testing payment status check...');
    const status = await sdk.getPaymentStatus(
      PaymentProvider.FASTPAY,
      fastpayPayment.transactionId
    );
    console.log(`✓ Payment status: ${status}\n`);
  } catch (error: any) {
    console.error(`✗ FastPay test failed: ${error.message}\n`);
  }

  // Test 2: Create ZainCash payment
  console.log('3. Testing ZainCash payment creation...');
  try {
    const zaincashPayment = await sdk.createPayment({
      provider: PaymentProvider.ZAIN_CASH,
      amount: 25000,
      orderId: 'ZC-TEST-' + Date.now(),
      callbackUrl: 'http://example.com/callback',
      webhookUrl: 'http://example.com/webhook',
    });

    console.log('✓ ZainCash payment created');
    console.log(`  Transaction ID: ${zaincashPayment.transactionId}`);
    console.log(`  Redirect URL: ${zaincashPayment.redirectUrl}\n`);
  } catch (error: any) {
    console.error(`✗ ZainCash test failed: ${error.message}\n`);
  }

  // Test 3: Create FIB payment
  console.log('4. Testing FIB payment creation...');
  try {
    const fibPayment = await sdk.createPayment({
      provider: PaymentProvider.FIB,
      amount: 100000,
      orderId: 'FIB-TEST-' + Date.now(),
      callbackUrl: 'http://example.com/callback',
      webhookUrl: 'http://example.com/webhook',
    });

    console.log('✓ FIB payment created');
    console.log(`  Transaction ID: ${fibPayment.transactionId}`);
    console.log(`  Redirect URL: ${fibPayment.redirectUrl}\n`);
  } catch (error: any) {
    console.error(`✗ FIB test failed: ${error.message}\n`);
  }

  // Test 4: Webhook signature verification
  console.log('5. Testing webhook signature verification...');
  const mockPayload = JSON.stringify({
    transaction_id: 'fp_test_123',
    status: 'completed',
    amount: 50000,
  });

  // This signature should match what the mock gateway generates
  const mockSignature = 'sha256=' + require('crypto')
    .createHmac('sha256', 'pass123')
    .update(mockPayload)
    .digest('hex');

  const isValid = sdk.verifyWebhook(
    PaymentProvider.FASTPAY,
    mockSignature,
    mockPayload
  );

  console.log(isValid ? '✓ Webhook signature valid' : '✗ Webhook signature invalid');
  console.log(`  Signature: ${mockSignature}\n`);

  // Test 5: Amount validation
  console.log('6. Testing amount validation...');
  try {
    await sdk.createPayment({
      provider: PaymentProvider.ZAIN_CASH,
      amount: 500, // Below minimum (1000)
      orderId: 'TEST-VALIDATION',
      callbackUrl: 'http://example.com/callback',
      webhookUrl: 'http://example.com/webhook',
    });
    console.log('✗ Amount validation should have failed\n');
  } catch (error: any) {
    console.log('✓ Amount validation working correctly');
    console.log(`  Error: ${error.message}\n`);
  }

  console.log('=== All tests completed ===');
}

// Run tests
testWithMockGateway().catch(console.error);
