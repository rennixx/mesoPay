// Integration tests for Mesopotamia Core

use mesopotamia_core::{
    PaymentProvider, PaymentRequest, PaymentStatus, SdkConfig, Environment,
    crypto::{generate_hmac_sha256, verify_webhook_signature, generate_jwt_hs256},
};

#[test]
fn test_sdk_version() {
    assert!(!mesopotamia_core::VERSION.is_empty());
}

#[test]
fn test_provider_enum() {
    assert_eq!(PaymentProvider::ZainCash.name(), "ZainCash");
    assert_eq!(PaymentProvider::FastPay.name(), "FastPay");
    assert_eq!(PaymentProvider::FIB.name(), "First Iraqi Bank");
}

#[test]
fn test_hmac_sha256() {
    let secret = "test_secret";
    let payload = "test_payload";

    let sig1 = generate_hmac_sha256(secret, payload).unwrap();
    let sig2 = generate_hmac_sha256(secret, payload).unwrap();

    // Same input should produce same signature
    assert_eq!(sig1, sig2);

    // Different input should produce different signature
    let sig3 = generate_hmac_sha256(secret, "different").unwrap();
    assert_ne!(sig1, sig3);
}

#[test]
fn test_webhook_verification() {
    let secret = "webhook_secret";
    let payload = r#"{"transaction_id":"tx_123","status":"completed","amount":50000}"#;

    // Generate valid signature
    let valid_sig = generate_hmac_sha256(secret, payload).unwrap();
    assert!(verify_webhook_signature(
        &format!("sha256={}", valid_sig),
        payload,
        secret
    ));

    // Invalid signature should fail
    assert!(!verify_webhook_signature("sha256=invalid_signature", payload, secret));

    // Wrong secret should fail
    assert!(!verify_webhook_signature(
        &format!("sha256={}", valid_sig),
        payload,
        "wrong_secret"
    ));
}

#[test]
fn test_jwt_generation() {
    let token = generate_jwt_hs256(
        "merchant_123",
        50000,
        "ORDER_123",
        "https://example.com/callback",
        "https://example.com/webhook",
        "test_secret",
        300,
    );

    assert!(token.is_ok());
    let token_str = token.unwrap();

    // JWT should have 3 parts separated by dots
    let parts: Vec<&str> = token_str.split('.').collect();
    assert_eq!(parts.len(), 3);
}

#[test]
fn test_config_validation() {
    // Empty config should fail
    let config = SdkConfig::default();
    assert!(config.validate().is_err());

    // Config with provider should pass
    use mesopotamia_core::ProviderConfig;
    use std::collections::HashMap;

    let mut config = SdkConfig::new(Environment::Sandbox);
    config.provider_configs.insert(
        PaymentProvider::ZainCash,
        ProviderConfig {
            merchant_id: "test_merchant".to_string(),
            api_key: "test_key".to_string(),
            api_secret: "test_secret".to_string(),
            base_url: None,
        },
    );
    assert!(config.validate().is_ok());
}

#[test]
fn test_provider_amount_ranges() {
    assert_eq!(PaymentProvider::ZainCash.amount_range(), (1_000, 5_000_000));
    assert_eq!(PaymentProvider::FastPay.amount_range(), (500, 10_000_000));
    assert_eq!(PaymentProvider::FIB.amount_range(), (1_000, 100_000_000));
}
