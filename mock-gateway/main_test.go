package main

import (
	"bytes"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Helper function to create test router
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.Use(RequestLogger())
	router.Use(CORSMiddleware())

	// Health check
	router.GET("/health", HealthCheck)

	// ZainCash endpoints
	zaincash := router.Group("/zaincash")
	{
		zaincash.POST("/transaction/init", ZainCashInitTransaction)
		zaincash.GET("/transaction/status/:id", ZainCashTransactionStatus)
		zaincash.POST("/webhook/simulate", ZainCashSimulateWebhook)
	}

	// FastPay endpoints
	fastpay := router.Group("/fastpay")
	{
		fastpay.POST("/payment/init", FastPayInitPayment)
		fastpay.GET("/payment/status/:id", FastPayPaymentStatus)
		fastpay.POST("/payment/refund", FastPayRefund)
		fastpay.POST("/webhook/simulate", FastPaySimulateWebhook)
	}

	// FIB endpoints
	fib := router.Group("/fib")
	{
		fib.POST("/oauth/token", FIBGetToken)
		fib.POST("/payment/create", FIBCreatePayment)
		fib.GET("/payment/status/:id", FIBPaymentStatus)
		fib.POST("/webhook/simulate", FIBSimulateWebhook)
	}

	// Config endpoints
	config := router.Group("/config")
	{
		config.POST("/failure-rate", SetFailureRate)
		config.POST("/latency", SetLatency)
		config.GET("/stats", GetStats)
		config.POST("/reset", ResetConfig)
	}

	return router
}

// Helper to create JWT token for ZainCash
func createTestJWT(merchantID, secret string, amount int64, orderID string) (string, error) {
	claims := ZainCashClaims{
		MerchantID:  merchantID,
		Amount:      amount,
		OrderID:     orderID,
		ServiceType: "payment",
		CallbackURL: "http://example.com/callback",
		WebhookURL:  "http://example.com/webhook",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func TestHealthCheck(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestZainCashInitTransaction(t *testing.T) {
	router := setupTestRouter()

	// Create valid JWT
	token, err := createTestJWT("merchant_123", config.ZainCashSecret, 50000, "ORDER_123")
	if err != nil {
		t.Fatalf("Failed to create JWT: %v", err)
	}

	// Test valid request
	body := `{"token":"` + token + `"}`
	req, _ := http.NewRequest("POST", "/zaincash/transaction/init", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Test invalid JWT
	invalidBody := `{"token":"invalid_token"}`
	req2, _ := http.NewRequest("POST", "/zaincash/transaction/init", bytes.NewBufferString(invalidBody))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()

	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 for invalid token, got %d", w2.Code)
	}

	// Test amount out of range
	smallToken, _ := createTestJWT("merchant_123", config.ZainCashSecret, 500, "ORDER_SMALL")
	smallBody := `{"token":"` + smallToken + `"}`
	req3, _ := http.NewRequest("POST", "/zaincash/transaction/init", bytes.NewBufferString(smallBody))
	req3.Header.Set("Content-Type", "application/json")
	w3 := httptest.NewRecorder()

	router.ServeHTTP(w3, req3)

	if w3.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for amount too small, got %d", w3.Code)
	}
}

func TestFastPayInitPayment(t *testing.T) {
	router := setupTestRouter()

	// Create Basic Auth header
	auth := base64.StdEncoding.EncodeToString([]byte(config.FastPayStoreID + ":" + config.FastPayPassword))

	// Test valid request
	body := `{"amount":50000,"order_id":"ORDER_123","callback_url":"http://example.com/callback","webhook_url":"http://example.com/webhook"}`
	req, _ := http.NewRequest("POST", "/fastpay/payment/init", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Basic "+auth)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Test invalid credentials
	auth2 := base64.StdEncoding.EncodeToString([]byte("wrong:wrong"))
	req2, _ := http.NewRequest("POST", "/fastpay/payment/init", bytes.NewBufferString(body))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Basic "+auth2)
	w2 := httptest.NewRecorder()

	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 for invalid credentials, got %d", w2.Code)
	}
}

func TestFIBGetToken(t *testing.T) {
	router := setupTestRouter()

	// Test valid request - use form-encoded body
	body := "grant_type=client_credentials&client_id=" + config.FIBClientID + "&client_secret=" + config.FIBClientSecret
	req, _ := http.NewRequest("POST", "/fib/oauth/token", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Test invalid credentials
	body2 := "grant_type=client_credentials&client_id=wrong&client_secret=wrong"
	req2, _ := http.NewRequest("POST", "/fib/oauth/token", bytes.NewBufferString(body2))
	req2.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	w2 := httptest.NewRecorder()

	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 for invalid credentials, got %d", w2.Code)
	}
}

func TestConfigEndpoints(t *testing.T) {
	router := setupTestRouter()

	// Test setting failure rate
	body := `{"rate":0.5}`
	req, _ := http.NewRequest("POST", "/config/failure-rate", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Test setting latency
	body2 := `{"latency_ms":100}`
	req2, _ := http.NewRequest("POST", "/config/latency", bytes.NewBufferString(body2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()

	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w2.Code)
	}

	// Test getting stats
	req3, _ := http.NewRequest("GET", "/config/stats", nil)
	w3 := httptest.NewRecorder()

	router.ServeHTTP(w3, req3)

	if w3.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w3.Code)
	}

	// Test reset
	req4, _ := http.NewRequest("POST", "/config/reset", nil)
	w4 := httptest.NewRecorder()

	router.ServeHTTP(w4, req4)

	if w4.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w4.Code)
	}
}

func TestCORSMiddleware(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Error("CORS header not set")
	}
}
