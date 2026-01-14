# Node.js SDK - API Reference

Complete API documentation for the MesoPay Node.js SDK.

## Table of Contents

- [MesopotamiaSDK](#mesopotamiasdk)
- [Enums](#enums)
- [Interfaces](#interfaces)
- [Error Handling](#error-handling)
- [Middleware](#middleware)

---

## MesopotamiaSDK

The main SDK class for interacting with Iraqi payment gateways.

### Constructor

```typescript
new MesopotamiaSDK(config: SdkConfig)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `config` | `SdkConfig` | SDK configuration object |

**Example:**

```typescript
const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX,
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: 'your_id',
      apiKey: 'your_key',
      apiSecret: 'your_secret',
    },
  },
  timeoutMs: 30000,
  enableLogging: false,
});
```

---

### Methods

#### `createPayment(request: PaymentRequest): Promise<PaymentResponse>`

Creates a new payment transaction.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `provider` | `PaymentProvider` | ✅ | Gateway to use |
| `amount` | `number` | ✅ | Amount in IQD |
| `orderId` | `string` | ✅ | Your unique order ID |
| `callbackUrl` | `string` | ✅ | URL for redirect after payment |
| `webhookUrl` | `string` | ✅ | URL for server notifications |
| `description` | `string` | ❌ | Payment description |
| `metadata` | `Record<string, string>` | ❌ | Custom metadata |

**Returns:** `Promise<PaymentResponse>`

| Field | Type | Description |
|-------|------|-------------|
| `transactionId` | `string` | Gateway transaction ID |
| `redirectUrl` | `string` | URL to redirect user |
| `deepLink` | `string?` | Mobile app deep link |
| `status` | `PaymentStatus` | Initial status |
| `provider` | `PaymentProvider` | Provider used |

**Example:**

```typescript
const payment = await sdk.createPayment({
  provider: PaymentProvider.ZAIN_CASH,
  amount: 50000,
  orderId: 'ORDER_123',
  callbackUrl: 'https://app.com/callback',
  webhookUrl: 'https://app.com/webhook',
});
```

---

#### `getPaymentStatus(provider: PaymentProvider, transactionId: string): Promise<PaymentStatus>`

Gets the current status of a payment.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `provider` | `PaymentProvider` | Gateway used |
| `transactionId` | `string` | Transaction ID |

**Returns:** `Promise<PaymentStatus>`

**Example:**

```typescript
const status = await sdk.getPaymentStatus(
  PaymentProvider.ZAIN_CASH,
  'txn_abc123'
);
```

---

#### `verifyWebhook(provider, signature, payload, timestamp?): boolean`

Verifies a webhook signature for authenticity.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `provider` | `PaymentProvider` | Gateway |
| `signature` | `string` | Signature from header |
| `payload` | `string` | Raw request body |
| `timestamp` | `number?` | Unix timestamp (optional) |

**Returns:** `boolean`

**Example:**

```typescript
const isValid = sdk.verifyWebhook(
  PaymentProvider.ZAIN_CASH,
  req.headers['x-mesopotamia-signature'],
  rawBody,
  parseInt(req.headers['x-mesopotamia-timestamp'])
);
```

---

#### `refundPayment(transactionId, amount, reason?): Promise<any>`

Refunds a payment (FastPay only).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `transactionId` | `string` | Original transaction ID |
| `amount` | `number` | Refund amount in IQD |
| `reason` | `string?` | Refund reason |

**Returns:** `Promise<RefundResponse>`

---

#### `version(): string`

Returns the SDK version.

---

## Enums

### PaymentProvider

```typescript
enum PaymentProvider {
  ZAIN_CASH = 'zaincash',
  FAST_PAY = 'fastpay',
  FIB = 'fib',
}
```

### Environment

```typescript
enum Environment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}
```

### PaymentStatus

```typescript
enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
```

---

## Interfaces

### SdkConfig

```typescript
interface SdkConfig {
  environment: Environment;
  providers: Partial<Record<PaymentProvider, ProviderConfig>>;
  timeoutMs?: number;      // Default: 30000
  enableLogging?: boolean; // Default: false
}
```

### ProviderConfig

```typescript
interface ProviderConfig {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl?: string; // Override default URL
}
```

### PaymentRequest

```typescript
interface PaymentRequest {
  provider: PaymentProvider;
  amount: number;
  orderId: string;
  callbackUrl: string;
  webhookUrl: string;
  description?: string;
  metadata?: Record<string, string>;
}
```

### PaymentResponse

```typescript
interface PaymentResponse {
  transactionId: string;
  redirectUrl: string;
  deepLink?: string;
  status: PaymentStatus;
  provider: PaymentProvider;
}
```

---

## Error Handling

### MesopotamiaError

All SDK errors extend `MesopotamiaError`.

```typescript
class MesopotamiaError extends Error {
  code?: string;
  provider?: PaymentProvider;
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `PROVIDER_NOT_CONFIGURED` | Provider not in config |
| `INVALID_AMOUNT` | Amount out of range |
| `INVALID_REQUEST` | Missing required fields |
| `NETWORK_ERROR` | HTTP request failed |
| `GATEWAY_ERROR` | Gateway returned error |
| `SIGNATURE_INVALID` | Webhook signature mismatch |

**Example:**

```typescript
try {
  await sdk.createPayment(request);
} catch (error) {
  if (error instanceof MesopotamiaError) {
    console.error(`Error [${error.code}]:`, error.message);
  }
}
```

---

## Middleware

### webhookMiddleware

Express middleware for webhook handling.

```typescript
import { webhookMiddleware } from 'mesopotamia-sdk';

app.post('/webhook/:provider', webhookMiddleware({
  sdk,
  provider: PaymentProvider.ZAIN_CASH,
  secret: 'optional_override',
}));
```

**Options:**

| Name | Type | Description |
|------|------|-------------|
| `sdk` | `MesopotamiaSDK` | SDK instance |
| `provider` | `PaymentProvider` | Gateway |
| `secret` | `string?` | Override webhook secret |
