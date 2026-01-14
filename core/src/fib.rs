// FIB (First Iraqi Bank) gateway implementation

use crate::client::HttpClient;
use crate::crypto::generate_hmac_sha256;
use crate::error::{MesopotamiaError, Result};
use crate::types::{Environment, PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

/// FIB gateway client with OAuth2 token caching
pub struct FIBClient {
    base_url: String,
    client_id: String,
    client_secret: String,
    client: HttpClient,
    token_cache: Arc<Mutex<Option<FIBTokenInfo>>>,
}

impl FIBClient {
    /// Create a new FIB client
    pub fn new(base_url: String, client_id: String, client_secret: String, timeout_ms: u64) -> Self {
        Self {
            base_url,
            client_id,
            client_secret,
            client: HttpClient::new(timeout_ms),
            token_cache: Arc::new(Mutex::new(None)),
        }
    }

    /// Create a payment transaction
    pub async fn create_payment(&self, request: &PaymentRequest) -> Result<PaymentResponse> {
        // Validate amount range
        let (min, max) = PaymentProvider::FIB.amount_range();
        if request.amount < min || request.amount > max {
            return Err(MesopotamiaError::InvalidAmount {
                min,
                max,
                provided: request.amount,
            });
        }

        // Validate order ID
        if request.order_id.len() > 50 {
            return Err(MesopotamiaError::InvalidOrderId {
                reason: "Order ID must be max 50 characters".to_string(),
            });
        }

        // Get or refresh access token
        let access_token = self.get_access_token().await?;

        // Build request body
        let body = FIBCreatePaymentRequest {
            amount: request.amount,
            order_id: request.order_id.clone(),
            callback_url: request.callback_url.clone(),
            webhook_url: request.webhook_url.clone(),
            description: request.description.clone().unwrap_or_default(),
            metadata: request.metadata.clone().unwrap_or_default(),
        };

        let response = self.client.execute_with_retry(|| async {
            let client = self.client.inner();
            let resp = client
                .post(format!("{}/payment/create", self.base_url))
                .header(AUTHORIZATION, format!("Bearer {}", access_token))
                .json(&body)
                .send()
                .await?;

            Ok(resp)
        }).await?;

        // Handle response
        let status = response.status();
        let response_text = response.text().await?;

        if status.is_success() {
            let create_response: FIBCreatePaymentResponse = serde_json::from_str(&response_text)
                .map_err(|e| MesopotamiaError::SerializationError(e))?;

            Ok(PaymentResponse {
                transaction_id: create_response.payment_id,
                redirect_url: create_response.web_url,
                deep_link: Some(create_response.deep_link),
                status: PaymentStatus::Pending,
                provider: PaymentProvider::FIB,
            })
        } else {
            self.handle_error(status, &response_text)
        }
    }

    /// Get payment status
    pub async fn get_payment_status(&self, payment_id: &str) -> Result<PaymentStatus> {
        let access_token = self.get_access_token().await?;

        let response = self.client.execute_with_retry(|| async {
            let client = self.client.inner();
            let resp = client
                .get(format!("{}/payment/status/{}", self.base_url, payment_id))
                .header(AUTHORIZATION, format!("Bearer {}", access_token))
                .send()
                .await?;

            Ok(resp)
        }).await?;

        let status_response: FIBPaymentStatusResponse = response.json().await?;
        Ok(parse_status(&status_response.status))
    }

    /// Get or refresh OAuth2 access token
    async fn get_access_token(&self) -> Result<String> {
        // Check if we have a valid cached token
        {
            let cache = self.token_cache.lock().unwrap();
            if let Some(ref token_info) = *cache {
                if token_info.is_valid() {
                    return Ok(token_info.access_token.clone());
                }
            }
        }

        // Need to fetch a new token
        let token_info = self.fetch_token().await?;

        // Cache the token
        {
            let mut cache = self.token_cache.lock().unwrap();
            *cache = Some(token_info.clone());
        }

        Ok(token_info.access_token)
    }

    /// Fetch new OAuth2 token from FIB
    async fn fetch_token(&self) -> Result<FIBTokenInfo> {
        let response = self.client.execute_with_retry(|| async {
            let client = self.client.inner();
            let resp = client
                .post(format!("{}/oauth/token", self.base_url))
                .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
                .form(&[
                    ("grant_type", "client_credentials"),
                    ("client_id", &self.client_id),
                    ("client_secret", &self.client_secret),
                ])
                .send()
                .await?;

            Ok(resp)
        }).await?;

        let status = response.status();
        let response_text = response.text().await?;

        if !status.is_success() {
            return if let Ok(error_resp) = serde_json::from_str::<FIBErrorResponse>(&response_text) {
                Err(MesopotamiaError::from_gateway_code(
                    "fib",
                    &error_resp.error,
                    &error_resp.error_description,
                ))
            } else {
                Err(MesopotamiaError::GatewayError {
                    provider: "fib".to_string(),
                    code: status.as_u16().to_string(),
                    message: response_text,
                })
            };
        }

        let token_response: FIBTokenResponse = serde_json::from_str(&response_text)
            .map_err(|e| MesopotamiaError::SerializationError(e))?;

        let expires_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| MesopotamiaError::Unknown(e.to_string()))?
            .as_secs() + token_response.expires_in - 300; // Refresh 5 minutes before expiry

        Ok(FIBTokenInfo {
            access_token: token_response.access_token,
            token_type: token_response.token_type,
            expires_at,
        })
    }

    /// Verify webhook signature
    pub fn verify_webhook(&self, signature: &str, payload: &str) -> bool {
        generate_hmac_sha256(&self.client_secret, payload)
            .map(|sig| format!("sha256={}", sig) == signature)
            .unwrap_or(false)
    }

    /// Handle error response from gateway
    fn handle_error(&self, status: reqwest::StatusCode, body: &str) -> Result<PaymentResponse> {
        if let Ok(error_resp) = serde_json::from_str::<FIBErrorResponse>(body) {
            Err(MesopotamiaError::from_gateway_code(
                "fib",
                &error_resp.error,
                &error_resp.error_description,
            ))
        } else {
            Err(MesopotamiaError::GatewayError {
                provider: "fib".to_string(),
                code: status.as_u16().to_string(),
                message: body.to_string(),
            })
        }
    }
}

