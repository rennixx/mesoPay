# Mesopotamia SDK: Unified Iraqi Payment Infrastructure
## Product Requirements Document v2.0

**Project Type:** Final Year Capstone Project  
**Document Status:** Master Blueprint  
**Last Updated:** January 2026

---

## Executive Summary

### Vision Statement
To provide Iraqi and Kurdish software developers with a single, enterprise-grade integration point for all major Iraqi payment gateways, eliminating fragmented implementations and establishing a foundation for Iraq's digital payment ecosystem.

### Problem Statement
Currently, Iraqi developers must:
- Integrate 3+ different APIs with inconsistent authentication schemes
- Duplicate security logic across codebases
- Maintain separate implementations for mobile, web, and backend
- Navigate sparse documentation in multiple languages
- Handle edge cases independently for each gateway

**Impact:** This fragmentation increases development time by 300% and creates security vulnerabilities through inconsistent implementations.

### Solution Overview
The Mesopotamia SDK is a tri-layer architecture providing:
1. **Universal Core** (Rust/Zig): Cryptographically secure payment logic
2. **Multi-Platform Bridge** (FFI/Wasm): Native performance across devices
3. **Developer Interfaces** (Flutter/Node.js): Drop-in UI components and backend APIs

---

## 1. Project Scope

### 1.1 In-Scope
- ✅ ZainCash, FastPay, First Iraqi Bank (FIB) integration
- ✅ Mobile (iOS/Android), Web, and Server-side support
- ✅ Sandbox testing environment
- ✅ Webhook signature verification
- ✅ Comprehensive error handling
- ✅ Multi-language support (English, Arabic, Kurdish)
- ✅ Production-ready security standards

### 1.2 Out-of-Scope (Future Phases)
- ❌ Cryptocurrency wallets
- ❌ International payment processors (Stripe, PayPal)
- ❌ Subscription/recurring billing management
- ❌ Payment analytics dashboard (mentioned as stretch goal only)

### 1.3 Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Integration Time | <2 hours | Developer survey |
| Signature Performance | <1ms | Benchmark suite |
| Test Coverage | >85% | Automated CI |
| Gateway Uptime Handling | 99.5% | Error rate monitoring |
| Security Audit | 0 critical issues | Third-party review |

---

## 2. Technical Architecture

### 2.1 System Overview

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
         │   (Rust/Zig)      │
         └─────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌─────▼─────┐   ┌───▼───┐
│ZainCash│    │  FastPay  │   │  FIB  │
└────────┘    └───────────┘   └───────┘
```

### 2.2 Layer 1: The Core Brain (Rust/Zig)

**Responsibility:** All security-critical operations must happen here.

#### 2.2.1 Core Modules

**Module 1: Cryptography Engine**
```rust
// Pseudo-code representation
pub mod crypto {
    fn generate_hmac_sha256(secret: &[u8], payload: &str) -> Vec<u8>;
    fn generate_jwt_hs256(claims: Claims, secret: &str) -> String;
    fn verify_webhook_signature(signature: &str, payload: &str, secret: &str) -> bool;
}
```

**Module 2: Gateway Abstraction**
```rust
pub enum PaymentProvider {
    ZainCash,
    FastPay,
    FIB,
}

pub struct PaymentRequest {
    amount: u64,           // Amount in IQD (smallest unit)
    order_id: String,      // Merchant's unique order ID
    callback_url: String,  // Where to redirect after payment
    webhook_url: String,   // Where to send async confirmation
    metadata: HashMap<String, String>,
}

pub struct PaymentResponse {
    transaction_id: String,
    redirect_url: String,
    status: PaymentStatus,
    provider: PaymentProvider,
}

pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
    Cancelled,
    Expired,
}
```

**Module 3: HTTP Client**
- Connection pooling for performance
- Automatic retries with exponential backoff (3 attempts)
- Timeout configuration: Connect(5s), Read(30s)
- TLS 1.2+ enforcement
- Custom User-Agent: `MesopotamiaSDK/1.0.0 (Language/Version)`

**Module 4: Configuration Manager**
```rust
pub struct SdkConfig {
    environment: Environment,
    provider_configs: HashMap<PaymentProvider, ProviderConfig>,
    timeout_ms: u64,
    enable_logging: bool,
    log_level: LogLevel,
}

pub enum Environment {
    Sandbox,
    Production,
}

pub struct ProviderConfig {
    merchant_id: String,
    api_key: SecureString,      // Zero on drop
    api_secret: SecureString,   // Zero on drop
    base_url: Option<String>,   // Override for sandbox
}
```

#### 2.2.2 Security Requirements

1. **Memory Safety**
   - Use Rust's ownership model or Zig's manual memory management carefully
   - Zero-copy operations where possible
   - Secrets must be zeroed from memory after use

2. **Input Validation**
   - All amounts must be positive integers
   - Order IDs: Alphanumeric, max 50 characters
   - URLs: Valid HTTPS in production (HTTP allowed in sandbox)
   - Metadata keys/values: Max 100 characters each, max 10 pairs

3. **Rate Limiting**
   - Client-side: Max 10 requests/second per gateway
   - Configurable via SDK config

4. **Error Handling**
   - Never expose secrets in error messages
   - Include request IDs for debugging
   - Structured error types (see Section 5)

### 2.3 Layer 2: The Bridge (FFI & WebAssembly)

#### 2.3.1 Flutter FFI Bridge
```dart
// mesopotamia_ffi.dart
class MesopotamiaNative {
  static final DynamicLibrary _lib = Platform.isAndroid
      ? DynamicLibrary.open("libmesopotamia.so")
      : DynamicLibrary.open("Mesopotamia.framework/Mesopotamia");
  
