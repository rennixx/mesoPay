package main

import (
	"math/rand"
	"sync"
	"time"
)

// ServerConfig holds configurable server settings for testing
type ServerConfig struct {
	mu              sync.RWMutex
	FailureRate     float64       // 0.0 - 1.0, probability of simulated failure
	Latency         time.Duration // Simulated latency
	ZainCashSecret  string        // Secret for ZainCash JWT verification
	FastPayStoreID  string        // Valid store ID for FastPay
	FastPayPassword string        // Valid password for FastPay
	FIBClientID     string        // Valid client ID for FIB
	FIBClientSecret string        // Valid client secret for FIB
}

// Stats tracks server statistics
type Stats struct {
	mu                 sync.RWMutex
	TotalRequests      int64
	SuccessfulRequests int64
	FailedRequests     int64
	ZainCashRequests   int64
	FastPayRequests    int64
	FIBRequests        int64
	WebhooksSent       int64
}

// Default configuration
var config = &ServerConfig{
	FailureRate:     0.0,
	Latency:         0,
	ZainCashSecret:  "sandbox_secret_zaincash",
	FastPayStoreID:  "store123",
	FastPayPassword: "pass123",
	FIBClientID:     "client123",
	FIBClientSecret: "secret123",
}

var stats = &Stats{}

// Transaction storage (in-memory for testing)
var (
	transactionsMu sync.RWMutex
	transactions   = make(map[string]*Transaction)
)

// Token storage (in-memory for testing)
var (
	tokensMu sync.RWMutex
	tokens   = make(map[string]*TokenInfo)
)

// Transaction represents a payment transaction
type Transaction struct {
	ID          string                 `json:"id"`
	Provider    string                 `json:"provider"`
	Amount      int64                  `json:"amount"`
	OrderID     string                 `json:"order_id"`
	Status      string                 `json:"status"`
	RedirectURL string                 `json:"redirect_url"`
	DeepLink    string                 `json:"deep_link,omitempty"`
	CallbackURL string                 `json:"callback_url"`
	WebhookURL  string                 `json:"webhook_url"`
	Metadata    map[string]string      `json:"metadata,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
	Extra       map[string]interface{} `json:"extra,omitempty"`
}

// TokenInfo represents an OAuth token
type TokenInfo struct {
	AccessToken string    `json:"access_token"`
	TokenType   string    `json:"token_type"`
	ExpiresIn   int       `json:"expires_in"`
	ExpiresAt   time.Time `json:"-"`
	ClientID    string    `json:"-"`
}

// ShouldFail checks if request should fail based on failure rate
func ShouldFail() bool {
	config.mu.RLock()
	defer config.mu.RUnlock()
	return rand.Float64() < config.FailureRate
}

// GetLatency returns configured latency
func GetLatency() time.Duration {
	config.mu.RLock()
	defer config.mu.RUnlock()
	return config.Latency
}

// ApplyLatency simulates network latency
func ApplyLatency() {
	if latency := GetLatency(); latency > 0 {
		time.Sleep(latency)
	}
}

// StoreTransaction saves a transaction
func StoreTransaction(tx *Transaction) {
	transactionsMu.Lock()
	defer transactionsMu.Unlock()
	transactions[tx.ID] = tx
}

// GetTransaction retrieves a transaction
func GetTransaction(id string) *Transaction {
	transactionsMu.RLock()
	defer transactionsMu.RUnlock()
	return transactions[id]
}

// UpdateTransactionStatus updates transaction status
func UpdateTransactionStatus(id, status string) bool {
	transactionsMu.Lock()
	defer transactionsMu.Unlock()
	if tx, exists := transactions[id]; exists {
		tx.Status = status
		tx.UpdatedAt = time.Now()
		return true
	}
	return false
}

// StoreToken saves a token
func StoreToken(token *TokenInfo) {
	tokensMu.Lock()
	defer tokensMu.Unlock()
	tokens[token.AccessToken] = token
}

// ValidateToken checks if token is valid
func ValidateToken(accessToken string) bool {
	tokensMu.RLock()
	defer tokensMu.RUnlock()
	if token, exists := tokens[accessToken]; exists {
		return time.Now().Before(token.ExpiresAt)
	}
	return false
}

// IncrementStats updates request statistics
func IncrementStats(provider string, success bool) {
	stats.mu.Lock()
	defer stats.mu.Unlock()
	stats.TotalRequests++
	if success {
		stats.SuccessfulRequests++
	} else {
		stats.FailedRequests++
	}
	switch provider {
	case "zaincash":
		stats.ZainCashRequests++
	case "fastpay":
		stats.FastPayRequests++
	case "fib":
		stats.FIBRequests++
	}
}

// GetStats returns current statistics
func GetStatsSnapshot() Stats {
	stats.mu.RLock()
	defer stats.mu.RUnlock()
	return Stats{
		TotalRequests:      stats.TotalRequests,
		SuccessfulRequests: stats.SuccessfulRequests,
		FailedRequests:     stats.FailedRequests,
		ZainCashRequests:   stats.ZainCashRequests,
		FastPayRequests:    stats.FastPayRequests,
		FIBRequests:        stats.FIBRequests,
		WebhooksSent:       stats.WebhooksSent,
	}
}

// ResetStats resets all statistics
func ResetStats() {
	stats.mu.Lock()
	defer stats.mu.Unlock()
	stats.TotalRequests = 0
	stats.SuccessfulRequests = 0
	stats.FailedRequests = 0
	stats.ZainCashRequests = 0
	stats.FastPayRequests = 0
	stats.FIBRequests = 0
	stats.WebhooksSent = 0
}

// GenerateTransactionID creates a unique transaction ID
func GenerateTransactionID(prefix string) string {
	return prefix + "_" + randomString(16)
}

// randomString generates a random alphanumeric string
func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