/// FIB request/response types
#[derive(Debug, Serialize)]
struct FIBCreatePaymentRequest {
    amount: u64,
    order_id: String,
    callback_url: String,
    webhook_url: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    description: String,
    metadata: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
struct FIBCreatePaymentResponse {
    payment_id: String,
    status: String,
    deep_link: String,
    web_url: String,
    qr_code: String,
    valid_until: String,
}

#[derive(Debug, Deserialize)]
struct FIBPaymentStatusResponse {
    payment_id: String,
    status: String,
    amount: u64,
    order_id: String,
}

#[derive(Debug, Deserialize)]
struct FIBTokenResponse {
    access_token: String,
    token_type: String,
    expires_in: u64,
}

#[derive(Debug, Deserialize)]
struct FIBErrorResponse {
    error: String,
    error_description: String,
}

/// Cached token information
#[derive(Debug, Clone)]
struct FIBTokenInfo {
    access_token: String,
    token_type: String,
    expires_at: u64,
}

impl FIBTokenInfo {
    /// Check if token is still valid
    fn is_valid(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        now < self.expires_at
    }
}

/// Parse payment status from string
fn parse_status(status: &str) -> PaymentStatus {
    match status.to_lowercase().as_str() {
        "pending" => PaymentStatus::Pending,
        "completed" => PaymentStatus::Completed,
        "failed" => PaymentStatus::Failed,
        "cancelled" | "declined" => PaymentStatus::Cancelled,
        "expired" => PaymentStatus::Expired,
        _ => PaymentStatus::Pending,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_status() {
        assert_eq!(parse_status("pending"), PaymentStatus::Pending);
        assert_eq!(parse_status("completed"), PaymentStatus::Completed);
        assert_eq!(parse_status("FAILED"), PaymentStatus::Failed);
        assert_eq!(parse_status("declined"), PaymentStatus::Cancelled);
    }

    #[test]
    fn test_client_creation() {
        let client = FIBClient::new(
            "https://test.com".to_string(),
            "client_123".to_string(),
            "secret".to_string(),
            30000,
        );
        assert_eq!(client.client_id, "client_123");
        assert_eq!(client.base_url, "https://test.com");
    }

    #[test]
    fn test_token_validity() {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Valid token (expires in 1 hour)
        let valid_token = FIBTokenInfo {
            access_token: "test_token".to_string(),
            token_type: "Bearer".to_string(),
            expires_at: now + 3600,
        };
        assert!(valid_token.is_valid());

        // Expired token
        let expired_token = FIBTokenInfo {
            access_token: "test_token".to_string(),
            token_type: "Bearer".to_string(),
            expires_at: now - 100,
        };
        assert!(!expired_token.is_valid());
    }
}
