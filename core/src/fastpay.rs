// FastPay gateway implementation

use crate::client::HttpClient;
use crate::crypto::generate_hmac_sha256;
use crate::error::{MesopotamiaError, Result};
use crate::types::{Environment, PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus};
use reqwest::header::HeaderMap;
use serde::Serialize;
use std::collections::HashMap;

/// FastPay gateway client
pub struct FastPayClient {
    base_url: String,
    store_id: String,
    password: String,
    client: HttpClient,
}

impl FastPayClient {
    /// Create a new FastPay client
    pub fn new(base_url: String, store_id: String, password: String, timeout_ms: u64) -> Self {
        Self {
            base_url,
            store_id,
            password,
            client: HttpClient::new(timeout_ms),
        }
    }

    /// Create a payment transaction
    pub async fn create_payment(&self, request: &PaymentRequest) -> Result<PaymentResponse> {
        // Validate amount range
        let (min, max) = PaymentProvider::FastPay.amount_range();
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

        // Build request body
        let body = FastPayInitRequest {
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
                .post(format!("{}/payment/init", self.base_url))
                .basic_auth(&self.store_id, Some(&self.password))
                .json(&body)
                .send()
                .await?;

            Ok(resp)
        }).await?;

        // Handle response
        let status = response.status();
        let response_text = response.text().await?;

        if status.is_success() {
            let init_response: FastPayInitResponse = serde_json::from_str(&response_text)
                .map_err(|e| MesopotamiaError::SerializationError(e))?;

            Ok(PaymentResponse {
                transaction_id: init_response.payment_id,
                redirect_url: init_response.redirect_url,
                deep_link: None,
                status: PaymentStatus::Pending,
                provider: PaymentProvider::FastPay,
            })
        } else {
            self.handle_error(status, &response_text)
        }
    }

    /// Get payment status
    pub async fn get_payment_status(&self, payment_id: &str) -> Result<PaymentStatus> {
        let response = self.client.execute_with_retry(|| async {
            let client = self.client.inner();
            let resp = client
                .get(format!("{}/payment/status/{}", self.base_url, payment_id))
                .basic_auth(&self.store_id, Some(&self.password))
                .send()
                .await?;

            Ok(resp)
        }).await?;

        let status_response: FastPayStatusResponse = response.json().await?;
        Ok(parse_status(&status_response.status))
    }

    /// Process refund
    pub async fn refund(&self, payment_id: &str, amount: u64, reason: Option<String>) -> Result<FastPayRefundResponse> {
        let body = FastPayRefundRequest {
            payment_id: payment_id.to_string(),
            amount,
            reason: reason.unwrap_or_default(),
        };

        let response = self.client.execute_with_retry(|| async {
            let client = self.client.inner();
            let resp = client
                .post(format!("{}/payment/refund", self.base_url))
                .basic_auth(&self.store_id, Some(&self.password))
                .json(&body)
                .send()
                .await?;

            Ok(resp)
        }).await?;

        let refund_response: FastPayRefundResponse = response.json().await?;
        Ok(refund_response)
    }

    /// Verify webhook signature
    pub fn verify_webhook(&self, signature: &str, payload: &str) -> bool {
        generate_hmac_sha256(&self.password, payload)
            .map(|sig| format!("sha256={}", sig) == signature)
            .unwrap_or(false)
    }

    /// Handle error response from gateway
    fn handle_error(&self, status: reqwest::StatusCode, body: &str) -> Result<PaymentResponse> {
        if let Ok(error_resp) = serde_json::from_str::<FastPayErrorResponse>(body) {
            Err(MesopotamiaError::from_gateway_code(
                "fastpay",
                &error_resp.code,
                &error_resp.message,
            ))
        } else {
            Err(MesopotamiaError::GatewayError {
                provider: "fastpay".to_string(),
                code: status.as_u16().to_string(),
                message: body.to_string(),
            })
        }
    }
}

/// FastPay request/response types
#[derive(Debug, Serialize)]
struct FastPayInitRequest {
    amount: u64,
    order_id: String,
    callback_url: String,
    webhook_url: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    description: String,
    metadata: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
struct FastPayInitResponse {
    payment_id: String,
    redirect_url: String,
    status: String,
    expires_at: String,
}

#[derive(Debug, Deserialize)]
struct FastPayStatusResponse {
    payment_id: String,
    status: String,
    amount: u64,
    order_id: String,
}

#[derive(Debug, Serialize)]
struct FastPayRefundRequest {
    payment_id: String,
    amount: u64,
    reason: String,
}

#[derive(Debug, Deserialize)]
pub struct FastPayRefundResponse {
    pub refund_id: String,
    pub payment_id: String,
    pub amount: u64,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
struct FastPayErrorResponse {
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
        "refunded" => PaymentStatus::Cancelled, // Treat refunded as cancelled for now
        _ => PaymentStatus::Pending,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_parse_status() {
        assert_eq!(parse_status("pending"), PaymentStatus::Pending);
        assert_eq!(parse_status("completed"), PaymentStatus::Completed);
        assert_eq!(parse_status("FAILED"), PaymentStatus::Failed);
        assert_eq!(parse_status("refunded"), PaymentStatus::Cancelled);
    }

    #[test]
    fn test_client_creation() {
        let client = FastPayClient::new(
            "https://test.com".to_string(),
            "store_123".to_string(),
            "pass".to_string(),
            30000,
        );
        assert_eq!(client.store_id, "store_123");
        assert_eq!(client.base_url, "https://test.com");
    }
}