  late final _createPayment = _lib.lookupFunction<
      Pointer<Utf8> Function(Pointer<Utf8>),
      Pointer<Utf8> Function(Pointer<Utf8>)>('mesopotamia_create_payment');
}
```

**Performance Target:** FFI call overhead <0.1ms

#### 2.3.2 WebAssembly Module
```javascript
// mesopotamia.wasm exports
export function create_payment(config_json: string): string;
export function verify_webhook(signature: string, payload: string, secret: string): boolean;
export function get_sdk_version(): string;
```

**Bundle Size Target:** <150KB gzipped

### 2.4 Layer 3: Developer Interfaces

#### 2.4.1 Flutter Package
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
  orderId: 'ORDER_${DateTime.now().millisecondsSinceEpoch}',
  onSuccess: (PaymentResult result) {
    print('Payment completed: ${result.transactionId}');
  },
  onError: (MesopotamiaError error) {
    print('Payment failed: ${error.message}');
  },
);
```

**UI Components:**
- `PaymentSheet`: Full-screen modal with provider selection
- `PaymentButton`: Customizable payment trigger button
- `ProviderIcon`: Gateway logos with consistent styling

**Accessibility:**
- Screen reader support (Semantics widgets)
- Minimum touch target: 48x48dp
- High contrast mode support
- RTL layout for Arabic/Kurdish

#### 2.4.2 Node.js Package
```javascript
const { MesopotamiaSDK, PaymentProvider, Environment } = require('mesopotamia-sdk');

const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX,
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: process.env.ZAINCASH_MERCHANT_ID,
      apiKey: process.env.ZAINCASH_API_KEY,
      apiSecret: process.env.ZAINCASH_API_SECRET,
    },
  },
});

// Create payment transaction
app.post('/api/create-payment', async (req, res) => {
  try {
    const payment = await sdk.createPayment({
      provider: PaymentProvider.ZAIN_CASH,
      amount: 50000,
      orderId: generateOrderId(),
      callbackUrl: 'https://yourapp.com/payment/callback',
      webhookUrl: 'https://yourapp.com/api/webhook',
    });
    
    res.json({ redirectUrl: payment.redirectUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify webhook
app.post('/api/webhook', async (req, res) => {
  const signature = req.headers['x-mesopotamia-signature'];
  const isValid = await sdk.verifyWebhook(
    signature,
    JSON.stringify(req.body),
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process payment confirmation
  const { transactionId, status } = req.body;
  await updateOrderStatus(transactionId, status);
  
  res.status(200).send('OK');
});
```

---

## 3. Gateway Integration Specifications

### 3.1 ZainCash Integration

**Authentication:** JWT (HS256) with shared secret

**Flow:**
1. Generate JWT token with payload: `{amount, orderId, merchantId, timestamp}`
2. POST to `/transaction/init` with JWT in body
3. Receive `transactionId` and `redirectUrl`
4. Redirect user to ZainCash app/web
5. User completes payment
6. ZainCash sends webhook to merchant
7. Merchant verifies webhook signature

**Endpoints:**
- Sandbox: `https://sandbox.zaincash.iq/api/v1`
- Production: `https://api.zaincash.iq/api/v1`

**Specific Requirements:**
- Token expiry: 5 minutes
- Amount range: 1,000 - 5,000,000 IQD
- Order ID must be unique per merchant
- Deep linking: `zaincash://payment?token=<jwt>`

**Error Codes:**
- `INSUFFICIENT_BALANCE`: User wallet balance too low
- `INVALID_TOKEN`: JWT signature verification failed
- `EXPIRED_TOKEN`: JWT exceeded 5-minute window
- `DUPLICATE_ORDER`: Order ID already used

### 3.2 FastPay Integration

**Authentication:** Basic Auth (StoreID:Password)

**Flow:**
1. POST to `/payment/init` with Basic Auth header
2. Receive `paymentId` and `redirectUrl`
3. Redirect user to FastPay web interface
4. User completes payment
5. FastPay redirects to callback URL with status
6. FastPay sends webhook for final confirmation

**Endpoints:**
- Sandbox: `https://sandbox-api.fast-pay.iq/v1`
- Production: `https://api.fast-pay.iq/v1`

**Specific Requirements:**
- Amount range: 500 - 10,000,000 IQD
- Callback URL must be HTTPS in production
- Session timeout: 15 minutes
- Refund support: Yes (via separate API)

**Error Codes:**
- `INVALID_CREDENTIALS`: StoreID or Password incorrect
- `AMOUNT_TOO_LOW`: Minimum 500 IQD
- `AMOUNT_TOO_HIGH`: Maximum 10,000,000 IQD
- `SESSION_EXPIRED`: User took too long to complete

### 3.3 First Iraqi Bank (FIB) Integration

**Authentication:** OAuth2 Bearer Token

**Flow:**
1. POST to `/oauth/token` with client credentials → Receive access token
2. POST to `/payment/create` with Bearer token → Receive `paymentId`
3. Construct deep link: `fib://payment?id=<paymentId>`
4. Check if FIB app installed, else fallback to web
5. User approves in FIB app
6. FIB sends webhook to merchant
7. Merchant can query `/payment/status` for confirmation

