// Integration tests for Mesopotamia SDK gateways
// These tests require the mock gateway server to be running on localhost:8080
//
// To run: cargo test --test gateway_integration_test
//
// Start the mock gateway first:
//   cd mock-gateway && go run .

#![cfg(not(target_arch = "wasm32"))]

use mesopotamia_core::{
    Environment, FastPayClient, FIBClient, PaymentProvider, PaymentRequest, PaymentStatus,
    ZainCashClient,
};
use std::collections::HashMap;

const MOCK_GATEWAY_URL: &str = "http://localhost:8080";

// ZainCash test credentials from mock-gateway config.go
const ZAINCASH_MERCHANT_ID: &str = "merchant_123";
const ZAINCASH_SECRET: &str = "sandbox_secret_zaincash";

// FastPay test credentials
const FASTPAY_STORE_ID: &str = "store123";
const FASTPAY_PASSWORD: &str = "pass123";

// FIB test credentials
const FIB_CLIENT_ID: &str = "client123";
const FIB_CLIENT_SECRET: &str = "secret123";

#[tokio::test]
#[ignore] // Run with: cargo test --test gateway_integration_test -- --ignored
async fn test_zaincash_create_payment() {
    let client = ZainCashClient::new(
        format!("{}/zaincash", MOCK_GATEWAY_URL),
        ZAINCASH_MERCHANT_ID.to_string(),
        ZAINCASH_SECRET.to_string(),
        30000,
    );

    let request = PaymentRequest {
        provider: PaymentProvider::ZainCash,
        amount: 50000,
        order_id: "TEST_ORDER_001".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let response = client.create_payment(&request).await.unwrap();

    assert_eq!(response.provider, PaymentProvider::ZainCash);
    assert_eq!(response.status, PaymentStatus::Pending);
    assert!(!response.transaction_id.is_empty());
    assert!(!response.redirect_url.is_empty());
    assert!(response.deep_link.is_some());
}

#[tokio::test]
#[ignore]
async fn test_zaincash_amount_validation() {
    let client = ZainCashClient::new(
        format!("{}/zaincash", MOCK_GATEWAY_URL),
        ZAINCASH_MERCHANT_ID.to_string(),
        ZAINCASH_SECRET.to_string(),
        30000,
    );

    // Test amount too small
    let request = PaymentRequest {
        provider: PaymentProvider::ZainCash,
        amount: 500, // Below minimum 1000
        order_id: "TEST_ORDER_002".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let result = client.create_payment(&request).await;
    assert!(result.is_err());
}

#[tokio::test]
#[ignore]
async fn test_zaincash_get_status() {
    let client = ZainCashClient::new(
        format!("{}/zaincash", MOCK_GATEWAY_URL),
        ZAINCASH_MERCHANT_ID.to_string(),
        ZAINCASH_SECRET.to_string(),
        30000,
    );

    // First create a payment
    let request = PaymentRequest {
        provider: PaymentProvider::ZainCash,
        amount: 50000,
        order_id: "TEST_ORDER_003".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let response = client.create_payment(&request).await.unwrap();

    // Get status
    let status = client.get_payment_status(&response.transaction_id).await.unwrap();
    assert_eq!(status, PaymentStatus::Pending);
}

#[tokio::test]
#[ignore]
async fn test_fastpay_create_payment() {
    let client = FastPayClient::new(
        format!("{}/fastpay", MOCK_GATEWAY_URL),
        FASTPAY_STORE_ID.to_string(),
        FASTPAY_PASSWORD.to_string(),
        30000,
    );

    let request = PaymentRequest {
        provider: PaymentProvider::FastPay,
        amount: 50000,
        order_id: "TEST_ORDER_004".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: Some("Test payment".to_string()),
    };

    let response = client.create_payment(&request).await.unwrap();

    assert_eq!(response.provider, PaymentProvider::FastPay);
    assert_eq!(response.status, PaymentStatus::Pending);
    assert!(!response.transaction_id.is_empty());
    assert!(!response.redirect_url.is_empty());
}

#[tokio::test]
#[ignore]
async fn test_fastpay_amount_validation() {
    let client = FastPayClient::new(
        format!("{}/fastpay", MOCK_GATEWAY_URL),
        FASTPAY_STORE_ID.to_string(),
        FASTPAY_PASSWORD.to_string(),
        30000,
    );

    // Test amount too small
    let request = PaymentRequest {
        provider: PaymentProvider::FastPay,
        amount: 100, // Below minimum 500
        order_id: "TEST_ORDER_005".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let result = client.create_payment(&request).await;
    assert!(result.is_err());
}

#[tokio::test]
#[ignore]
async fn test_fastpay_get_status() {
    let client = FastPayClient::new(
        format!("{}/fastpay", MOCK_GATEWAY_URL),
        FASTPAY_STORE_ID.to_string(),
        FASTPAY_PASSWORD.to_string(),
        30000,
    );

    // First create a payment
    let request = PaymentRequest {
        provider: PaymentProvider::FastPay,
        amount: 50000,
        order_id: "TEST_ORDER_006".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let response = client.create_payment(&request).await.unwrap();

    // Get status
    let status = client.get_payment_status(&response.transaction_id).await.unwrap();
    assert_eq!(status, PaymentStatus::Pending);
}

#[tokio::test]
#[ignore]
async fn test_fib_create_payment() {
    let client = FIBClient::new(
        format!("{}/fib", MOCK_GATEWAY_URL),
        FIB_CLIENT_ID.to_string(),
        FIB_CLIENT_SECRET.to_string(),
        30000,
    );

    let request = PaymentRequest {
        provider: PaymentProvider::FIB,
        amount: 50000,
        order_id: "TEST_ORDER_007".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let response = client.create_payment(&request).await.unwrap();

    assert_eq!(response.provider, PaymentProvider::FIB);
    assert_eq!(response.status, PaymentStatus::Pending);
    assert!(!response.transaction_id.is_empty());
    assert!(!response.redirect_url.is_empty());
    assert!(response.deep_link.is_some());
}

#[tokio::test]
#[ignore]
async fn test_fib_oauth_token_caching() {
    let client = FIBClient::new(
        format!("{}/fib", MOCK_GATEWAY_URL),
        FIB_CLIENT_ID.to_string(),
        FIB_CLIENT_SECRET.to_string(),
        30000,
    );

    // First payment should fetch token
    let request = PaymentRequest {
        provider: PaymentProvider::FIB,
        amount: 50000,
        order_id: "TEST_ORDER_008".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let response1 = client.create_payment(&request).await.unwrap();
    assert!(!response1.transaction_id.is_empty());

    // Second payment should use cached token
    let request2 = PaymentRequest {
        provider: PaymentProvider::FIB,
        amount: 75000,
        order_id: "TEST_ORDER_009".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let response2 = client.create_payment(&request2).await.unwrap();
    assert!(!response2.transaction_id.is_empty());
}

#[tokio::test]
#[ignore]
async fn test_fib_get_status() {
    let client = FIBClient::new(
        format!("{}/fib", MOCK_GATEWAY_URL),
        FIB_CLIENT_ID.to_string(),
        FIB_CLIENT_SECRET.to_string(),
        30000,
    );

    // First create a payment
    let request = PaymentRequest {
        provider: PaymentProvider::FIB,
        amount: 50000,
        order_id: "TEST_ORDER_010".to_string(),
        callback_url: "http://example.com/callback".to_string(),
        webhook_url: "http://example.com/webhook".to_string(),
        metadata: None,
        description: None,
    };

    let response = client.create_payment(&request).await.unwrap();

    // Get status
    let status = client.get_payment_status(&response.transaction_id).await.unwrap();
    assert_eq!(status, PaymentStatus::Pending);
}

#[test]
#[ignore]
fn test_zaincash_webhook_verification() {
    let client = ZainCashClient::new(
        format!("{}/zaincash", MOCK_GATEWAY_URL),
        ZAINCASH_MERCHANT_ID.to_string(),
        ZAINCASH_SECRET.to_string(),
        30000,
    );

    let payload = r#"{"transaction_id":"tx_123","status":"completed"}"#;
    let signature = mesopotamia_core::crypto::generate_hmac_sha256(ZAINCASH_SECRET, payload).unwrap();

    assert!(client.verify_webhook(
        &format!("sha256={}", signature),
        payload
    ));

    // Invalid signature should fail
    assert!(!client.verify_webhook("sha256=invalid_signature", payload));
}

#[test]
#[ignore]
fn test_fastpay_webhook_verification() {
    let client = FastPayClient::new(
        format!("{}/fastpay", MOCK_GATEWAY_URL),
        FASTPAY_STORE_ID.to_string(),
        FASTPAY_PASSWORD.to_string(),
        30000,
    );

    let payload = r#"{"payment_id":"pay_123","status":"completed"}"#;
    let signature = mesopotamia_core::crypto::generate_hmac_sha256(FASTPAY_PASSWORD, payload).unwrap();

    assert!(client.verify_webhook(
        &format!("sha256={}", signature),
        payload
    ));
}

#[test]
#[ignore]
fn test_fib_webhook_verification() {
    let client = FIBClient::new(
        format!("{}/fib", MOCK_GATEWAY_URL),
        FIB_CLIENT_ID.to_string(),
        FIB_CLIENT_SECRET.to_string(),
        30000,
    );

    let payload = r#"{"payment_id":"pay_456","status":"completed"}"#;
    let signature = mesopotamia_core::crypto::generate_hmac_sha256(FIB_CLIENT_SECRET, payload).unwrap();

    assert!(client.verify_webhook(
        &format!("sha256={}", signature),
        payload
    ));
}
