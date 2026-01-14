// Configuration management for Mesopotamia SDK

use crate::error::{MesopotamiaError, Result};
use crate::types::{Environment, PaymentProvider, ProviderConfig, SdkConfig};
use std::collections::HashMap;

impl SdkConfig {
    /// Create a new SDK configuration
    pub fn new(environment: Environment) -> Self {
        Self {
            environment,
            ..Default::default()
        }
    }

    /// Add a provider configuration
    pub fn with_provider(mut self, provider: PaymentProvider, config: ProviderConfig) -> Self {
        self.provider_configs.insert(provider, config);
        self
    }

    /// Set timeout
    pub fn with_timeout(mut self, timeout_ms: u64) -> Self {
        self.timeout_ms = timeout_ms;
        self
    }

    /// Enable logging
    pub fn with_logging(mut self, enable: bool) -> Self {
        self.enable_logging = enable;
        self
    }

    /// Validate the configuration
    pub fn validate(&self) -> Result<()> {
        if self.provider_configs.is_empty() {
            return Err(MesopotamiaError::ConfigurationError {
                message: "At least one provider must be configured".to_string(),
            });
        }

        // Validate each provider config
        for (provider, config) in &self.provider_configs {
            if config.merchant_id.is_empty() {
                return Err(MesopotamiaError::ConfigurationError {
                    message: format!("Merchant ID is required for {:?}", provider),
                });
            }
            if config.api_key.is_empty() {
                return Err(MesopotamiaError::ConfigurationError {
                    message: format!("API key is required for {:?}", provider),
                });
            }
            if config.api_secret.is_empty() {
                return Err(MesopotamiaError::ConfigurationError {
                    message: format!("API secret is required for {:?}", provider),
                });
            }
        }

        Ok(())
    }

    /// Get provider configuration
    pub fn get_provider(&self, provider: PaymentProvider) -> Result<&ProviderConfig> {
        self.provider_configs.get(&provider).ok_or_else(|| {
            MesopotamiaError::ConfigurationError {
                message: format!("Provider {:?} is not configured", provider),
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_builder() {
        let config = SdkConfig::new(Environment::Sandbox)
            .with_timeout(5000)
            .with_logging(true);

        assert_eq!(config.environment, Environment::Sandbox);
        assert_eq!(config.timeout_ms, 5000);
        assert!(config.enable_logging);
    }

    #[test]
    fn test_config_validation_empty() {
        let config = SdkConfig::default();
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_validation_success() {
        let mut config = SdkConfig::new(Environment::Sandbox);
        config.provider_configs.insert(
            PaymentProvider::ZainCash,
            ProviderConfig {
                merchant_id: "test".to_string(),
                api_key: "key".to_string(),
                api_secret: "secret".to_string(),
                base_url: None,
            },
        );
        assert!(config.validate().is_ok());
    }
}