**Endpoints:**
- Sandbox: `https://sandbox-fib.iq/api/v2`
- Production: `https://api.fib.iq/api/v2`

**Specific Requirements:**
- Token validity: 1 hour (cache and reuse)
- Token refresh: Automatic if <5 minutes remaining
- Amount range: 1,000 - 100,000,000 IQD
- Deep linking: Check app availability first
- Fallback: Web interface if app not installed

**Error Codes:**
- `TOKEN_EXPIRED`: Access token needs refresh
- `INVALID_CLIENT`: Client ID/Secret wrong
- `PAYMENT_DECLINED`: User rejected in app
- `ACCOUNT_RESTRICTED`: User account has limitations

---

## 4. Error Handling & Resilience

### 4.1 Error Taxonomy

```rust
pub enum MesopotamiaError {
    // Network Errors
    NetworkTimeout { provider: PaymentProvider, duration_ms: u64 },
    ConnectionFailed { provider: PaymentProvider, reason: String },
    
    // Authentication Errors
    InvalidCredentials { provider: PaymentProvider },
    TokenExpired { provider: PaymentProvider },
    
    // Validation Errors
    InvalidAmount { min: u64, max: u64, provided: u64 },
    InvalidOrderId { reason: String },
    InvalidUrl { url: String },
    
    // Gateway Errors
    GatewayError { provider: PaymentProvider, code: String, message: String },
    PaymentDeclined { provider: PaymentProvider, reason: String },
    
    // SDK Errors
    ConfigurationError { message: String },
    UnsupportedProvider { provider: String },
}
```

### 4.2 Retry Strategy

**Automatic Retries:**
- Network timeouts: 3 attempts with exponential backoff (1s, 2s, 4s)
- 5xx server errors: 2 attempts with 2s delay
- Rate limit (429): Wait for `Retry-After` header, max 3 attempts

**No Retry:**
- 4xx client errors (except 429)
- Invalid credentials
- Payment declined by user

### 4.3 Idempotency

**Implementation:**
- SDK generates `X-Idempotency-Key` header: `UUID-v4`
- Key stored with request: `{orderId}-{timestamp}-{random}`
- Gateway must deduplicate within 24-hour window
- Merchants can provide custom keys via `idempotencyKey` parameter

### 4.4 Circuit Breaker

**Per-Gateway Protection:**
- Failure threshold: 5 consecutive errors
- Open state duration: 30 seconds
- Half-open test: Single request after timeout
- Success resets counter

---

## 5. Security & Compliance

### 5.1 Key Management Best Practices

**For Merchants (Documentation):**

❌ **NEVER DO THIS:**
```dart
// WRONG: Hardcoded secrets in client code
final sdk = MesopotamiaSDK(
  providers: {
    PaymentProvider.zainCash: ProviderConfig(
      apiSecret: 'sk_live_abc123', // EXPOSED TO USERS!
    ),
  },
);
```

✅ **CORRECT APPROACH:**
```javascript
// Node.js Backend
require('dotenv').config();

const sdk = new MesopotamiaSDK({
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      apiSecret: process.env.ZAINCASH_SECRET, // From environment
    },
  },
});
```

**Environment Variable Template:**
```bash
# .env.example
MESOPOTAMIA_ENVIRONMENT=sandbox
ZAINCASH_MERCHANT_ID=merchant_123
ZAINCASH_API_KEY=pk_sandbox_xyz
ZAINCASH_API_SECRET=sk_sandbox_abc
FASTPAY_STORE_ID=store_456
FASTPAY_PASSWORD=pass_def
FIB_CLIENT_ID=client_789
FIB_CLIENT_SECRET=secret_ghi
```

### 5.2 TLS/SSL Requirements

**Production:**
- Minimum TLS 1.2
- Certificate pinning for known gateways
- Reject self-signed certificates

**Sandbox:**
- TLS 1.2+ preferred
- Self-signed certificates allowed
- Warning logged if insecure

### 5.3 Data Privacy

**PII Handling:**
- SDK never logs user phone numbers, card details, or PII
- Metadata is merchant-controlled (warn about PII in docs)
- Webhook payloads may contain PII—merchant responsibility to secure

**GDPR/Local Compliance:**
- No telemetry by default
- Opt-in anonymous error reporting
- Clear data retention policy in ToS

### 5.4 Webhook Security

**Signature Verification:**
```
HMAC-SHA256(payload + timestamp, webhook_secret)
```

**Headers Sent:**
```
X-Mesopotamia-Signature: sha256=abc123...
X-Mesopotamia-Timestamp: 1704067200
X-Mesopotamia-Provider: zaincash
```

**Merchant Verification:**
```javascript
const isValid = sdk.verifyWebhook(
  req.headers['x-mesopotamia-signature'],
  req.body,
  process.env.WEBHOOK_SECRET,
);
```

**Replay Attack Prevention:**
- Reject webhooks with timestamp >5 minutes old
- Merchants should track processed transaction IDs

---

## 6. Testing Strategy

### 6.1 Mock Gateway Server

**Purpose:** Simulate all three gateways for integration testing

**Implementation:** Go/Python HTTP server

