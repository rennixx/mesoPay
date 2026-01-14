// HTTP client with retry logic and circuit breaker

use crate::error::{MesopotamiaError, Result};
use reqwest::{Client, Response};
use std::time::Duration;
use tokio::time::sleep;

/// HTTP client wrapper with retry logic
pub struct HttpClient {
    client: Client,
    timeout_ms: u64,
    max_retries: u32,
}

impl HttpClient {
    /// Create a new HTTP client
    pub fn new(timeout_ms: u64) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_millis(timeout_ms))
            .build()
            .map_err(|e| MesopotamiaError::HttpClientError(e.to_string()))
            .unwrap();

        Self {
            client,
            timeout_ms,
            max_retries: crate::MAX_RETRIES,
        }
    }

    /// Execute HTTP request with retry logic
    pub async fn execute_with_retry<F, Fut>(&self, request_fn: F) -> Result<Response>
    where
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = Result<Response>>,
    {
        let mut last_error = None;

        for attempt in 0..=self.max_retries {
            match request_fn().await {
                Ok(response) => {
                    // Check if response indicates a retryable error
                    let status = response.status();
                    if status.is_server_error() || status.as_u16() == 429 {
                        // Retry for 5xx and 429 (rate limit)
                        if attempt < self.max_retries {
                            let delay = self.backoff_delay(attempt);
                            sleep(delay).await;
                            continue;
                        }
                    }
                    return Ok(response);
                }
                Err(e) => {
                    last_error = Some(e);
                    if attempt < self.max_retries && last_error.as_ref().unwrap().is_retryable() {
                        let delay = self.backoff_delay(attempt);
                        sleep(delay).await;
                        continue;
                    }
                }
            }
        }

        Err(last_error.unwrap_or_else(|| {
            MesopotamiaError::Unknown("Max retries exceeded".to_string())
        }))
    }

    /// Calculate exponential backoff delay
    fn backoff_delay(&self, attempt: u32) -> Duration {
        // Exponential backoff: 1s, 2s, 4s...
        let millis = 1000 * (1 << attempt.min(3));
        Duration::from_millis(millis)
    }

    /// Get the underlying reqwest client
    pub fn inner(&self) -> &Client {
        &self.client
    }
}

impl Default for HttpClient {
    fn default() -> Self {
        Self::new(crate::DEFAULT_TIMEOUT_MS)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backoff_calculation() {
        let client = HttpClient::new(30000);

        // Test exponential backoff: 1000ms, 2000ms, 4000ms, 8000ms (capped)
        assert_eq!(client.backoff_delay(0).as_millis(), 1000);
        assert_eq!(client.backoff_delay(1).as_millis(), 2000);
        assert_eq!(client.backoff_delay(2).as_millis(), 4000);
        assert_eq!(client.backoff_delay(3).as_millis(), 8000);
        assert_eq!(client.backoff_delay(4).as_millis(), 8000); // capped at 3
    }
}
