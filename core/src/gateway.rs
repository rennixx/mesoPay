// Gateway abstraction layer

use crate::types::{PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus};

/// Gateway client trait
pub trait GatewayClient {
    /// Create a payment transaction
    fn create_payment(&self, request: PaymentRequest) -> crate::Result<PaymentResponse>;

    /// Get payment status
    fn get_payment_status(&self, transaction_id: &str) -> crate::Result<PaymentStatus>;
}

/// ZainCash gateway client
pub struct ZainCashClient {
    base_url: String,
    merchant_id: String,
    secret: String,
}

impl ZainCashClient {
    pub fn new(base_url: String, merchant_id: String, secret: String) -> Self {
        Self {
            base_url,
            merchant_id,
            secret,
        }
    }
}

/// FastPay gateway client
pub struct FastPayClient {
    base_url: String,
    store_id: String,
    password: String,
}

impl FastPayClient {
    pub fn new(base_url: String, store_id: String, password: String) -> Self {
        Self {
            base_url,
            store_id,
            password,
        }
    }
}

/// FIB gateway client
pub struct FIBClient {
    base_url: String,
    client_id: String,
    client_secret: String,
}

impl FIBClient {
    pub fn new(base_url: String, client_id: String, client_secret: String) -> Self {
        Self {
            base_url,
            client_id,
            client_secret,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let zaincash = ZainCashClient::new(
            "https://test.com".to_string(),
            "merchant_123".to_string(),
            "secret".to_string(),
        );
        assert_eq!(zaincash.merchant_id, "merchant_123");

        let fastpay = FastPayClient::new(
            "https://test.com".to_string(),
            "store_123".to_string(),
            "pass".to_string(),
        );
        assert_eq!(fastpay.store_id, "store_123");

        let fib = FIBClient::new(
            "https://test.com".to_string(),
            "client_123".to_string(),
            "secret".to_string(),
        );
        assert_eq!(fib.client_id, "client_123");
    }
}