**Endpoints:**
```
POST /zaincash/init      → Returns mock transactionId
POST /fastpay/init       → Returns mock paymentId
POST /fib/oauth/token    → Returns mock access_token
POST /fib/payment/create → Returns mock paymentId
POST /webhook            → Accepts and logs webhooks
```

**Features:**
- Configurable success/failure rates
- Latency injection (simulate slow networks)
- Invalid signature responses for testing error handling
- Deep link validation

### 6.2 Unit Tests

**Core Library (Rust/Zig):**
- Cryptography functions (HMAC, JWT generation)
- Request signing for each gateway
- Error type conversions
- Configuration validation

**Target:** >90% code coverage

### 6.3 Integration Tests

**Against Mock Gateway:**
- Full payment flow for each provider
- Webhook signature verification
- Token refresh (FIB)
- Error scenario handling
- Timeout and retry behavior

**CI Pipeline:** Run on every commit

### 6.4 Contract Tests

**Purpose:** Ensure mock gateway matches real behavior

**Approach:**
- Record real gateway responses (sanitized)
- Replay against mock gateway
- Validate response structure matches

**Maintenance:** Update when gateways change APIs

### 6.5 Performance Tests

**Benchmarks:**
```
Signature Generation (HMAC-SHA256): <1ms
JWT Generation (HS256): <1ms
FFI Call Overhead: <0.1ms
Payment Request E2E (Mock): <50ms
Wasm Module Load Time: <100ms
```

**Load Testing:**
- 100 concurrent payment requests
- 1000 webhook verifications/second
- Memory usage under sustained load

### 6.6 Security Tests

**Automated:**
- Dependency vulnerability scanning (cargo audit / npm audit)
- Static analysis (Clippy for Rust)
- Fuzzing inputs to core functions

**Manual:**
- Penetration testing checklist
- Secret leakage verification
- TLS configuration review

---

## 7. Development Phases

### Phase 1: Foundation (Week 1-2)

**Deliverables:**
1. Project repository setup (Git, CI/CD)
2. Mock Gateway Server (Go/Python)
   - All endpoints functional
   - Swagger/OpenAPI documentation
3. Core library scaffolding (Rust/Zig)
   - Project structure
   - Build system configuration
   - Basic types defined

**Prompt for AI Assistant:**
```
Create a Mock Gateway Server in Go that simulates ZainCash, FastPay, and FIB APIs.

Requirements:
- Endpoint: POST /zaincash/init
  - Accepts JWT in body
  - Validates signature with secret "sandbox_secret"
  - Returns: {transactionId, redirectUrl, status: "pending"}
  
- Endpoint: POST /fastpay/init
  - Accepts Basic Auth (store123:pass123)
  - Returns: {paymentId, redirectUrl}
  
- Endpoint: POST /fib/oauth/token
  - Accepts client_credentials grant
  - Returns: {access_token, expires_in: 3600}
  
- Endpoint: POST /fib/payment/create
  - Requires Bearer token
  - Returns: {paymentId, deepLink}

Add a /health endpoint and comprehensive logging. Server should run on localhost:8080.
```

### Phase 2: Core Security Logic (Week 3-4)

**Deliverables:**
1. Cryptography module
   - HMAC-SHA256 implementation
   - JWT HS256 generation
   - Webhook signature verification
2. Gateway abstraction layer
   - PaymentProvider enum
   - Unified request/response types
3. HTTP client with retry logic
4. Unit tests (>85% coverage)

**Prompt for AI Assistant:**
```
Build the security core for Mesopotamia SDK in Rust.

Create a library with these modules:

1. crypto.rs:
   - generate_hmac_sha256(secret: &str, payload: &str) -> String
   - generate_jwt_hs256(claims: JwtClaims, secret: &str) -> Result<String>
   - verify_webhook_signature(sig: &str, payload: &str, secret: &str) -> bool

2. gateway.rs:
   - enum PaymentProvider { ZainCash, FastPay, FIB }
   - struct PaymentRequest { amount, order_id, callback_url, webhook_url }
   - struct PaymentResponse { transaction_id, redirect_url, status }
   
3. client.rs:
   - HTTP client using reqwest
   - Retry logic: 3 attempts, exponential backoff
   - Timeout: 30 seconds
   
4. config.rs:
   - SdkConfig struct with provider credentials
   - Environment enum (Sandbox, Production)
   - Validation logic

Include comprehensive unit tests using the `cargo test` framework. All tests must pass.
```

### Phase 3: Gateway Integrations (Week 5-7)

**Deliverables:**
1. ZainCash implementation
   - JWT signing
   - Transaction initialization
   - Webhook handling
2. FastPay implementation
   - Basic Auth
   - Payment flow
3. FIB implementation
   - OAuth2 flow
   - Token caching/refresh
4. Integration tests against mock gateway

**Prompt for AI Assistant:**
```
Implement ZainCash gateway integration in the Mesopotamia SDK.

Requirements:
1. Create zaincash.rs module
2. Implement InitTransaction:
   - Generate JWT with claims: {merchant_id, amount, order_id, timestamp}
   - Sign with HS256 using merchant secret
   - POST to /transaction/init
   - Parse response: {transactionId, redirectUrl}
   
3. Implement VerifyWebhook:
   - Extract signature from X-Mesopotamia-Signature header
   - Verify HMAC-SHA256(payload + timestamp, secret)
   - Return bool
   
4. Error handling:
   - Map ZainCash error codes to MesopotamiaError enum
   - Handle: INSUFFICIENT_BALANCE, INVALID_TOKEN, EXPIRED_TOKEN
   
5. Write integration tests:
   - Successful payment flow against mock gateway
   - Invalid credentials handling
   - Network timeout simulation

Ensure the implementation points to localhost:8080 when environment is Sandbox.
```

