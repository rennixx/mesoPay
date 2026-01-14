# FastPay Integration Guide

Complete guide for integrating FastPay payments with MesoPay SDK.

## Overview

**FastPay** is a reliable payment processor for Iraqi businesses. Ideal for:
- E-commerce platforms
- Web-based checkout
- Businesses needing refund support

## Configuration

### Amount Range
- **Minimum:** 500 IQD
- **Maximum:** 10,000,000 IQD

### Authentication
FastPay uses **Basic Auth** authentication:

| Credential | Description |
|------------|-------------|
| `merchantId` | Your FastPay merchant ID |
| `apiKey` | Username for Basic Auth |
| `apiSecret` | Password for Basic Auth |

### Setup

```typescript
import { MesopotamiaSDK, PaymentProvider, Environment } from 'mesopotamia-sdk';

const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX,
  providers: {
    [PaymentProvider.FAST_PAY]: {
      merchantId: process.env.FASTPAY_MERCHANT_ID!,
      apiKey: process.env.FASTPAY_USERNAME!,
      apiSecret: process.env.FASTPAY_PASSWORD!,
    },
  },
});
```

---

## Create Payment

```typescript
const payment = await sdk.createPayment({
  provider: PaymentProvider.FAST_PAY,
  amount: 75000, // 75,000 IQD
  orderId: 'ORDER_456',
  callbackUrl: 'https://yourapp.com/payment/callback',
  webhookUrl: 'https://yourapp.com/api/webhooks/fastpay',
  description: 'Order #456 - Electronics',
});

// Redirect user to FastPay checkout
res.redirect(payment.redirectUrl);
```

---

## Refunds

FastPay is the only gateway that supports programmatic refunds:

```typescript
try {
  const refund = await sdk.refundPayment(
    'ORIGINAL_TRANSACTION_ID',
    50000, // Partial refund: 50,000 IQD
    'Customer requested refund'
  );
  
  console.log('Refund ID:', refund.refundId);
  console.log('Status:', refund.status);
} catch (error) {
  if (error.code === 'REFUND_NOT_ALLOWED') {
    // Transaction not eligible for refund
  }
}
```

### Refund Rules

- Full refunds: Refund entire transaction amount
- Partial refunds: Refund any amount ≤ original amount
- Time limit: Refunds must be within 30 days
- One refund per transaction

---

## Webhook Events

FastPay webhooks include payment and refund events:

```typescript
app.post('/api/webhooks/fastpay', express.raw({ type: '*/*' }), (req, res) => {
  const signature = req.headers['x-fastpay-signature'] as string;
  
  const isValid = sdk.verifyWebhook(
    PaymentProvider.FAST_PAY,
    signature,
    req.body.toString()
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = JSON.parse(req.body.toString());
  
  switch (event.type) {
    case 'payment.completed':
      await fulfillOrder(event.orderId);
      break;
    case 'payment.failed':
      await cancelOrder(event.orderId);
      break;
    case 'refund.completed':
      await processRefund(event.refundId);
      break;
  }
  
  res.json({ received: true });
});
```

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `AUTH_FAILED` | Invalid credentials | Check username/password |
| `DUPLICATE_ORDER` | Order ID reused | Use unique order IDs |
| `REFUND_EXCEEDS_AMOUNT` | Refund > original | Check refund amount |
| `REFUND_NOT_ALLOWED` | Already refunded | Check transaction status |

---

## Best Practices

1. **Unique order IDs** - FastPay rejects duplicate order IDs
2. **Track refunds separately** - Store refund status with transactions
3. **Handle partial refunds** - Allow customers partial refunds
4. **Webhook reliability** - FastPay retries webhooks 3 times
