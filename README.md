# MesoPay SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Unified Iraqi Payment Infrastructure SDK**

A single, enterprise-grade integration point for all major Iraqi payment gateways (ZainCash, FastPay, FIB), eliminating fragmented implementations and establishing a foundation for Iraq's digital payment ecosystem.

## 🚀 Features

- ✅ **Unified API**: Single interface for ZainCash, FastPay, and FIB
- ✅ **Multi-Platform**: Flutter (iOS/Android), Node.js, Web Demo
- ✅ **Hosted Checkout**: Ready-to-use payment page with multi-merchant support
- ✅ **Card & Wallet**: Support for credit cards and mobile wallets
- ✅ **Developer-Friendly**: <2 hours integration time
- ✅ **Localized**: English, Arabic, and Kurdish support

## 📦 SDKs Available

| Platform | Package | Status |
|----------|---------|--------|
| **Flutter** | `mesopotamia_sdk` | ✅ Ready |
| **Node.js** | `mesopotamia-sdk` | ✅ Ready |
| **Hosted Checkout** | Web Demo | ✅ Ready |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Your Application                   │
│      (Flutter App, Node.js Server, Website)        │
└──────────────────────────┬──────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼────┐      ┌────▼────┐     ┌─────▼─────┐
     │ Flutter │      │ Node.js │     │  Hosted   │
     │   SDK   │      │   SDK   │     │ Checkout  │
     └────┬────┘      └────┬────┘     └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
 ┌───▼───┐           ┌─────▼─────┐          ┌───▼───┐
 │ZainCash│           │  FastPay  │          │  FIB  │
 └────────┘           └───────────┘          └───────┘
```

## 📖 Quick Start

### Option 1: Flutter SDK (Mobile Apps)

```yaml
# pubspec.yaml
dependencies:
  mesopotamia_sdk: ^1.0.0
```

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

// Show payment sheet
final result = await sdk.presentPaymentSheet(
  context: context,
  amount: 50000, // 50,000 IQD
  orderId: 'ORDER_123',
);
```

### Option 2: Node.js SDK (Server-Side)

```bash
npm install mesopotamia-sdk
```

```javascript
const { MesopotamiaSDK, PaymentProvider } = require('mesopotamia-sdk');

const sdk = new MesopotamiaSDK({
  environment: 'sandbox',
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: process.env.ZAINCASH_MERCHANT_ID,
      apiKey: process.env.ZAINCASH_API_KEY,
    },
  },
});

const payment = await sdk.createPayment({
  provider: PaymentProvider.ZAIN_CASH,
  amount: 50000,
  orderId: 'ORDER_123',
  callbackUrl: 'https://yourapp.com/callback',
});
```

### Option 3: Hosted Checkout (Websites)

Redirect customers to our hosted payment page - no frontend code needed!

#### Step 1: Create a Payment Session

```bash
curl -X POST https://pay.mesopay.io/api/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Coffee Paradise",
    "orderId": "ORD-2024-001",
    "amount": 25000,
    "currency": "IQD",
    "successUrl": "https://yourstore.com/order-complete",
    "cancelUrl": "https://yourstore.com/checkout"
  }'
```

#### Step 2: Redirect Customer

```json
{
  "success": true,
  "sessionId": "sess_abc123xyz",
  "paymentUrl": "https://pay.mesopay.io?session=sess_abc123xyz"
}
```

Redirect the customer to `paymentUrl`. They'll see a branded checkout with your store name and order details.

#### Step 3: Handle Callback

After payment, the customer is redirected to your `successUrl` or `cancelUrl`.

## 🔄 Payment Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your Store    │     │    MesoPay      │     │  Payment Gate   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. Create Session    │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │  2. Return paymentUrl │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │  3. Redirect Customer │                       │
         │                       │                       │
         │      ┌────────────────┴────────────────┐      │
         │      │  Customer sees branded checkout │      │
         │      │  - Card or Wallet payment       │      │
         │      └────────────────┬────────────────┘      │
         │                       │                       │
         │                       │  4. Process Payment   │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │  5. Payment Result    │
         │                       │<──────────────────────│
         │                       │                       │
         │  6. Redirect to       │                       │
         │     successUrl        │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │  7. Webhook (async)   │                       │
         │<──────────────────────│                       │
         │                       │                       │
```

## 💳 Supported Payment Methods

| Method | Provider | Status |
|--------|----------|--------|
| Mobile Wallet | FastPay | ✅ Ready |
| Mobile Wallet | FIB | ✅ Ready |
| Mobile Wallet | ZainCash | ✅ Ready |
| Credit Card | Visa | ✅ Ready |
| Credit Card | Mastercard | ✅ Ready |

## 🧪 Development

### Running the Web Demo Locally

```bash
cd nodejs/examples/web-demo
npm install
npx ts-node server.ts
```

Open http://localhost:3000

### Testing Payment Sessions

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/create-session" `
  -Method POST -ContentType "application/json" `
  -Body '{"storeName":"Test Store","orderId":"ORD-123","amount":25000}'
```

## 📁 Project Structure

```
mesopay-sdk/
├── flutter/            # Flutter SDK
│   ├── lib/            # SDK source code
│   └── example/        # Demo app
├── nodejs/             # Node.js SDK
│   ├── src/            # SDK source code
│   └── examples/
│       └── web-demo/   # Hosted checkout demo
├── website/            # Documentation site
├── docs/               # Markdown documentation
└── mock-gateway/       # Test server (Go)
```

## 🔐 Security

- TLS 1.2+ enforced in production
- HMAC-SHA256 webhook signature verification
- Sessions expire after 30 minutes
- No PII logging

Report security issues to: security@mesopay.io

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

Built with ❤️ for developers