### Phase 4: Flutter Interface (Week 8-10)

**Deliverables:**
1. FFI bindings to Rust core
2. Payment Sheet UI component
   - Provider selection
   - Amount display (formatted IQD)
   - Loading states
3. Deep linking support
4. Example app demonstrating all features
5. Platform-specific testing (iOS/Android/Web)

**Prompt for AI Assistant:**
```
Create a Flutter package that wraps the Mesopotamia Rust core via FFI.

Requirements:
1. FFI Bridge:
   - Load native library (libmesopotamia.so / Mesopotamia.framework)
   - Expose: create_payment(config_json) -> payment_response_json
   - Handle memory management (free strings)
   
2. Payment Sheet Widget:
   - Full-screen modal with Material Design
   - Provider selection (ZainCash, FastPay, FIB logos)
   - Amount display: "50,000 IQD" with proper formatting
   - "Pay Now" button with loading indicator
   - Error snackbar for failures
   
3. Deep Linking:
   - Use url_launcher to check if apps installed
   - ZainCash: zaincash://payment?token=<jwt>
   - FIB: fib://payment?id=<paymentId>
   - Fallback to web view if app not available
   
4. API Design:
   ```dart
   final result = await MesopotamiaSDK.presentPaymentSheet(
     context: context,
     amount: 50000,
     orderId: 'ORDER_123',
     provider: PaymentProvider.zainCash,
     onSuccess: (result) => print(result.transactionId),
     onError: (error) => print(error.message),
   );
   ```
   
5. Support Flutter Web using Wasm (compile Rust to Wasm target)

Include example app with sandbox credentials pre-filled.
```

### Phase 5: Node.js Interface (Week 11-12)

**Deliverables:**
1. Node.js native addon (N-API bindings)
2. TypeScript type definitions
3. Express.js middleware for webhooks
4. Example backend server
5. NPM package publication (to npmjs.com)

**Prompt for AI Assistant:**
```
Create a Node.js package for Mesopotamia SDK using N-API to bind to the Rust core.

Requirements:
1. N-API Bindings:
   - Use neon-bindings or node-bindgen
   - Expose: createPayment(config, request) -> Promise<PaymentResponse>
   - Expose: verifyWebhook(signature, payload, secret) -> boolean
   
2. JavaScript API:
   ```javascript
   const sdk = new MesopotamiaSDK({
     environment: 'sandbox',
     providers: {
       zaincash: {
         merchantId: '...',
         apiKey: '...',
         apiSecret: '...',
       },
     },
   });
   
   const payment = await sdk.createPayment({
     provider: 'zaincash',
     amount: 50000,
     orderId: 'ORDER_123',
     callbackUrl: 'https://...',
     webhookUrl: 'https://...',
   });
   ```
   
3. Express Middleware:
   ```javascript
   app.use('/webhook', mesopotamia.webhookMiddleware({
     secret: process.env.WEBHOOK_SECRET,
     onPaymentSuccess: async (data) => { ... },
   }));
   ```
   
4. TypeScript Definitions:
   - Full type coverage
   - JSDoc comments for intellisense
   
5. Example Server:
   - Create payment endpoint
   - Webhook handler
   - Status check endpoint

Package should include README with quickstart guide.
```

### Phase 6: Documentation & Polish (Week 13-14)

**Deliverables:**
1. API Reference (auto-generated)
2. Integration guides
   - Flutter Quickstart (5 minutes)
   - Node.js Quickstart (5 minutes)
   - Migration guide from direct gateway integration
3. Security best practices document
4. Troubleshooting guide
5. Video demo (5-minute walkthrough)

### Phase 7: Testing & Hardening (Week 15-16)

**Deliverables:**
1. Production testing with real gateways (small amounts)
2. Performance benchmark report
3. Security audit (internal + external review)
4. Load testing results
5. Bug fixes and optimization

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Metric | Requirement | Measurement Method |
|--------|-------------|-------------------|
| Signature Generation | <1ms | Criterion benchmarks |
| Payment Request Latency | <200ms (P95) | Integration tests |
| FFI Call Overhead | <0.1ms | Microbenchmarks |
| Wasm Bundle Size | <150KB gzipped | webpack-bundle-analyzer |
| Memory Usage | <10MB per SDK instance | Valgrind/Instruments |
| Binary Size | <5MB (Rust release build) | `ls -lh` |

### 8.2 Reliability

- **Uptime Target:** 99.9% (excluding gateway downtime)
- **Error Rate:** <0.1% for SDK logic errors
- **Retry Success Rate:** >80% for transient failures
- **Circuit Breaker:** Activate after 5 consecutive failures

### 8.3 Compatibility

**Flutter:**
- Flutter 3.10+
- iOS 12+
- Android 5.0+ (API 21)
- Web (Chrome, Safari, Firefox latest 2 versions)

**Node.js:**
- Node.js 16+ (LTS versions)
- Compatible with Express, Fastify, NestJS

**Rust/Zig:**
- Rust 1.70+ / Zig 0.11+
- Cross-compilation targets: x86_64, ARM64, Wasm32

