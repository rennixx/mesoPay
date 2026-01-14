package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// ZainCash specific types and handlers

// ZainCashInitRequest represents ZainCash transaction init request
type ZainCashInitRequest struct {
	Token string `json:"token" binding:"required"`
}

// ZainCashClaims represents JWT claims for ZainCash
type ZainCashClaims struct {
	MerchantID  string `json:"merchant_id"`
	Amount      int64  `json:"amount"`
	OrderID     string `json:"order_id"`
	ServiceType string `json:"service_type"`
	CallbackURL string `json:"callback_url"`
	WebhookURL  string `json:"webhook_url"`
	jwt.RegisteredClaims
}

// ZainCashInitResponse represents ZainCash init response
type ZainCashInitResponse struct {
	TransactionID string `json:"transaction_id"`
	RedirectURL   string `json:"redirect_url"`
	Status        string `json:"status"`
	DeepLink      string `json:"deep_link"`
}

// ZainCashError represents ZainCash error response
type ZainCashError struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ZainCashInitTransaction handles ZainCash transaction initialization
func ZainCashInitTransaction(c *gin.Context) {
	ApplyLatency()
	IncrementStats("zaincash", true)

	// Check for simulated failure
	if ShouldFail() {
		IncrementStats("zaincash", false)
		c.JSON(http.StatusServiceUnavailable, ZainCashError{
			Error:   "SERVICE_UNAVAILABLE",
			Code:    "SERVICE_UNAVAILABLE",
			Message: "ZainCash service is temporarily unavailable",
		})
		return
	}

	var req ZainCashInitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ZainCashError{
			Error:   "INVALID_REQUEST",
			Code:    "INVALID_REQUEST",
			Message: "Token is required",
		})
		return
	}

	// Parse and validate JWT
	token, err := jwt.ParseWithClaims(req.Token, &ZainCashClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.ZainCashSecret), nil
	})

	if err != nil {
		if strings.Contains(err.Error(), "token is expired") {
			c.JSON(http.StatusUnauthorized, ZainCashError{
				Error:   "EXPIRED_TOKEN",
				Code:    "EXPIRED_TOKEN",
				Message: "JWT token has expired",
			})
			return
		}
		c.JSON(http.StatusUnauthorized, ZainCashError{
			Error:   "INVALID_TOKEN",
			Code:    "INVALID_TOKEN",
			Message: "Invalid JWT signature",
		})
		return
	}

	claims, ok := token.Claims.(*ZainCashClaims)
	if !ok || !token.Valid {
		c.JSON(http.StatusUnauthorized, ZainCashError{
			Error:   "INVALID_TOKEN",
			Code:    "INVALID_TOKEN",
			Message: "Invalid token claims",
		})
		return
	}

	// Validate amount range (1,000 - 5,000,000 IQD)
	if claims.Amount < 1000 || claims.Amount > 5000000 {
		c.JSON(http.StatusBadRequest, ZainCashError{
			Error:   "INVALID_AMOUNT",
			Code:    "INVALID_AMOUNT",
			Message: fmt.Sprintf("Amount must be between 1,000 and 5,000,000 IQD. Got: %d", claims.Amount),
		})
		return
	}

	// Check for duplicate order ID
	transactionsMu.RLock()
	for _, tx := range transactions {
		if tx.Provider == "zaincash" && tx.OrderID == claims.OrderID {
			transactionsMu.RUnlock()
			c.JSON(http.StatusConflict, ZainCashError{
				Error:   "DUPLICATE_ORDER",
				Code:    "DUPLICATE_ORDER",
				Message: "Order ID has already been used",
			})
			return
		}
	}
	transactionsMu.RUnlock()

	// Create transaction
	txID := GenerateTransactionID("zc")
	tx := &Transaction{
		ID:          txID,
		Provider:    "zaincash",
		Amount:      claims.Amount,
		OrderID:     claims.OrderID,
		Status:      "pending",
		RedirectURL: fmt.Sprintf("http://localhost:8080/zaincash/pay/%s", txID),
		DeepLink:    fmt.Sprintf("zaincash://payment?token=%s", req.Token),
		CallbackURL: claims.CallbackURL,
		WebhookURL:  claims.WebhookURL,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	StoreTransaction(tx)

	c.JSON(http.StatusOK, ZainCashInitResponse{
		TransactionID: txID,
		RedirectURL:   tx.RedirectURL,
		Status:        "pending",
		DeepLink:      tx.DeepLink,
	})
}

