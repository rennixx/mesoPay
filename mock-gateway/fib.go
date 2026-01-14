package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// FIB specific types and handlers

// FIBTokenRequest represents OAuth token request
type FIBTokenRequest struct {
	GrantType    string `form:"grant_type" binding:"required"`
	ClientID     string `form:"client_id" binding:"required"`
	ClientSecret string `form:"client_secret" binding:"required"`
}

// FIBTokenResponse represents OAuth token response
type FIBTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

// FIBError represents FIB error response
type FIBError struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

// FIBGetToken handles OAuth token requests
func FIBGetToken(c *gin.Context) {
	ApplyLatency()
	IncrementStats("fib", true)

	// Check for simulated failure
	if ShouldFail() {
		IncrementStats("fib", false)
		c.JSON(http.StatusServiceUnavailable, FIBError{
			Error:            "server_error",
			ErrorDescription: "FIB service is temporarily unavailable",
		})
		return
	}

	var req FIBTokenRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, FIBError{
			Error:            "invalid_request",
			ErrorDescription: "Missing required parameters",
		})
		return
	}

	// Validate grant type
	if req.GrantType != "client_credentials" {
		c.JSON(http.StatusBadRequest, FIBError{
			Error:            "unsupported_grant_type",
			ErrorDescription: "Only client_credentials grant type is supported",
		})
		return
	}

	// Validate credentials
	if req.ClientID != config.FIBClientID || req.ClientSecret != config.FIBClientSecret {
		c.JSON(http.StatusUnauthorized, FIBError{
			Error:            "invalid_client",
			ErrorDescription: "Invalid client credentials",
		})
		return
	}

	// Generate access token
	accessToken := uuid.New().String()
	expiresIn := 3600 // 1 hour

	// Store token
	tokenInfo := &TokenInfo{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		ExpiresIn:   expiresIn,
		ExpiresAt:   time.Now().Add(time.Duration(expiresIn) * time.Second),
		ClientID:    req.ClientID,
	}
	StoreToken(tokenInfo)

	c.JSON(http.StatusOK, FIBTokenResponse{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		ExpiresIn:   expiresIn,
	})
}

// FIBCreatePaymentRequest represents payment creation request
type FIBCreatePaymentRequest struct {
	Amount      int64             `json:"amount" binding:"required,min=1000,max=100000000"`
	OrderID     string            `json:"order_id" binding:"required,max=50"`
	CallbackURL string            `json:"callback_url" binding:"required,url"`
	WebhookURL  string            `json:"webhook_url" binding:"required,url"`
	Description string            `json:"description"`
	Metadata    map[string]string `json:"metadata"`
}

// FIBCreatePaymentResponse represents payment creation response
type FIBCreatePaymentResponse struct {
	PaymentID  string `json:"payment_id"`
	Status     string `json:"status"`
	DeepLink   string `json:"deep_link"`
	WebURL     string `json:"web_url"`
	QRCode     string `json:"qr_code"`
	ValidUntil string `json:"valid_until"`
}