### 8.4 Accessibility

- **WCAG 2.1 Level AA** compliance for Flutter UI
- Screen reader support (TalkBack, VoiceOver)
- Minimum contrast ratio: 4.5:1
- Keyboard navigation support
- RTL layout for Arabic/Kurdish text

### 8.5 Internationalization

**Supported Languages:**
- English (default)
- Arabic (العربية)
- Kurdish (کوردی - Sorani)

**Implementation:**
- Error messages in all three languages
- Currency formatting: "50,000 IQD" / "٥٠٬٠٠٠ د.ع" / "٥٠٬٠٠٠ IQD"
- Date/time localization
- RTL text rendering for Arabic/Kurdish
- Number formatting with locale-specific separators

**Flutter Package Structure:**
```
lib/
  l10n/
    app_en.arb
    app_ar.arb
    app_ku.arb
```

### 8.6 Monitoring & Observability

**SDK Telemetry (Opt-in):**
- Anonymous error reporting to Sentry/similar
- Performance metrics (P50, P95, P99 latency)
- Gateway availability tracking
- SDK version usage distribution

**Logged Events:**
- Payment initiation attempts
- Signature generation failures
- Network errors with sanitized details
- Gateway response times

**Privacy:**
- No PII in logs
- Transaction IDs hashed
- IP addresses anonymized
- Opt-out mechanism in config

### 8.7 Versioning & Backwards Compatibility

**Semantic Versioning:**
- Format: `MAJOR.MINOR.PATCH`
- Major: Breaking API changes
- Minor: New features, backwards compatible
- Patch: Bug fixes

**Breaking Change Policy:**
- 6-month deprecation notice
- Migration guide provided
- Old version supported for 1 year minimum
- Clear changelog in releases

**Example:**
```
v1.0.0 → v1.1.0: Added FIB support (compatible)
v1.1.0 → v2.0.0: Changed PaymentRequest structure (breaking)
```

---

## 9. Deployment & Distribution

### 9.1 Flutter Package (pub.dev)

**Package Name:** `mesopotamia_sdk`

**pubspec.yaml:**
```yaml
name: mesopotamia_sdk
version: 1.0.0
description: Unified Iraqi payment gateway SDK supporting ZainCash, FastPay, and FIB
homepage: https://github.com/yourusername/mesopotamia-sdk
repository: https://github.com/yourusername/mesopotamia-sdk
issue_tracker: https://github.com/yourusername/mesopotamia-sdk/issues

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: '>=3.10.0'

dependencies:
  flutter:
    sdk: flutter
  ffi: ^2.0.0
  url_launcher: ^6.0.0
  flutter_localizations:
    sdk: flutter

dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
```

**Distribution Files:**
- Native binaries: `ios/libmesopotamia.a`, `android/libmesopotamia.so`
- Dart wrapper code
- Example app
- API documentation

### 9.2 Node.js Package (npmjs.com)

**Package Name:** `mesopotamia-sdk`

**package.json:**
```json
{
  "name": "mesopotamia-sdk",
  "version": "1.0.0",
  "description": "Unified Iraqi payment gateway SDK for Node.js",
  "main": "index.js",
  "types": "index.d.ts",
  "scripts": {
    "build": "neon build --release",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["payment", "iraq", "zaincash", "fastpay", "fib", "gateway"],
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "neon-cli": "^0.10.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**Distribution:**
- Pre-built binaries for common platforms (Linux x64, macOS ARM64, Windows x64)
- Fallback to source compilation for unsupported platforms
- TypeScript definitions included

### 9.3 WebAssembly Module

**Distribution Channels:**
1. CDN: `https://cdn.mesopotamia.dev/wasm/v1.0.0/mesopotamia.wasm`
2. NPM: `mesopotamia-sdk-wasm`
3. GitHub Releases

**Usage in HTML:**
```html
<script type="module">
  import init, { create_payment } from 'https://cdn.mesopotamia.dev/wasm/v1.0.0/mesopotamia.js';
  
  await init();
  const result = create_payment(JSON.stringify(config));
</script>
```

### 9.4 Source Code Repository

**GitHub Repository Structure:**
```
mesopotamia-sdk/
├── README.md
├── LICENSE (MIT)
├── CONTRIBUTING.md
├── SECURITY.md
├── core/               # Rust/Zig core library
│   ├── src/
│   ├── tests/
│   └── Cargo.toml
├── flutter/            # Flutter package
│   ├── lib/
│   ├── example/
│   ├── test/
│   └── pubspec.yaml
├── nodejs/             # Node.js package
│   ├── src/
│   ├── native/
│   ├── test/
│   └── package.json
├── mock-gateway/       # Test server
│   └── main.go
├── docs/               # Documentation
│   ├── quickstart/
│   ├── api-reference/
│   └── security/
└── .github/
    └── workflows/
        ├── ci.yml
        └── release.yml
```

**CI/CD Pipeline (GitHub Actions):**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test-core:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
      - run: cargo test --all-features
      - run: cargo clippy -- -D warnings
  
  test-flutter:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - run: flutter test
      - run: flutter build ios --no-codesign
  
  test-nodejs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
```

---

## 10. Documentation Strategy

### 10.1 Documentation Structure

**Website:** `https://docs.mesopotamia.dev`

**Content:**
1. **Getting Started** (5-minute quickstarts)
   - Flutter integration
   - Node.js integration
   - Web integration (Wasm)

