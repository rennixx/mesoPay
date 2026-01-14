// Error types for Mesopotamia SDK

use thiserror::Error;

/// Result type alias for Mesopotamia SDK
pub type Result<T> = std::result::Result<T, MesopotamiaError>;

/// Main error type for Mesopotamia SDK
#[derive(Error, Debug)]
pub enum MesopotamiaError {
    /// Network timeout
    #[error("Network timeout for {provider} after {duration_ms}ms")]
    NetworkTimeout {
        provider: String,
        duration_ms: u64,
    },

    /// Connection failed
    #[error("Connection failed to {provider}: {reason}")]
    ConnectionFailed { provider: String, reason: String },

    /// Invalid credentials
    #[error("Invalid credentials for {provider}")]
    InvalidCredentials { provider: String },

    /// Token expired
    #[error("Token expired for {provider}")]
    TokenExpired { provider: String },

    /// Invalid amount
    #[error("Invalid amount {provided}: must be between {min} and {max}")]
    InvalidAmount { min: u64, max: u64, provided: u64 },

    /// Invalid order ID
    #[error("Invalid order ID: {reason}")]
    InvalidOrderId { reason: String },

    /// Invalid URL
    #[error("Invalid URL: {url}")]
    InvalidUrl { url: String },

    /// Gateway error
    #[error("Gateway error from {provider} (code: {code}): {message}")]
    GatewayError {
        provider: String,
        code: String,
        message: String,
    },

    /// Payment declined
    #[error("Payment declined by {provider}: {reason}")]
    PaymentDeclined { provider: String, reason: String },

    /// Configuration error
    #[error("Configuration error: {message}")]
    ConfigurationError { message: String },

    /// Unsupported provider
    #[error("Unsupported provider: {provider}")]
    UnsupportedProvider { provider: String },

    /// Serialization/deserialization error
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    /// HTTP client error
    #[error("HTTP client error: {0}")]
    HttpClientError(String),

    /// Cryptography error
    #[error("Cryptography error: {0}")]
    CryptoError(String),

    /// Invalid JWT
    #[error("Invalid JWT: {0}")]
    InvalidJwt(String),

    /// IO error
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    /// Unknown error
    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<reqwest::Error> for MesopotamiaError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_timeout() {
            MesopotamiaError::NetworkTimeout {
                provider: "unknown".to_string(),
                duration_ms: 0,
            }
        } else if err.is_connect() {
            MesopotamiaError::ConnectionFailed {
                provider: "unknown".to_string(),
                reason: err.to_string(),
            }
        } else {
            MesopotamiaError::HttpClientError(err.to_string())
        }
    }
}

impl From<hmac::digest::InvalidLength> for MesopotamiaError {
    fn from(err: hmac::digest::InvalidLength) -> Self {
        MesopotamiaError::CryptoError(format!("Invalid HMAC key length: {}", err))
    }
}

impl From<jsonwebtoken::errors::Error> for MesopotamiaError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        MesopotamiaError::InvalidJwt(err.to_string())
    }
}

/// Error codes matching gateway responses
impl MesopotamiaError {
    /// Convert gateway error code to MesopotamiaError
    pub fn from_gateway_code(provider: &str, code: &str, message: &str) -> Self {
        match code {
            "INSUFFICIENT_BALANCE" | "AMOUNT_TOO_LOW" | "AMOUNT_TOO_HIGH" => {
                Self::PaymentDeclined {
                    provider: provider.to_string(),
                    reason: message.to_string(),
                }
            }
            "INVALID_TOKEN" | "TOKEN_EXPIRED" => Self::TokenExpired {
                provider: provider.to_string(),
            },
            "INVALID_CREDENTIALS" | "INVALID_CLIENT" => Self::InvalidCredentials {
                provider: provider.to_string(),
            },
            "DUPLICATE_ORDER" => Self::InvalidOrderId {
                reason: "Order ID already used".to_string(),
            },
            "SESSION_EXPIRED" => Self::PaymentDeclined {
                provider: provider.to_string(),
                reason: "Session expired".to_string(),
            },
            "PAYMENT_DECLINED" | "ACCOUNT_RESTRICTED" => Self::PaymentDeclined {
                provider: provider.to_string(),
                reason: message.to_string(),
            },
            _ => Self::GatewayError {
                provider: provider.to_string(),
                code: code.to_string(),
                message: message.to_string(),
            },
        }
    }

    /// Check if error is retryable
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            Self::NetworkTimeout { .. }
                | Self::ConnectionFailed { .. }
                | Self::GatewayError { .. }
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_retryable() {
        assert!(MesopotamiaError::NetworkTimeout {
            provider: "test".to_string(),
            duration_ms: 1000
        }
        .is_retryable());

        assert!(!MesopotamiaError::InvalidCredentials {
            provider: "test".to_string()
        }
        .is_retryable());
    }

    #[test]
    fn test_gateway_error_conversion() {
        let err = MesopotamiaError::from_gateway_code("zaincash", "INVALID_TOKEN", "Token expired");
        assert!(matches!(err, MesopotamiaError::TokenExpired { .. }));

        let err = MesopotamiaError::from_gateway_code("fastpay", "AMOUNT_TOO_LOW", "Amount too low");
        assert!(matches!(err, MesopotamiaError::PaymentDeclined { .. }));
    }
}
