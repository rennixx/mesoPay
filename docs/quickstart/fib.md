# FIB (First Iraqi Bank) Integration Guide

Complete guide for integrating FIB payments with MesoPay SDK.

## Overview

**FIB (First Iraqi Bank)** provides enterprise-grade payment processing. Ideal for:
- High-value transactions
- Enterprise applications
- Banking integrations

## Configuration

### Amount Range
- **Minimum:** 1,000 IQD
- **Maximum:** 100,000,000 IQD (highest limit)

### Authentication
FIB uses **OAuth2 Bearer** token authentication:

| Credential | Description |
|------------|-------------|
| `merchantId` | Your FIB merchant ID |
| `apiKey` | OAuth2 client ID |
| `apiSecret` | OAuth2 client secret |

### Setup

```typescript
import { MesopotamiaSDK, PaymentProvider, Environment } from 'mesopotamia-sdk';

const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX,
  providers: {
    [PaymentProvider.FIB]: {
      merchantId: process.env.FIB_MERCHANT_ID!,
      apiKey: process.env.FIB_CLIENT_ID!,
      apiSecret: process.env.FIB_CLIENT_SECRET!,
    },
  },
});
```

---

## Create Payment

```typescript
const payment = await sdk.createPayment({
  provider: PaymentProvider.FIB,
  amount: 500000, // 500,000 IQD
  orderId: 'ORDER_789',
  callbackUrl: 'https://yourapp.com/payment/callback',
  webhookUrl: 'https://yourapp.com/api/webhooks/fib',
  description: 'Enterprise license - Annual',
  metadata: {
    customerId: 'CUST_123',
    invoiceNumber: 'INV-2024-001',
  },
});
```

---

## OAuth2 Flow

The SDK handles OAuth2 token management automatically:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Your App   │────▶│  MesoPay    │────▶│  FIB OAuth  │
│             │     │    SDK      │     │   Server    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │◀─── Token ────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  FIB API    │
                    │  (Bearer)   │
                    └─────────────┘
```

The SDK:
1. Requests access token using client credentials
2. Caches token until expiry
3. Automatically refreshes expired tokens
4. Retries failed requests with fresh token

---

## High-Value Transactions

FIB supports the highest transaction limits. For large amounts:

```typescript
// Enable additional verification for high-value transactions
const payment = await sdk.createPayment({
  provider: PaymentProvider.FIB,
  amount: 50000000, // 50 million IQD
  orderId: 'ENTERPRISE_ORDER_001',
  callbackUrl: 'https://yourapp.com/callback',
  webhookUrl: 'https://yourapp.com/webhook',
  metadata: {
    requiresVerification: 'true',
    companyName: 'Acme Corp',
    companyRegistration: 'IQ-12345',
  },
});
```

---

## Webhook Events

FIB webhooks include detailed transaction information:

```typescript
app.post('/api/webhooks/fib', express.raw({ type: '*/*' }), (req, res) => {
  const signature = req.headers['x-fib-signature'] as string;
  const timestamp = req.headers['x-fib-timestamp'] as string;
  
  const isValid = sdk.verifyWebhook(
    PaymentProvider.FIB,
    signature,
    req.body.toString(),
    parseInt(timestamp)
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = JSON.parse(req.body.toString());
  
  // FIB includes bank-specific fields
  console.log('Bank Reference:', event.bankReference);
  console.log('Processing Date:', event.processingDate);
  
  switch (event.status) {
    case 'APPROVED':
      await fulfillOrder(event.orderId);
      break;
    case 'DECLINED':
      await cancelOrder(event.orderId, event.declineReason);
      break;
  }
  
  res.json({ received: true });
});
```

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_CLIENT` | Wrong OAuth2 credentials | Check client ID/secret |
| `TOKEN_EXPIRED` | Token needs refresh | SDK handles automatically |
| `LIMIT_EXCEEDED` | Daily limit reached | Contact FIB support |
| `COMPLIANCE_HOLD` | Transaction under review | Wait for FIB approval |

---

## Best Practices

1. **Store bank references** - FIB provides unique bank references
2. **Handle compliance holds** - Large transactions may need review
3. **Use metadata** - Include business context for reconciliation
4. **Token caching** - SDK caches tokens, but consider persistence
5. **Enterprise support** - Contact FIB for higher limits

---

## Enterprise Features

FIB offers additional enterprise features:

- **Batch payments** - Process multiple payments in one request
- **Recurring billing** - Subscription payment support
- **Custom reporting** - Detailed transaction reports
- **Dedicated support** - Priority support channel

Contact FIB enterprise sales for these features.