2. **Guides**
   - Migration from direct gateway integration
   - Production deployment checklist
   - Security best practices
   - Error handling patterns
   - Testing strategies

3. **API Reference**
   - Auto-generated from code (rustdoc, dartdoc, typedoc)
   - Interactive examples
   - Request/response samples

4. **Gateway-Specific Docs**
   - ZainCash integration details
   - FastPay integration details
   - FIB integration details
   - Comparison matrix

5. **Troubleshooting**
   - Common error messages
   - Debug mode usage
   - Support channels

### 10.2 Inline Documentation

**Code Comments Standard:**
```rust
/// Creates a new payment transaction with the specified provider.
///
/// # Arguments
/// * `provider` - The payment gateway to use (ZainCash, FastPay, or FIB)
/// * `request` - Payment details including amount, order ID, and callbacks
///
/// # Returns
/// * `Ok(PaymentResponse)` - Transaction created successfully
/// * `Err(MesopotamiaError)` - Failed to create transaction
///
/// # Example
/// ```rust
/// let response = sdk.create_payment(
///     PaymentProvider::ZainCash,
///     PaymentRequest {
///         amount: 50000,
///         order_id: "ORDER_123".to_string(),
///         ..Default::default()
///     }
/// )?;
/// ```
///
/// # Errors
/// * `InvalidAmount` - Amount outside allowed range
/// * `NetworkTimeout` - Gateway unreachable
/// * `InvalidCredentials` - Merchant credentials incorrect
pub fn create_payment(
    &self,
    provider: PaymentProvider,
    request: PaymentRequest,
) -> Result<PaymentResponse, MesopotamiaError> {
    // Implementation
}
```

### 10.3 Interactive Documentation

**Postman Collection:**
- Pre-configured requests for all gateways
- Environment variables for sandbox/production
- Example responses

**OpenAPI Specification:**
- Swagger UI for mock gateway
- Downloadable schema for validation

**Code Playground:**
- Live Flutter/React code editor
- Sandbox environment with test credentials
- Instant preview of payment flows

---

## 11. Support & Maintenance

### 11.1 Support Channels

**Primary Support:**
- GitHub Issues (bug reports, feature requests)
- GitHub Discussions (Q&A, community help)
- Email: support@mesopotamia.dev

**Response Time SLA:**
- Critical security issues: 24 hours
- Bug reports: 72 hours
- Feature requests: 1 week
- Questions: Best effort

### 11.2 Community

**Discord/Slack Channel:**
- #general: General discussion
- #help: Technical support
- #announcements: Release updates
- #showcase: Community projects

**Contributing Guidelines:**
- Code of conduct
- Pull request template
- Issue templates (bug, feature, security)
- Development setup guide

### 11.3 Maintenance Schedule

**Regular Updates:**
- Security patches: As needed (urgent)
- Bug fixes: Monthly patch releases
- Features: Quarterly minor releases
- Major versions: Yearly

**Dependency Updates:**
- Weekly automated dependency checks
- Monthly security audit scans
- Quarterly major dependency upgrades

---

## 12. Legal & Licensing

### 12.1 License

**MIT License** (Developer-friendly, permissive)

```
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 12.2 Terms of Service

**Key Points:**
- SDK provided "as is" without warranty
- No liability for transaction failures caused by gateway issues
- Merchants responsible for compliance with gateway terms
- No guarantee of uptime or availability
- Users must comply with Iraqi financial regulations

### 12.3 Privacy Policy

**Data Collection:**
- SDK collects no user data by default
- Optional telemetry (opt-in) collects anonymous usage stats
- No tracking cookies or analytics in web version

**Merchant Responsibilities:**
- Secure storage of API credentials
- Compliance with data protection laws
- Proper handling of customer payment data
- Webhook endpoint security

### 12.4 Security Disclosure Policy

**Responsible Disclosure:**
- Report security issues to: security@mesopotamia.dev
- PGP key available for encrypted communication
- Acknowledgment within 48 hours
- Fix timeline: Critical (7 days), High (30 days), Medium (90 days)

**Hall of Fame:**
- Public recognition for responsible disclosure
- Optional CVE assignment for significant findings

---

## 13. Academic Evaluation Criteria

### 13.1 University Assessment Alignment

**Technical Complexity (30%):**
- Multi-language integration (Rust/Zig, Dart, JavaScript)
- Cross-platform compilation (FFI, Wasm)
- Cryptographic implementations
- Network protocol handling

**Problem Solving (25%):**
- Real-world problem identification
- Solution architecture design
- Trade-off analysis (Rust vs Zig, FFI vs Wasm)
- Error handling strategy

**Implementation Quality (25%):**
- Code organization and readability
- Test coverage (>85%)
- Documentation completeness
- Performance benchmarks

**Innovation (10%):**
- Novel approach to multi-gateway integration
- Developer experience improvements
- Open source contribution potential

**Project Management (10%):**
- Phased development execution
- Timeline adherence
- Risk mitigation
- Deliverables completeness

### 13.2 Presentation Materials

**Final Presentation Outline (20 minutes):**

1. **Problem Statement (3 min)**
   - Show fragmented current state
   - Developer pain points
   - Market opportunity in Iraq

2. **Solution Architecture (5 min)**
   - Tri-layer design explanation
   - Technology stack justification
   - Security approach