// ZainCashPaymentPage shows a mock payment page
func ZainCashPaymentPage(c *gin.Context) {
	txID := c.Param("id")
	tx := GetTransaction(txID)

	if tx == nil || tx.Provider != "zaincash" {
		c.String(http.StatusNotFound, "Transaction not found")
		return
	}

	// Render HTML payment page
	html := `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZainCash - Mock Payment</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            color: #667eea;
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
            background: #667eea;
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
            <h1>💳 ZainCash</h1>
            <p>Mock Payment Gateway</p>
        </div>
        <div class="content">
            <div class="badge" id="status-badge">` + tx.Status + `</div>
            <div class="amount">` + fmt.Sprintf("%d", tx.Amount) + ` <span>IQD</span></div>
            <div class="details">
                <p><strong>Transaction ID:</strong> ` + tx.ID + `</p>
                <p><strong>Order ID:</strong> ` + tx.OrderID + `</p>
                <p><strong>Merchant:</strong> Test Merchant</p>
            </div>
            <div class="buttons">
                <button class="btn btn-success" onclick="completePayment()">✓ Complete</button>
                <button class="btn btn-danger" onclick="cancelPayment()">✗ Cancel</button>
            </div>
        </div>
    </div>
    <script>
        function completePayment() {
            fetch('/zaincash/webhook/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: '` + tx.ID + `',
                    status: 'completed'
                })
            }).then(() => {
                // Update the status badge
                document.getElementById('status-badge').textContent = 'completed';
                // Show success message
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;color:white;"><h1>✓ Payment Complete!</h1><p>You can close this window.</p></div>';
            });
        }
        function cancelPayment() {
            fetch('/zaincash/webhook/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: '` + tx.ID + `',
                    status: 'cancelled'
                })
            }).then(() => {
                // Update the status badge
                document.getElementById('status-badge').textContent = 'cancelled';
                // Show cancelled message
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;color:white;"><h1>✗ Payment Cancelled</h1><p>You can close this window.</p></div>';
            });
        }
    </script>
</body>
</html>`

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, html)
}

// ZainCashTransactionStatus gets transaction status
func ZainCashTransactionStatus(c *gin.Context) {
	ApplyLatency()

	txID := c.Param("id")
	tx := GetTransaction(txID)

	if tx == nil || tx.Provider != "zaincash" {
		c.JSON(http.StatusNotFound, ZainCashError{
			Error:   "NOT_FOUND",
			Code:    "NOT_FOUND",
			Message: "Transaction not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transaction_id": tx.ID,
		"status":         tx.Status,
		"amount":         tx.Amount,
		"order_id":       tx.OrderID,
		"created_at":     tx.CreatedAt,
		"updated_at":     tx.UpdatedAt,
	})
}

// ZainCashSimulateWebhookRequest represents webhook simulation request
type ZainCashSimulateWebhookRequest struct {
	TransactionID string `json:"transaction_id" binding:"required"`
	Status        string `json:"status" binding:"required,oneof=completed failed cancelled"`
}

// ZainCashSimulateWebhook simulates sending a webhook
func ZainCashSimulateWebhook(c *gin.Context) {
	var req ZainCashSimulateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := GetTransaction(req.TransactionID)
	if tx == nil || tx.Provider != "zaincash" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	// Update transaction status
	UpdateTransactionStatus(req.TransactionID, req.Status)

	// Generate webhook signature
	timestamp := time.Now().Unix()
	payload := fmt.Sprintf(`{"transaction_id":"%s","status":"%s","amount":%d,"order_id":"%s","timestamp":%d}`,
		tx.ID, req.Status, tx.Amount, tx.OrderID, timestamp)

	h := hmac.New(sha256.New, []byte(config.ZainCashSecret))
	h.Write([]byte(payload + fmt.Sprintf("%d", timestamp)))
	signature := "sha256=" + hex.EncodeToString(h.Sum(nil))

	// In a real scenario, we would POST to tx.WebhookURL
	// For testing, we just return what would be sent
	c.JSON(http.StatusOK, gin.H{
		"message":     "Webhook simulated",
		"webhook_url": tx.WebhookURL,
		"headers": gin.H{
			"X-Mesopotamia-Signature": signature,
			"X-Mesopotamia-Timestamp": timestamp,
			"X-Mesopotamia-Provider":  "zaincash",
		},
		"payload": payload,
	})

	stats.mu.Lock()
	stats.WebhooksSent++
	stats.mu.Unlock()
}

// Helper function to generate HMAC signature
func generateZainCashSignature(payload string, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(payload))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}
