package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthResponse represents health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
	Uptime    string    `json:"uptime"`
	Gateways  []string  `json:"gateways"`
}

var startTime = time.Now()

// HealthCheck handles health check requests
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Version:   "1.0.0",
		Uptime:    time.Since(startTime).String(),
		Gateways:  []string{"zaincash", "fastpay", "fib"},
	})
}

// SetFailureRateRequest represents failure rate configuration
type SetFailureRateRequest struct {
	Rate float64 `json:"rate" binding:"required,min=0,max=1"`
}

// SetFailureRate configures simulated failure rate
func SetFailureRate(c *gin.Context) {
	var req SetFailureRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.mu.Lock()
	config.FailureRate = req.Rate
	config.mu.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"message":      "Failure rate updated",
		"failure_rate": req.Rate,
	})
}

// SetLatencyRequest represents latency configuration
type SetLatencyRequest struct {
	LatencyMs int `json:"latency_ms" binding:"required,min=0,max=30000"`
}

// SetLatency configures simulated latency
func SetLatency(c *gin.Context) {
	var req SetLatencyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.mu.Lock()
	config.Latency = time.Duration(req.LatencyMs) * time.Millisecond
	config.mu.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Latency updated",
		"latency_ms": req.LatencyMs,
	})
}

// GetStats returns server statistics
func GetStats(c *gin.Context) {
	snapshot := GetStatsSnapshot()
	c.JSON(http.StatusOK, gin.H{
		"total_requests":      snapshot.TotalRequests,
		"successful_requests": snapshot.SuccessfulRequests,
		"failed_requests":     snapshot.FailedRequests,
		"zaincash_requests":   snapshot.ZainCashRequests,
		"fastpay_requests":    snapshot.FastPayRequests,
		"fib_requests":        snapshot.FIBRequests,
		"webhooks_sent":       snapshot.WebhooksSent,
	})
}

// ResetConfig resets all configuration to defaults
func ResetConfig(c *gin.Context) {
	config.mu.Lock()
	config.FailureRate = 0.0
	config.Latency = 0
	config.mu.Unlock()
	ResetStats()

	c.JSON(http.StatusOK, gin.H{
		"message": "Configuration reset to defaults",
	})
}

// WebhookPayload represents incoming webhook data
type WebhookPayload struct {
	TransactionID string `json:"transaction_id"`
	Provider      string `json:"provider"`
	Status        string `json:"status"`
	Amount        int64  `json:"amount"`
	OrderID       string `json:"order_id"`
	Timestamp     int64  `json:"timestamp"`
}

// WebhookReceiver receives and logs webhooks (for testing)
func WebhookReceiver(c *gin.Context) {
	var payload WebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log received webhook
	signature := c.GetHeader("X-Mesopotamia-Signature")
	timestamp := c.GetHeader("X-Mesopotamia-Timestamp")
	provider := c.GetHeader("X-Mesopotamia-Provider")

	// In a real scenario, verify signature here
	_ = signature
	_ = timestamp
	_ = provider

	c.JSON(http.StatusOK, gin.H{
		"message":  "Webhook received",
		"received": payload,
	})
}
