// Cryptographic operations for Mesopotamia SDK

use crate::error::{MesopotamiaError, Result};
use crate::types::{Environment, PaymentProvider, ZainCashClaims};
use hmac::{Hmac, Mac};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

/// Default JWT expiry for ZainCash (5 minutes)
pub const DEFAULT_JWT_EXPIRY_SECS: u64 = 300;

/// Webhook timestamp tolerance (5 minutes)
pub const WEBHOOK_TIMESTAMP_TOLERANCE_SECS: u64 = 300;

/// Generate HMAC-SHA256 signature
///
/// # Arguments
/// * `secret` - The secret key for signing
/// * `payload` - The payload to sign
///
/// # Returns
/// Hex-encoded signature string
pub fn generate_hmac_sha256(secret: &str, payload: &str) -> Result<String> {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|e| MesopotamiaError::CryptoError(e.to_string()))?;
    mac.update(payload.as_bytes());
    let result = mac.finalize();
    Ok(hex::encode(result.into_bytes()))
}

/// Generate JWT token with HS256 (ZainCash format)
///
/// # Arguments
/// * `merchant_id` - Merchant ID
/// * `amount` - Amount in IQD
/// * `order_id` - Order ID
/// * `callback_url` - Callback URL
/// * `webhook_url` - Webhook URL
/// * `secret` - Secret for signing
/// * `expiry_seconds` - Token expiry in seconds (default 300 = 5 minutes)
///
/// # Returns
/// JWT token string
pub fn generate_jwt_hs256(
    merchant_id: &str,
    amount: u64,
    order_id: &str,
    callback_url: &str,
    webhook_url: &str,
    secret: &str,
    expiry_seconds: u64,
) -> Result<String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| MesopotamiaError::Unknown(e.to_string()))?
        .as_secs();

    let claims = ZainCashClaims {
        merchant_id: merchant_id.to_string(),
        amount,
        order_id: order_id.to_string(),
        service_type: "payment".to_string(),
        callback_url: callback_url.to_string(),
        webhook_url: webhook_url.to_string(),
        iat: now,
        exp: now + expiry_seconds,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    ).map_err(|e| MesopotamiaError::CryptoError(format!("Failed to sign JWT: {}", e)))?;

    Ok(token)
}

/// Verify webhook signature
///
/// # Arguments
/// * `signature` - The signature from header (format: "sha256=...")
/// * `payload` - The request payload
/// * `secret` - The webhook secret
///
/// # Returns
/// true if signature is valid, false otherwise
pub fn verify_webhook_signature(signature: &str, payload: &str, secret: &str) -> bool {
    // Extract signature from "sha256=..." format
    let sig_bytes = match signature.strip_prefix("sha256=") {
        Some(s) => s,
        None => return false,
    };

    // Generate expected signature
    match generate_hmac_sha256(secret, payload) {
        Ok(expected) => {
            // Constant-time comparison to prevent timing attacks
            use subtle::ConstantTimeEq;
            let expected_bytes = expected.as_bytes();
            let provided_bytes = sig_bytes.as_bytes();

            if expected_bytes.len() != provided_bytes.len() {
                return false;
            }

            expected_bytes.ct_eq(provided_bytes).into()
        }
        Err(_) => false,
    }
}

/// Verify webhook signature with timestamp check
///
/// # Arguments
/// * `signature` - The signature from header
/// * `payload` - The request payload
/// * `secret` - The webhook secret
/// * `timestamp` - Unix timestamp from webhook header
///
/// # Returns
/// Ok(true) if valid, Err if invalid or expired
pub fn verify_webhook_with_timestamp(
    signature: &str,
    payload: &str,
    secret: &str,
    timestamp: i64,
) -> Result<bool> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| MesopotamiaError::Unknown(e.to_string()))?
        .as_secs() as i64;

    // Check timestamp is within tolerance (5 minutes)
    let time_diff = (now - timestamp).abs();
    if time_diff > WEBHOOK_TIMESTAMP_TOLERANCE_SECS as i64 {
        return Err(MesopotamiaError::ConfigurationError {
            message: format!("Webhook timestamp too old or too far in future: {} seconds", time_diff),
        });
    }

    // Verify signature
    let payload_with_ts = format!("{}{}", payload, timestamp);
    Ok(verify_webhook_signature(signature, &payload_with_ts, secret))
}

