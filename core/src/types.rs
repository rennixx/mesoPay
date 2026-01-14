// Core types for Mesopotamia SDK

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Payment gateway providers supported by the SDK
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaymentProvider {
    /// ZainCash - JWT-based authentication
    ZainCash,
    /// FastPay - Basic Auth
    FastPay,
    /// First Iraqi Bank - OAuth2
    FIB,
}

impl PaymentProvider {
    /// Returns the display name of the provider
    pub fn name(&self) -> &str {
        match self {
            Self::ZainCash => "ZainCash",
            Self::FastPay => "FastPay",
            Self::FIB => "First Iraqi Bank",
        }
    }

    /// Returns the API base URL for the given environment
    pub fn base_url(&self, env: Environment) -> &str {
        match (self, env) {
            (Self::ZainCash, Environment::Sandbox) => "https://sandbox.zaincash.iq/api/v1",
            (Self::ZainCash, Environment::Production) => "https://api.zaincash.iq/api/v1",
            (Self::FastPay, Environment::Sandbox) => "https://sandbox-api.fast-pay.iq/v1",
            (Self::FastPay, Environment::Production) => "https://api.fast-pay.iq/v1",
            (Self::FIB, Environment::Sandbox) => "https://sandbox-fib.iq/api/v2",
            (Self::FIB, Environment::Production) => "https://api.fib.iq/api/v2",
        }
    }

    /// Returns the amount range for this provider (min, max)
    pub fn amount_range(&self) -> (u64, u64) {
        match self {
            Self::ZainCash => (1_000, 5_000_000),
            Self::FastPay => (500, 10_000_000),
            Self::FIB => (1_000, 100_000_000),
        }
    }
}

/// Environment (sandbox or production)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Environment {
    /// Sandbox/testing environment
    Sandbox,
    /// Production environment
    Production,
}

impl Default for Environment {
    fn default() -> Self {
        Self::Sandbox
    }
}

/// Payment status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PaymentStatus {
    /// Payment is pending
    Pending,
    /// Payment completed successfully
    Completed,
    /// Payment failed
    Failed,
    /// Payment was cancelled by user
    Cancelled,
    /// Payment expired
    Expired,
}

/// Payment request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentRequest {
    /// Amount in IQD (smallest unit)
    pub amount: u64,
    /// Merchant's unique order ID
    pub order_id: String,
    /// URL to redirect after payment
    pub callback_url: String,
    /// URL to send async confirmation
    pub webhook_url: String,
    /// Optional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, String>>,
    /// Optional description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

/// Payment response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentResponse {
    /// Unique transaction ID
    pub transaction_id: String,
    /// URL to redirect user to
    pub redirect_url: String,
    /// Deep link if supported
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deep_link: Option<String>,
    /// Payment status
    pub status: PaymentStatus,
    /// Provider used
    pub provider: PaymentProvider,
}

/// Provider configuration
#[derive(Debug, Clone)]
pub struct ProviderConfig {
    /// Merchant ID
    pub merchant_id: String,
    /// API key (for FastPay/FIB)
    pub api_key: String,
    /// API secret (for signing)
    pub api_secret: String,
    /// Optional base URL override
    pub base_url: Option<String>,
}

/// SDK configuration
#[derive(Debug, Clone)]
pub struct SdkConfig {
    /// Environment (sandbox or production)
    pub environment: Environment,
    /// Provider configurations
    pub provider_configs: HashMap<PaymentProvider, ProviderConfig>,
    /// Timeout in milliseconds
    pub timeout_ms: u64,
    /// Enable logging
    pub enable_logging: bool,
    /// Log level
    pub log_level: String,
}

impl Default for SdkConfig {
    fn default() -> Self {
        Self {
            environment: Environment::Sandbox,
            provider_configs: HashMap::new(),
            timeout_ms: crate::DEFAULT_TIMEOUT_MS,
            enable_logging: false,
            log_level: "info".to_string(),
        }
    }
}

/// JWT claims for ZainCash
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZainCashClaims {
    pub merchant_id: String,
    pub amount: u64,
    pub order_id: String,
    pub service_type: String,
    pub callback_url: String,
    pub webhook_url: String,
    pub exp: u64,
    pub iat: u64,
}

/// OAuth token response for FIB
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_amount_ranges() {
        assert_eq!(PaymentProvider::ZainCash.amount_range(), (1_000, 5_000_000));
        assert_eq!(PaymentProvider::FastPay.amount_range(), (500, 10_000_000));
        assert_eq!(PaymentProvider::FIB.amount_range(), (1_000, 100_000_000));
    }

    #[test]
    fn test_provider_base_urls() {
        assert_eq!(
            PaymentProvider::ZainCash.base_url(Environment::Sandbox),
            "https://sandbox.zaincash.iq/api/v1"
        );
        assert_eq!(
            PaymentProvider::FIB.base_url(Environment::Production),
            "https://api.fib.iq/api/v2"
        );
    }

    #[test]
    fn test_default_config() {
        let config = SdkConfig::default();
        assert_eq!(config.environment, Environment::Sandbox);
        assert_eq!(config.timeout_ms, 30000);
        assert!(!config.enable_logging);
    }
}