// FIBCreatePayment handles payment creation
func FIBCreatePayment(c *gin.Context) {
	ApplyLatency()
	IncrementStats("fib", true)

	// Check for simulated failure
	if ShouldFail() {
		IncrementStats("fib", false)
		c.JSON(http.StatusServiceUnavailable, FIBError{
			Error:            "server_error",
			ErrorDescription: "FIB service is temporarily unavailable",
		})
		return
	}

	// Validate Bearer token
	auth := c.GetHeader("Authorization")
	if auth == "" {
		c.JSON(http.StatusUnauthorized, FIBError{
			Error:            "invalid_token",
			ErrorDescription: "Authorization header is required",
		})
		return
	}

	if !strings.HasPrefix(auth, "Bearer ") {
		c.JSON(http.StatusUnauthorized, FIBError{
			Error:            "invalid_token",
			ErrorDescription: "Invalid authorization scheme",
		})
		return
	}

	accessToken := strings.TrimPrefix(auth, "Bearer ")
	if !ValidateToken(accessToken) {
		c.JSON(http.StatusUnauthorized, FIBError{
			Error:            "invalid_token",
			ErrorDescription: "Access token is invalid or expired",
		})
		return
	}

	// Parse request body
	var req FIBCreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, FIBError{
			Error:            "invalid_request",
			ErrorDescription: err.Error(),
		})
		return
	}

	// Validate amount range (1,000 - 100,000,000 IQD)
	if req.Amount < 1000 {
		c.JSON(http.StatusBadRequest, FIBError{
			Error:            "invalid_amount",
			ErrorDescription: "Minimum amount is 1,000 IQD",
		})
		return
	}

	if req.Amount > 100000000 {
		c.JSON(http.StatusBadRequest, FIBError{
			Error:            "invalid_amount",
			ErrorDescription: "Maximum amount is 100,000,000 IQD",
		})
		return
	}

	// Create payment
	paymentID := GenerateTransactionID("fib")
	validUntil := time.Now().Add(30 * time.Minute) // 30 minute validity

	tx := &Transaction{
		ID:          paymentID,
		Provider:    "fib",
		Amount:      req.Amount,
		OrderID:     req.OrderID,
		Status:      "pending",
		RedirectURL: fmt.Sprintf("http://localhost:8080/fib/pay/%s", paymentID),
		DeepLink:    fmt.Sprintf("fib://payment?id=%s", paymentID),
		CallbackURL: req.CallbackURL,
		WebhookURL:  req.WebhookURL,
		Metadata:    req.Metadata,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Extra: map[string]interface{}{
			"description": req.Description,
			"valid_until": validUntil,
		},
	}
	StoreTransaction(tx)

	c.JSON(http.StatusOK, FIBCreatePaymentResponse{
		PaymentID:  paymentID,
		Status:     "pending",
		DeepLink:   tx.DeepLink,
		WebURL:     tx.RedirectURL,
		QRCode:     fmt.Sprintf("data:image/png;base64,MOCK_QR_CODE_%s", paymentID),
		ValidUntil: validUntil.Format(time.RFC3339),
	})
}

// FIBPaymentStatus gets payment status
func FIBPaymentStatus(c *gin.Context) {
	ApplyLatency()

	// Validate Bearer token
	auth := c.GetHeader("Authorization")
	if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
		c.JSON(http.StatusUnauthorized, FIBError{
			Error:            "invalid_token",
			ErrorDescription: "Authorization required",
		})
		return
	}

	accessToken := strings.TrimPrefix(auth, "Bearer ")
	if !ValidateToken(accessToken) {
		c.JSON(http.StatusUnauthorized, FIBError{
			Error:            "invalid_token",
			ErrorDescription: "Access token is invalid or expired",
		})
		return
	}

	paymentID := c.Param("id")
	tx := GetTransaction(paymentID)

	if tx == nil || tx.Provider != "fib" {
		c.JSON(http.StatusNotFound, FIBError{
			Error:            "not_found",
			ErrorDescription: "Payment not found",
		})
		return
	}

	// Check if payment expired
	if validUntil, ok := tx.Extra["valid_until"].(time.Time); ok {
		if time.Now().After(validUntil) && tx.Status == "pending" {
			UpdateTransactionStatus(paymentID, "expired")
			tx.Status = "expired"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"payment_id": tx.ID,
		"status":     tx.Status,
		"amount":     tx.Amount,
		"order_id":   tx.OrderID,
		"created_at": tx.CreatedAt,
		"updated_at": tx.UpdatedAt,
	})
}

// FIBSimulateWebhookRequest represents webhook simulation request
type FIBSimulateWebhookRequest struct {
	PaymentID string `json:"payment_id" binding:"required"`
	Status    string `json:"status" binding:"required,oneof=completed declined expired"`
}