/// Verify and decode JWT token
///
/// # Arguments
/// * `token` - The JWT token
/// * `secret` - The secret used for signing
///
/// # Returns
/// The decoded claims if valid
pub fn verify_jwt_hs256(token: &str, secret: &str) -> Result<ZainCashClaims> {
    let token_data = decode::<ZainCashClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    ).map_err(|e| MesopotamiaError::InvalidJwt(e.to_string()))?;

    Ok(token_data.claims)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hmac_generation() {
        let secret = "test_secret";
        let payload = "test_payload";
        let result = generate_hmac_sha256(secret, payload);
        assert!(result.is_ok());
        assert!(!result.unwrap().is_empty());
    }

    #[test]
    fn test_hmac_consistent() {
        let secret = "test_secret";
        let payload = "test_payload";
        let sig1 = generate_hmac_sha256(secret, payload).unwrap();
        let sig2 = generate_hmac_sha256(secret, payload).unwrap();
        assert_eq!(sig1, sig2);
    }

    #[test]
    fn test_webhook_verification() {
        let secret = "webhook_secret";
        let payload = r#"{"transaction_id":"123","status":"completed"}"#;

        let valid_sig = generate_hmac_sha256(secret, payload).unwrap();
        assert!(verify_webhook_signature(
            &format!("sha256={}", valid_sig),
            payload,
            secret
        ));

        assert!(!verify_webhook_signature("sha256=invalid", payload, secret));
    }

    #[test]
    fn test_webhook_with_timestamp() {
        let secret = "webhook_secret";
        let payload = r#"{"transaction_id":"123","status":"completed"}"#;
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let sig = generate_hmac_sha256(secret, &format!("{}{}", payload, timestamp)).unwrap();
        let result = verify_webhook_with_timestamp(
            &format!("sha256={}", sig),
            payload,
            secret,
            timestamp,
        );

        assert!(result.is_ok());
        assert!(result.unwrap());
    }

    #[test]
    fn test_webhook_timestamp_expired() {
        let secret = "webhook_secret";
        let payload = r#"{"transaction_id":"123"}"#;
        let old_timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64 - 400; // 6+ minutes ago

        let sig = generate_hmac_sha256(secret, &format!("{}{}", payload, old_timestamp)).unwrap();
        let result = verify_webhook_with_timestamp(
            &format!("sha256={}", sig),
            payload,
            secret,
            old_timestamp,
        );

        assert!(result.is_err());
    }

    #[test]
    fn test_jwt_generation() {
        let token = generate_jwt_hs256(
            "merchant_123",
            50000,
            "ORDER_123",
            "https://example.com/callback",
            "https://example.com/webhook",
            "secret",
            300,
        );

        assert!(token.is_ok());
        let token_str = token.unwrap();

        // JWT should have 3 parts separated by dots
        let parts: Vec<&str> = token_str.split('.').collect();
        assert_eq!(parts.len(), 3);
    }

    #[test]
    fn test_jwt_verification() {
        let secret = "test_secret";
        let token = generate_jwt_hs256(
            "merchant_123",
            50000,
            "ORDER_123",
            "https://example.com/callback",
            "https://example.com/webhook",
            secret,
            300,
        ).unwrap();

        let claims = verify_jwt_hs256(&token, secret).unwrap();
        assert_eq!(claims.merchant_id, "merchant_123");
        assert_eq!(claims.amount, 50000);
        assert_eq!(claims.order_id, "ORDER_123");
    }

    #[test]
    fn test_jwt_verification_wrong_secret() {
        let token = generate_jwt_hs256(
            "merchant_123",
            50000,
            "ORDER_123",
            "https://example.com/callback",
            "https://example.com/webhook",
            "secret1",
            300,
        ).unwrap();

        let result = verify_jwt_hs256(&token, "secret2");
        assert!(result.is_err());
    }

    #[test]
    fn test_constants() {
        assert_eq!(DEFAULT_JWT_EXPIRY_SECS, 300);
        assert_eq!(WEBHOOK_TIMESTAMP_TOLERANCE_SECS, 300);
    }
}
