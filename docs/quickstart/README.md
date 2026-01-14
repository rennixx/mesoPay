# MesoPay SDK - Quickstart Guide

Get started with MesoPay SDK in under 5 minutes. This guide covers installation and your first payment integration.

## Installation

### Node.js / TypeScript

```bash
npm install mesopotamia-sdk
# or
yarn add mesopotamia-sdk
```

### Flutter

```bash
flutter pub add mesopotamia_sdk
```

### Rust (as a dependency)

```toml
# Cargo.toml
[dependencies]
mesopotamia-core = "0.1"
```

---

## Basic Setup

### Node.js Example

```typescript
import { MesopotamiaSDK, PaymentProvider, Environment } from 'mesopotamia-sdk';

// Initialize the SDK
const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX, // Use PRODUCTION for live
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: process.env.ZAINCASH_MERCHANT_ID!,
      apiKey: process.env.ZAINCASH_API_KEY!,
      apiSecret: process.env.ZAINCASH_API_SECRET!,
    },
    // Add other providers as needed
  },
  enableLogging: true, // Optional: enable debug logs
});
```

### Flutter Example

```dart
import 'package:mesopotamia_sdk/mesopotamia_sdk.dart';

final sdk = MesopotamiaSDK(
  environment: Environment.sandbox,
  providers: {
    PaymentProvider.zainCash: ProviderConfig(
      merchantId: 'your_merchant_id',
      apiKey: 'your_api_key',
      apiSecret: 'your_api_secret',
    ),
  },
);
```

---

## Create a Payment

### Node.js

```typescript
const payment = await sdk.createPayment({
  provider: PaymentProvider.ZAIN_CASH,
  amount: 50000, // Amount in IQD (50,000 IQD)
  orderId: 'ORDER_123',
  callbackUrl: 'https://yourapp.com/callback',
  webhookUrl: 'https://yourapp.com/webhook',
  description: 'Order #123 - Electronics',
});

console.log('Redirect user to:', payment.redirectUrl);
console.log('Transaction ID:', payment.transactionId);
```

### Flutter (with UI)

```dart
final result = await sdk.presentPaymentSheet(
  context: context,
  amount: 50000,
  orderId: 'ORDER_123',
);

if (result.success) {
  print('Payment completed: ${result.transactionId}');
}
```

---

## Check Payment Status

```typescript
const status = await sdk.getPaymentStatus(
  PaymentProvider.ZAIN_CASH,
  'TRANSACTION_ID'
);

if (status === PaymentStatus.COMPLETED) {
  // Fulfill the order
}
```

---

## Handle Webhooks

```typescript
import express from 'express';
import { webhookMiddleware } from 'mesopotamia-sdk';

const app = express();

app.post('/webhook/zaincash', 
  webhookMiddleware({ sdk, provider: PaymentProvider.ZAIN_CASH }),
  (req, res) => {
    const event = req.body;
    
    switch (event.status) {
      case 'completed':
        // Fulfill order
        break;
      case 'failed':
        // Handle failure
        break;
    }
    
    res.json({ received: true });
  }
);
```

---

## Environment Variables

Create a `.env` file:

```env
# ZainCash
ZAINCASH_MERCHANT_ID=your_merchant_id
ZAINCASH_API_KEY=your_api_key
ZAINCASH_API_SECRET=your_api_secret

# FastPay
FASTPAY_MERCHANT_ID=your_merchant_id
FASTPAY_USERNAME=your_username
FASTPAY_PASSWORD=your_password

# FIB
FIB_CLIENT_ID=your_client_id
FIB_CLIENT_SECRET=your_client_secret
```

---

## Next Steps

- [API Reference](../api-reference/nodejs.md) - Full SDK documentation
- [ZainCash Guide](./zaincash.md) - ZainCash-specific integration
- [FastPay Guide](./fastpay.md) - FastPay-specific integration
- [FIB Guide](./fib.md) - FIB-specific integration
- [Security Best Practices](../security/best-practices.md) - Production security