3. **Live Demo (7 min)**
   - Flutter app: Complete payment flow
   - Node.js backend: Transaction creation
   - Mock gateway: Webhook handling
   - Show error handling in action

4. **Technical Deep-Dive (3 min)**
   - Walk through signature generation code
   - Explain FFI bridge mechanism
   - Highlight security measures

5. **Results & Impact (2 min)**
   - Performance benchmarks
   - Test coverage results
   - Potential adoption path

**Demonstration Scenarios:**
- Success flow: ZainCash payment from Flutter app
- Error handling: Invalid credentials, network timeout
- Multi-gateway: Switch between providers seamlessly
- Backend security: Show webhook verification

### 13.3 Supplementary Materials

**Technical Report (50+ pages):**
1. Executive summary
2. Literature review (existing payment SDKs)
3. Requirements analysis
4. System design and architecture
5. Implementation details
6. Testing and validation
7. Performance evaluation
8. Security analysis
9. Conclusion and future work
10. Appendices (code samples, API docs)

**Poster/Infographic:**
- Visual architecture diagram
- Key metrics (performance, coverage)
- Technology stack icons
- QR code to GitHub repo

**Video Demo (5 minutes):**
- Screen recording of complete flow
- Voiceover explaining each step
- Uploaded to YouTube/university portal

---

## 14. Future Roadmap

### Phase 1 (Current Project - 16 weeks)
- ✅ Core SDK with 3 gateways
- ✅ Flutter and Node.js interfaces
- ✅ Comprehensive testing
- ✅ Documentation

### Phase 2 (Post-Graduation - 3 months)
- Add AsiaHawala gateway
- React Native bindings
- Python wrapper (for Django/Flask)
- Enhanced analytics dashboard

### Phase 3 (6 months)
- Subscription/recurring payment support
- Refund management
- Dispute handling
- Multi-currency support (USD, EUR)

### Phase 4 (12 months)
- SaaS platform: Hosted payment page
- No-code integration (WordPress, Shopify plugins)
- Advanced fraud detection
- Regional expansion (Kurdistan, other Iraqi cities)

### Long-Term Vision
- Become the de facto payment standard in Iraq
- Contribute to Iraqi fintech ecosystem
- Open source community growth
- Potential commercialization (premium features)

---

## 15. Risk Management

### 15.1 Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Gateway API changes | High | Medium | Contract tests, version pinning, changelog monitoring |
| FFI memory leaks | High | Low | Valgrind testing, code review, careful resource management |
| Wasm compatibility issues | Medium | Medium | Browser testing matrix, polyfills |
| Performance regression | Medium | Low | Continuous benchmarking, CI performance gates |

### 15.2 Project Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Timeline overrun | High | Medium | Phased approach, MVP first, buffer time |
| Gateway credentials unavailable | High | Low | Mock gateway for development, sandbox accounts |
| Scope creep | Medium | High | Strict PRD adherence, feature freeze 2 weeks before deadline |
| Knowledge gaps (Rust/Zig) | Medium | Medium | Start with Rust (better docs), extensive testing |

### 15.3 Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low adoption | Medium | Medium | Developer outreach, clear documentation, free tier |
| Gateway partnership issues | Low | Low | Direct integration without official partnerships initially |
| Regulatory changes | Medium | Low | Monitor Iraqi financial regulations, flexible architecture |
| Competition | Low | Low | First-mover advantage, superior DX, open source |

---

## 16. Conclusion

The Mesopotamia SDK represents a significant contribution to Iraq's digital payment infrastructure. By providing a unified, secure, and performant integration point, this project:

1. **Reduces developer friction** from weeks to hours
2. **Improves security** through centralized cryptographic operations
3. **Enables innovation** by lowering barriers to payment integration
4. **Demonstrates technical excellence** suitable for academic evaluation

This PRD serves as a comprehensive blueprint for implementation, ensuring all aspects—from low-level cryptography to high-level user experience—are carefully considered and executed.

**Next Steps:**
1. Review and approve this PRD
2. Set up development environment
3. Begin Phase 1: Mock Gateway Server
4. Iterate based on implementation learnings

---

## Appendix A: Glossary

- **FFI (Foreign Function Interface):** Mechanism for calling native code from high-level languages
- **HMAC:** Hash-based Message Authentication Code for verifying data integrity
- **JWT:** JSON Web Token for secure information transmission
- **OAuth2:** Authorization framework for delegated access
- **Wasm (WebAssembly):** Binary instruction format for web browsers
- **IQD:** Iraqi Dinar currency code
- **PCI-DSS:** Payment Card Industry Data Security Standard
- **Idempotency:** Property ensuring repeated operations produce same result

## Appendix B: References

1. ZainCash Developer Documentation (if available)
2. FastPay API Specification (if available)
3. FIB Technical Integration Guide (if available)
4. Stripe API Design Principles
5. Rust FFI Documentation
6. Flutter Platform Channels Guide
7. OWASP Payment Gateway Security Guidelines

## Appendix C: Contact Information

**Project Lead:** [Your Name]  
**Email:** [your.email@university.edu]  
**GitHub:** [https://github.com/yourusername/mesopotamia-sdk]  
**University:** [Your University Name]  
**Department:** Computer Science / Software Engineering  
**Academic Advisor:** [Advisor Name]  

---

**Document Version:** 2.0  
**Last Updated:** January 1, 2026  
**Status:** Final for Implementation