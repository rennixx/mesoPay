# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Email**: Send details to security@mesopotamia.dev
2. **PGP**: Use our public key for encrypted communication (available on request)
3. **Do NOT** create public GitHub issues for security vulnerabilities

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Severity | Initial Response | Fix Timeline |
|----------|-----------------|--------------|
| Critical | 24 hours | 7 days |
| High | 48 hours | 30 days |
| Medium | 1 week | 90 days |
| Low | 2 weeks | Best effort |

### After Reporting

1. You will receive acknowledgment within 48 hours
2. We will investigate and keep you updated
3. Once fixed, we will coordinate disclosure
4. You will be credited in our security hall of fame (unless you prefer anonymity)

## Security Best Practices for Users

### API Credentials

❌ **Never do this:**
```dart
// WRONG: Hardcoded secrets
apiSecret: 'sk_live_abc123'
```

✅ **Do this instead:**
```javascript
// CORRECT: Environment variables
apiSecret: process.env.API_SECRET
```

### Webhook Verification

Always verify webhook signatures:

```javascript
const isValid = sdk.verifyWebhook(
  req.headers['x-mesopotamia-signature'],
  req.body,
  process.env.WEBHOOK_SECRET,
);

if (!isValid) {
  return res.status(401).send('Invalid signature');
}
```

### TLS/SSL

- Always use HTTPS in production
- SDK enforces TLS 1.2+ in production mode

### Data Handling

- SDK does not log PII
- Implement proper data retention policies
- Secure your webhook endpoints

## Known Security Measures

- Memory-safe Rust core
- Secrets zeroed from memory after use
- HMAC-SHA256 signature verification
- Automatic TLS enforcement
- Rate limiting support
- Circuit breaker for gateway protection

## Acknowledgments

We thank the following security researchers for their responsible disclosures:

*No vulnerabilities reported yet*
