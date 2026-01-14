/**
 * HTTP client with retry logic
 * Note: This will be replaced by Rust FFI calls in Phase 2
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface HttpClientConfig {
  timeout?: number;
  maxRetries?: number;
}

export class HttpClient {
  private client: AxiosInstance;
  private maxRetries: number;

  constructor(config: HttpClientConfig = {}) {
    this.client = axios.create({
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MesopotamiaSDK/0.1.0',
      },
    });
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Execute request with retry logic
   */
  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          const status = axiosError.response.status;

          // Retry for 5xx and 429
          const isRetryable =
            status >= 500 || status === 429;

          if (!isRetryable || attempt >= this.maxRetries) {
            throw error;
          }
        } else if (attempt >= this.maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = this.calculateBackoff(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s (capped)
    return Math.min(1000 * Math.pow(2, attempt), 8000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export default HttpClient;
