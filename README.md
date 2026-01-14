# Mesopotamia SDK

[![CI](https://github.com/yourusername/mesopotamia-sdk/workflows/CI/badge.svg)](https://github.com/yourusername/mesopotamia-sdk/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Unified Iraqi Payment Infrastructure SDK**

A single, enterprise-grade integration point for all major Iraqi payment gateways (ZainCash, FastPay, FIB), eliminating fragmented implementations and establishing a foundation for Iraq's digital payment ecosystem.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Developer Applications             │
│  (Flutter Apps, Node.js Servers, Web Apps)         │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐         ┌────▼─────┐
    │ Flutter │         │ Node.js  │
    │ Package │         │  Package │
    └────┬────┘         └────┬─────┘
         │                   │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │   FFI / Wasm      │  ◄── Bridge Layer
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │  Mesopotamia Core │  ◄── Security Brain
         │      (Rust)       │
         └─────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌─────▼─────┐   ┌───▼───┐
│ZainCash│    │  FastPay  │   │  FIB  │
└────────┘    └───────────┘   └───────┘
```

## 🚀 Features

- ✅ **Unified API**: Single interface for ZainCash, FastPay, and FIB
- ✅ **Multi-Platform**: Flutter (iOS/Android/Web), Node.js, WebAssembly
- ✅ **Secure**: Rust core with memory-safe cryptographic operations
- ✅ **Developer-Friendly**: <2 hours integration time
- ✅ **Localized**: English, Arabic, and Kurdish support

## 📦 Supported Gateways

| Gateway | Authentication | Amount Range (IQD) |
|---------|---------------|-------------------|
| ZainCash | JWT (HS256) | 1,000 - 5,000,000 |
| FastPay | Basic Auth | 500 - 10,000,000 |
| FIB | OAuth2 Bearer | 1,000 - 100,000,000 |

## 🛠️ Installation

### Flutter

```yaml
dependencies:
  mesopotamia_sdk: ^1.0.0
```

### Node.js

```bash
npm install mesopotamia-sdk
```

## 📖 Quick Start

### Flutter

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

### Node.js

```javascript
const { MesopotamiaSDK, PaymentProvider } = require('mesopotamia-sdk');

const sdk = new MesopotamiaSDK({
  environment: 'sandbox',
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: process.env.ZAINCASH_MERCHANT_ID,
      apiKey: process.env.ZAINCASH_API_KEY,
      apiSecret: process.env.ZAINCASH_API_SECRET,
    },
  },
});

const payment = await sdk.createPayment({
  provider: PaymentProvider.ZAIN_CASH,
  amount: 50000,
  orderId: 'ORDER_123',
  callbackUrl: 'https://yourapp.com/callback',
  webhookUrl: 'https://yourapp.com/webhook',
});
```

## 🧪 Development

### Prerequisites

- Rust 1.70+
- Go 1.21+ (for mock gateway)
- Flutter 3.10+
- Node.js 16+

### Running the Mock Gateway

```bash
cd mock-gateway
go run .
```

### Building the Core

```bash
cd core
cargo build --release
```

### Running Tests

```bash
# Core tests
cd core && cargo test

# Mock gateway
cd mock-gateway && go test ./...
```

## 📁 Project Structure

```
mesopotamia-sdk/
├── core/               # Rust core library
├── flutter/            # Flutter package
├── nodejs/             # Node.js package
├── mock-gateway/       # Test server (Go)
├── docs/               # Documentation
└── .github/workflows/  # CI/CD
```

## 🔐 Security

- All secrets are zeroed from memory after use
- TLS 1.2+ enforced in production
- HMAC-SHA256 webhook signature verification
- No PII logging

Report security issues to: security@mesopotamia.dev

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

Built with ❤️ for Iraqi developers
