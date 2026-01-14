// ZainCash gateway implementation

use crate::client::HttpClient;
use crate::crypto::{generate_hmac_sha256, generate_jwt_hs256, verify_webhook_signature, DEFAULT_JWT_EXPIRY_SECS};
use crate::error::{MesopotamiaError, Result};
use crate::types::{Environment, PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus};
use reqwest::header::{HeaderMap, AUTHORIZATION, CONTENT_TYPE};
use serde::Deserialize;
use std::collections::HashMap;

/// ZainCash gateway client
pub struct ZainCashClient {
    base_url: String,
    merchant_id: String,
    secret: String,
    client: HttpClient,
}

impl ZainCashClient {
    /// Create a new ZainCash client
    pub fn new(base_url: String, merchant_id: String, secret: String, timeout_ms: u64) -> Self {
        Self {
            base_url,
            merchant_id,
            secret,
            client: HttpClient::new(timeout_ms),
        }
    }

    /// Create a payment transaction
    pub async fn create_payment(&self, request: &PaymentRequest) -> Result<PaymentResponse> {
        // Validate amount range
        let (min, max) = PaymentProvider::ZainCash.amount_range();
        if request.amount < min || request.amount > max {
            return Err(MesopotamiaError::InvalidAmount {
                min,
                max,
                provided: request.amount,
            });
        }

        // Validate order ID format
        if request.order_id.len() > 50 || !request.order_id.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
            return Err(MesopotamiaError::InvalidOrderId {
                reason: "Order ID must be alphanumeric with optional _ or -, max 50 chars".to_string(),
            });
        }

        // Generate JWT token
        let token = generate_jwt_hs256(
            &self.merchant_id,
            request.amount,
            &request.order_id,
            &request.callback_url,
            &request.webhook_url,
            &self.secret,
            DEFAULT_JWT_EXPIRY_SECS,
        )?;

        // Build request
        let body = ZainCashInitRequest { token: token.clone() };

        let response = self.client.execute_with_retry(|| async {
            let client = self.client.inner();
            let resp = client
                .post(format!("{}/transaction/init", self.base_url))
                .json(&body)
                .send()
                .await?;

            Ok(resp)
        }).await?;

        // Handle response
        let status = response.status();
        let response_text = response.text().await?;

        if status.is_success() {
            let init_response: ZainCashInitResponse = serde_json::from_str(&response_text)
                .map_err(|e| MesopotamiaError::SerializationError(e))?;

            Ok(PaymentResponse {
                transaction_id: init_response.transaction_id,
                redirect_url: init_response.redirect_url,
                deep_link: Some(init_response.deep_link),
                status: PaymentStatus::Pending,
                provider: PaymentProvider::ZainCash,
            })
        } else {
            self.handle_error(status, &response_text)
        }
    }

    /// Get payment status
    pub async fn get_payment_status(&self, transaction_id: &str) -> Result<PaymentStatus> {
        let response = self.client.execute_with_retry(|| async {
            let client = self.client.inner();
            let resp = client
                .get(format!("{}/transaction/status/{}", self.base_url, transaction_id))
                .send()
                .await?;

            Ok(resp)
        }).await?;

        let status_response: ZainCashStatusResponse = response.json().await?;
        Ok(parse_status(&status_response.status))
    }

    /// Verify webhook signature
    pub fn verify_webhook(&self, signature: &str, payload: &str) -> bool {
        verify_webhook_signature(signature, payload, &self.secret)
    }

    /// Handle error response from gateway
    fn handle_error(&self, status: reqwest::StatusCode, body: &str) -> Result<PaymentResponse> {
        if let Ok(error_resp) = serde_json::from_str::<ZainCashErrorResponse>(body) {
            Err(MesopotamiaError::from_gateway_code(
                "zaincash",
                &error_resp.code,
                &error_resp.message,
            ))
        } else {
            Err(MesopotamiaError::GatewayError {
                provider: "zaincash".to_string(),
                code: status.as_u16().to_string(),
                message: body.to_string(),
            })
        }
    }
}

/// ZainCash request/response types
#[derive(Debug, Serialize)]
struct ZainCashInitRequest {
    token: String,
}

#[derive(Debug, Deserialize)]
struct ZainCashInitResponse {
    transaction_id: String,
    redirect_url: String,
    deep_link: String,
    status: String,
}

#[derive(Debug, Deserialize)]
struct ZainCashStatusResponse {
    transaction_id: String,
    status: String,
    amount: u64,
    order_id: String,
}

#[derive(Debug, Deserialize)]
struct ZainCashErrorResponse {
    error: String,
    code: String,
    message: String,
}

/// Parse payment status from string
fn parse_status(status: &str) -> PaymentStatus {
    match status.to_lowercase().as_str() {
        "pending" => PaymentStatus::Pending,
        "completed" => PaymentStatus::Completed,
        "failed" => PaymentStatus::Failed,
        "cancelled" => PaymentStatus::Cancelled,
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
        assert_eq!(parse_status("unknown"), PaymentStatus::Pending);
    }

    #[test]
    fn test_client_creation() {
        let client = ZainCashClient::new(
            "https://test.com".to_string(),
            "merchant_123".to_string(),
            "secret".to_string(),
            30000,
        );
        assert_eq!(client.merchant_id, "merchant_123");
        assert_eq!(client.base_url, "https://test.com");
    }
}
