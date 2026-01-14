# Security Best Practices

Follow these guidelines when deploying MesoPay SDK in production.

## Secrets Management

### Never Hardcode Secrets

❌ **Don't do this:**
```typescript
const sdk = new MesopotamiaSDK({
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      apiSecret: 'sk_live_abc123', // NEVER hardcode!
    },
  },
});
```

✅ **Do this instead:**
```typescript
const sdk = new MesopotamiaSDK({
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      apiSecret: process.env.ZAINCASH_API_SECRET!,
    },
  },
});
```

### Use a Secrets Manager

For production, consider:
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Google Secret Manager**
- **Azure Key Vault**

---

## Webhook Security

### Always Verify Signatures

Every webhook request must be verified before processing:

```typescript
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-mesopotamia-signature'];
  const timestamp = req.headers['x-mesopotamia-timestamp'];
  
  // Verify the signature
  const isValid = sdk.verifyWebhook(
    PaymentProvider.ZAIN_CASH,
    signature,
    req.rawBody,
    parseInt(timestamp)
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process the webhook...
});
```

### Prevent Replay Attacks

Check the timestamp to prevent replay attacks:

```typescript
const timestamp = parseInt(req.headers['x-mesopotamia-timestamp']);
const now = Math.floor(Date.now() / 1000);
const tolerance = 300; // 5 minutes

if (Math.abs(now - timestamp) > tolerance) {
  return res.status(401).json({ error: 'Request expired' });
}
```

### Use HTTPS

Always serve webhooks over HTTPS. Never accept webhook requests over plain HTTP in production.

---

## Amount Validation

### Server-Side Validation

Always validate amounts on your backend, never trust client input:

```typescript
function validateAmount(provider: PaymentProvider, amount: number): boolean {
  const ranges: Record<PaymentProvider, [number, number]> = {
    [PaymentProvider.ZAIN_CASH]: [1000, 5000000],
    [PaymentProvider.FAST_PAY]: [500, 10000000],
    [PaymentProvider.FIB]: [1000, 100000000],
  };
  
  const [min, max] = ranges[provider];
  return amount >= min && amount <= max;
}
```

---

## Idempotency

### Use Unique Order IDs

Generate cryptographically secure order IDs:

```typescript
import { randomBytes } from 'crypto';

function generateOrderId(): string {
  return `order_${randomBytes(16).toString('hex')}`;
}
```

### Store Transaction Mapping

Keep a mapping of your order IDs to gateway transaction IDs:

```typescript
// After successful payment creation
await db.transactions.create({
  orderId: request.orderId,
  transactionId: response.transactionId,
  provider: request.provider,
  amount: request.amount,
  status: 'pending',
  createdAt: new Date(),
});
```

---

## Network Security

### Timeout Configuration

Set appropriate timeouts to prevent hanging requests:

```typescript
const sdk = new MesopotamiaSDK({
  timeoutMs: 30000, // 30 seconds
  // ...
});
```

### Rate Limiting

Implement rate limiting on your payment endpoints:

```typescript
import rateLimit from 'express-rate-limit';

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many payment requests',
});

app.post('/api/payments', paymentLimiter, createPayment);
```

---

## Logging

### Log Safely

Never log sensitive data:

```typescript
// ❌ Don't log secrets
console.log('Config:', sdk.config);

// ✅ Log safely
console.log('Payment created:', {
  transactionId: payment.transactionId,
  amount: payment.amount,
  provider: payment.provider,
});
```

### Audit Trail

Maintain an audit log of all payment operations:

```typescript
await auditLog.create({
  action: 'payment_created',
  orderId: request.orderId,
  amount: request.amount,
  provider: request.provider,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
});
```

---

## Environment Separation

### Separate Credentials

Use different credentials for sandbox and production:

```typescript
const config = {
  environment: process.env.NODE_ENV === 'production' 
    ? Environment.PRODUCTION 
    : Environment.SANDBOX,
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: process.env.NODE_ENV === 'production'
        ? process.env.ZAINCASH_PROD_MERCHANT_ID
        : process.env.ZAINCASH_SANDBOX_MERCHANT_ID,
      // ...
    },
  },
};
```

---

## Checklist

Before going live:

- [ ] All secrets stored in environment variables or secrets manager
- [ ] Webhook signature verification implemented
- [ ] Replay attack prevention in place
- [ ] HTTPS enforced on all endpoints
- [ ] Amount validation on backend
- [ ] Idempotency keys for all payments
- [ ] Appropriate timeouts configured
- [ ] Rate limiting implemented
- [ ] Sensitive data excluded from logs
- [ ] Audit logging enabled
- [ ] Production credentials separate from sandbox
- [ ] Error handling doesn't expose internals