// FIBSimulateWebhook simulates sending a webhook
func FIBSimulateWebhook(c *gin.Context) {
	var req FIBSimulateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := GetTransaction(req.PaymentID)
	if tx == nil || tx.Provider != "fib" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Map status for webhook
	webhookStatus := req.Status
	if req.Status == "declined" {
		webhookStatus = "PAYMENT_DECLINED"
	}

	// Update transaction status
	UpdateTransactionStatus(req.PaymentID, req.Status)

	// Generate webhook signature
	timestamp := time.Now().Unix()
	payload := fmt.Sprintf(`{"payment_id":"%s","status":"%s","amount":%d,"order_id":"%s","timestamp":%d}`,
		tx.ID, webhookStatus, tx.Amount, tx.OrderID, timestamp)

	h := hmac.New(sha256.New, []byte(config.FIBClientSecret))
	h.Write([]byte(payload + fmt.Sprintf("%d", timestamp)))
	signature := "sha256=" + hex.EncodeToString(h.Sum(nil))

	c.JSON(http.StatusOK, gin.H{
		"message":     "Webhook simulated",
		"webhook_url": tx.WebhookURL,
		"headers": gin.H{
			"X-Mesopotamia-Signature": signature,
			"X-Mesopotamia-Timestamp": timestamp,
			"X-Mesopotamia-Provider":  "fib",
		},
		"payload": payload,
	})

	stats.mu.Lock()
	stats.WebhooksSent++
	stats.mu.Unlock()
}

// FIBPaymentPage shows a mock payment page
func FIBPaymentPage(c *gin.Context) {
	paymentID := c.Param("id")
	tx := GetTransaction(paymentID)

	if tx == nil || tx.Provider != "fib" {
		c.String(http.StatusNotFound, "Payment not found")
		return
	}

	// Render HTML payment page
	html := `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FIB - Mock Payment</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a5f7a 0%, #159895 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .payment-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 450px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1a5f7a 0%, #159895 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 14px; }
        .content { padding: 30px 20px; }
        .amount {
            font-size: 48px;
            font-weight: bold;
            color: #159895;
            text-align: center;
            margin-bottom: 10px;
        }
        .amount span { font-size: 18px; color: #999; }
        .details {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
        }
        .details p { margin: 8px 0; color: #555; }
        .details strong { color: #333; }
        .buttons { display: flex; gap: 10px; margin-top: 25px; }
        .btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .btn-success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
        }
        .btn-danger {
            background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
            color: white;
        }
        .badge {
            display: inline-block;
            background: #159895;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="payment-container">
        <div class="header">
            <h1>🏦 FIB</h1>
            <p>Mock Payment Gateway</p>
        </div>
        <div class="content">
            <div class="badge" id="status-badge">` + tx.Status + `</div>
            <div class="amount">` + fmt.Sprintf("%d", tx.Amount) + ` <span>IQD</span></div>
            <div class="details">
                <p><strong>Payment ID:</strong> ` + tx.ID + `</p>
                <p><strong>Order ID:</strong> ` + tx.OrderID + `</p>
                <p><strong>Merchant:</strong> Test Client</p>
            </div>
            <div class="buttons">
                <button class="btn btn-success" onclick="completePayment()">✓ Complete</button>
                <button class="btn btn-danger" onclick="cancelPayment()">✗ Cancel</button>
            </div>
        </div>
    </div>
    <script>
        function completePayment() {
            fetch('/fib/webhook/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_id: '` + tx.ID + `',
                    status: 'completed'
                })
            }).then(() => {
                document.getElementById('status-badge').textContent = 'completed';
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;color:white;"><h1>✓ Payment Complete!</h1><p>You can close this window.</p></div>';
            });
        }
        function cancelPayment() {
            fetch('/fib/webhook/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_id: '` + tx.ID + `',
                    status: 'cancelled'
                })
            }).then(() => {
                document.getElementById('status-badge').textContent = 'cancelled';
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;color:white;"><h1>✗ Payment Cancelled</h1><p>You can close this window.</p></div>';
            });
        }
    </script>
</body>
</html>`

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, html)
}
