// mesopotamia-core
// Core library for Mesopotamia SDK - Unified Iraqi payment infrastructure

#![warn(missing_docs)]
#![warn(unused_extern_crates)]
// FFI requires unsafe code
#![allow(unsafe_code)]

pub mod crypto;
pub mod error;
pub mod gateway;
pub mod client;
pub mod config;
pub mod types;

// Gateway implementations
pub mod zaincash;
pub mod fastpay;
pub mod fib;

// Re-exports for convenience
pub use error::{MesopotamiaError, Result};
pub use types::{PaymentProvider, PaymentRequest, PaymentResponse, PaymentStatus, Environment, SdkConfig, ProviderConfig};

// Gateway clients
pub use zaincash::ZainCashClient;
pub use fastpay::FastPayClient;
pub use fib::FIBClient;

/// Mesopotamia SDK - Core library for unified Iraqi payment gateway integration
///
/// This library provides a single, secure integration point for all major Iraqi payment gateways:
/// - ZainCash (JWT-based authentication)
/// - FastPay (Basic Auth)
/// - First Iraqi Bank - FIB (OAuth2)
///
/// # Example
///
/// ```no_run
/// use mesopotamia_core::{SdkConfig, PaymentProvider, Environment};
/// use std::collections::HashMap;
///
/// let config = SdkConfig {
///     environment: Environment::Sandbox,
///     timeout_ms: 30000,
///     ..Default::default()
/// };
/// ```

/// SDK version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Default HTTP timeout in milliseconds
pub const DEFAULT_TIMEOUT_MS: u64 = 30000;

/// Maximum retries for network requests
pub const MAX_RETRIES: u32 = 3;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!VERSION.is_empty());
    }
}
