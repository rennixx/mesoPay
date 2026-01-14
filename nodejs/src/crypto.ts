/**
 * Cryptographic utilities for Mesopotamia SDK
 * Note: These will be replaced by Rust FFI calls in Phase 2
 */

import * as crypto from 'crypto';
import { sign, verify } from 'jsonwebtoken';

/**
 * Default JWT expiry for ZainCash (5 minutes)
 */
export const DEFAULT_JWT_EXPIRY_SECS = 300;

/**
 * Webhook timestamp tolerance (5 minutes)
 */
export const WEBHOOK_TIMESTAMP_TOLERANCE_SECS = 300;

/**
 * Generate HMAC-SHA256 signature
 */
export function generateHmacSha256(secret: string, payload: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

/**
 * JWT claims for ZainCash
 */
export interface JwtClaims {
  merchant_id: string;
  amount: number;
  order_id: string;
  service_type: string;
  callback_url: string;
  webhook_url: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token with HS256 (ZainCash format)
 */
export function generateJwtHs256(
  merchantId: string,
  amount: number,
  orderId: string,
  callbackUrl: string,
  webhookUrl: string,
  secret: string,
  expirySeconds: number = DEFAULT_JWT_EXPIRY_SECS,
): string {
  const now = Math.floor(Date.now() / 1000);

  const claims: JwtClaims = {
    merchant_id: merchantId,
    amount,
    order_id: orderId,
    service_type: 'payment',
    callback_url: callbackUrl,
    webhook_url: webhookUrl,
    iat: now,
    exp: now + expirySeconds,
  };

  return sign(claims, secret, { algorithm: 'HS256' });
}

/**
 * Verify JWT token
 */
export function verifyJwtHs256(token: string, secret: string): JwtClaims {
  return verify(token, secret, { algorithms: ['HS256'] }) as JwtClaims;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  signature: string,
  payload: string,
  secret: string,
): boolean {
  // Extract signature from "sha256=..." format
  const sigBytes = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature;

  // Generate expected signature
  const expected = generateHmacSha256(secret, payload);

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sigBytes),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/**
 * Verify webhook signature with timestamp check
 */
export function verifyWebhookWithTimestamp(
  signature: string,
  payload: string,
  secret: string,
  timestamp: number,
): { valid: boolean; error?: string } {
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(now - timestamp);

  // Check timestamp is within tolerance (5 minutes)
  if (timeDiff > WEBHOOK_TIMESTAMP_TOLERANCE_SECS) {
    return {
      valid: false,
      error: `Webhook timestamp too old or too far in future: ${timeDiff} seconds`,
    };
  }

  // Verify signature
  const payloadWithTs = `${payload}${timestamp}`;
  const isValid = verifyWebhookSignature(signature, payloadWithTs, secret);

  return { valid: isValid };
}
