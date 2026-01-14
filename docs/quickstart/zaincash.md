# ZainCash Integration Guide

Complete guide for integrating ZainCash payments with MesoPay SDK.

## Overview

**ZainCash** is Iraq's leading mobile wallet with millions of users. It's ideal for:
- Consumer-facing payments
- Mobile app payments (deep linking)
- E-commerce checkout

## Configuration

### Amount Range
- **Minimum:** 1,000 IQD
- **Maximum:** 5,000,000 IQD

### Authentication
ZainCash uses **JWT (HS256)** authentication. You'll need:

| Credential | Description |
|------------|-------------|
| `merchantId` | Your ZainCash merchant ID |
| `apiKey` | API key (also called MSISDN) |
| `apiSecret` | Secret for JWT signing |

### Setup

```typescript
import { MesopotamiaSDK, PaymentProvider, Environment } from 'mesopotamia-sdk';

const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX, // or PRODUCTION
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: process.env.ZAINCASH_MERCHANT_ID!,
      apiKey: process.env.ZAINCASH_API_KEY!,
      apiSecret: process.env.ZAINCASH_API_SECRET!,
    },
  },
});
```

---

## Create Payment

```typescript
const payment = await sdk.createPayment({
  provider: PaymentProvider.ZAIN_CASH,
  amount: 25000, // 25,000 IQD
  orderId: 'ORDER_123',
  callbackUrl: 'https://yourapp.com/payment/callback',
  webhookUrl: 'https://yourapp.com/api/webhooks/zaincash',
  description: 'Premium subscription',
});

// Redirect user to ZainCash
res.redirect(payment.redirectUrl);

// For mobile apps, use deep link
if (payment.deepLink) {
  // Open ZainCash app
  openDeepLink(payment.deepLink);
}
```

---

## Payment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Your App   │────▶│  MesoPay    │────▶│  ZainCash   │
│             │     │    SDK      │     │   Gateway   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       ▼
       │                              ┌─────────────┐
       │                              │  ZainCash   │
       │                              │    Wallet   │
       │                              └─────────────┘
       │                                       │
       │◀──────────── Callback ────────────────┘
       │◀──────────── Webhook  ────────────────┘
```

1. User initiates payment in your app
2. SDK creates transaction with ZainCash
3. User redirected to ZainCash (or app via deep link)
4. User authorizes payment in wallet
5. Callback redirects user back to your app
6. Webhook notifies your server of payment status

---

## Handle Callback

When the user completes (or cancels) payment, ZainCash redirects to your `callbackUrl`:

```typescript
app.get('/payment/callback', (req, res) => {
  const { token, status } = req.query;
  
  // Verify the transaction
  const paymentStatus = await sdk.getPaymentStatus(
    PaymentProvider.ZAIN_CASH,
    token as string
  );
  
  if (paymentStatus === PaymentStatus.COMPLETED) {
    // Show success page
    res.redirect('/order/success');
  } else {
    // Show failure page
    res.redirect('/order/failed');
  }
});
```

---

## Webhook Events

ZainCash sends webhooks for payment status changes:

```typescript
app.post('/api/webhooks/zaincash', express.raw({ type: '*/*' }), (req, res) => {
  const signature = req.headers['x-mesopotamia-signature'] as string;
  const timestamp = req.headers['x-mesopotamia-timestamp'] as string;
  
  // Verify signature
  const isValid = sdk.verifyWebhook(
    PaymentProvider.ZAIN_CASH,
    signature,
    req.body.toString(),
    parseInt(timestamp)
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = JSON.parse(req.body.toString());
  
  switch (event.status) {
    case 'completed':
      await fulfillOrder(event.orderId);
      break;
    case 'failed':
      await cancelOrder(event.orderId);
      break;
  }
  
  res.json({ received: true });
});
```

---

## Mobile Deep Linking

For Flutter apps, use the deep link for a better UX:

```dart
final payment = await sdk.createPayment(
  provider: PaymentProvider.zainCash,
  amount: 25000,
  orderId: 'ORDER_123',
);

if (payment.deepLink != null) {
  // Try to open ZainCash app
  final launched = await launchUrl(Uri.parse(payment.deepLink!));
  
  if (!launched) {
    // Fall back to web
    launchUrl(Uri.parse(payment.redirectUrl));
  }
}
```

---

## Testing

### Sandbox Credentials

Contact ZainCash for sandbox credentials. Test transactions don't process real money.

### Test Card Numbers

ZainCash sandbox uses test wallet numbers provided by ZainCash support.

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_MERCHANT` | Wrong merchant ID | Check credentials |
| `AMOUNT_OUT_OF_RANGE` | Amount < 1,000 or > 5,000,000 | Validate before sending |
| `EXPIRED_TOKEN` | Transaction timeout | Create new transaction |
| `USER_CANCELLED` | User cancelled payment | Show retry option |

---

## Best Practices

1. **Store transaction IDs** - Keep a mapping of orderId → transactionId
2. **Handle timeouts** - ZainCash transactions expire after 15 minutes
3. **Use webhooks** - Don't rely solely on callbacks
4. **Validate amounts** - Always validate on server side
5. **Deep links** - Prefer deep links for mobile apps
