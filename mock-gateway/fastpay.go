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
)

// FastPay specific types and handlers

// FastPayInitRequest represents FastPay payment init request
type FastPayInitRequest struct {
	Amount      int64             `json:"amount" binding:"required,min=500,max=10000000"`
	OrderID     string            `json:"order_id" binding:"required,max=50"`
	CallbackURL string            `json:"callback_url" binding:"required,url"`
	WebhookURL  string            `json:"webhook_url" binding:"required,url"`
	Description string            `json:"description"`
	Metadata    map[string]string `json:"metadata"`
}

// FastPayInitResponse represents FastPay init response
type FastPayInitResponse struct {
	PaymentID   string `json:"payment_id"`
	RedirectURL string `json:"redirect_url"`
	Status      string `json:"status"`
	ExpiresAt   string `json:"expires_at"`
}

// FastPayError represents FastPay error response
type FastPayError struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// FastPayInitPayment handles FastPay payment initialization
func FastPayInitPayment(c *gin.Context) {
	ApplyLatency()
	IncrementStats("fastpay", true)

	// Check for simulated failure
	if ShouldFail() {
		IncrementStats("fastpay", false)
		c.JSON(http.StatusServiceUnavailable, FastPayError{
			Error:   "SERVICE_UNAVAILABLE",
			Code:    "SERVICE_UNAVAILABLE",
			Message: "FastPay service is temporarily unavailable",
		})
		return
	}

	// Validate Basic Auth
	auth := c.GetHeader("Authorization")
	if auth == "" {
		c.Header("WWW-Authenticate", "Basic realm=\"FastPay API\"")
		c.JSON(http.StatusUnauthorized, FastPayError{
			Error:   "INVALID_CREDENTIALS",
			Code:    "INVALID_CREDENTIALS",
			Message: "Authorization header is required",
		})
		return
	}

	if !strings.HasPrefix(auth, "Basic ") {
		c.JSON(http.StatusUnauthorized, FastPayError{
			Error:   "INVALID_CREDENTIALS",
			Code:    "INVALID_CREDENTIALS",
			Message: "Invalid authorization scheme",
		})
		return
	}

	// Decode and validate credentials
	decoded, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(auth, "Basic "))
	if err != nil {
		c.JSON(http.StatusUnauthorized, FastPayError{
			Error:   "INVALID_CREDENTIALS",
			Code:    "INVALID_CREDENTIALS",
			Message: "Invalid base64 encoding",
		})
		return
	}

	parts := strings.SplitN(string(decoded), ":", 2)
	if len(parts) != 2 {
		c.JSON(http.StatusUnauthorized, FastPayError{
			Error:   "INVALID_CREDENTIALS",
			Code:    "INVALID_CREDENTIALS",
			Message: "Invalid credentials format",
		})
		return
	}

	storeID, password := parts[0], parts[1]
	if storeID != config.FastPayStoreID || password != config.FastPayPassword {
		c.JSON(http.StatusUnauthorized, FastPayError{
			Error:   "INVALID_CREDENTIALS",
			Code:    "INVALID_CREDENTIALS",
			Message: "Invalid store ID or password",
		})
		return
	}

	// Parse request body
	var req FastPayInitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, FastPayError{
			Error:   "INVALID_REQUEST",
			Code:    "INVALID_REQUEST",
			Message: err.Error(),
		})
		return
	}

	// Validate amount range (500 - 10,000,000 IQD)
	if req.Amount < 500 {
		c.JSON(http.StatusBadRequest, FastPayError{
			Error:   "AMOUNT_TOO_LOW",
			Code:    "AMOUNT_TOO_LOW",
			Message: "Minimum amount is 500 IQD",
		})
		return
	}

	if req.Amount > 10000000 {
		c.JSON(http.StatusBadRequest, FastPayError{
			Error:   "AMOUNT_TOO_HIGH",
			Code:    "AMOUNT_TOO_HIGH",
			Message: "Maximum amount is 10,000,000 IQD",
		})
		return
	}

	// Create payment
	paymentID := GenerateTransactionID("fp")
	expiresAt := time.Now().Add(15 * time.Minute) // 15 minute session timeout

	tx := &Transaction{
		ID:          paymentID,
		Provider:    "fastpay",
		Amount:      req.Amount,
		OrderID:     req.OrderID,
		Status:      "pending",
		RedirectURL: fmt.Sprintf("http://localhost:8080/fastpay/pay/%s", paymentID),
		CallbackURL: req.CallbackURL,
		WebhookURL:  req.WebhookURL,
		Metadata:    req.Metadata,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Extra: map[string]interface{}{
			"description": req.Description,
			"expires_at":  expiresAt,
			"store_id":    storeID,
		},
	}
	StoreTransaction(tx)

	c.JSON(http.StatusOK, FastPayInitResponse{
		PaymentID:   paymentID,
		RedirectURL: tx.RedirectURL,
		Status:      "pending",
		ExpiresAt:   expiresAt.Format(time.RFC3339),
	})
}

// FastPayPaymentStatus gets payment status
func FastPayPaymentStatus(c *gin.Context) {
	ApplyLatency()

	// Validate Basic Auth (same as init)
	auth := c.GetHeader("Authorization")
	if auth == "" || !strings.HasPrefix(auth, "Basic ") {
		c.JSON(http.StatusUnauthorized, FastPayError{
			Error:   "INVALID_CREDENTIALS",
			Code:    "INVALID_CREDENTIALS",
			Message: "Authorization required",
		})
		return
	}

	paymentID := c.Param("id")
	tx := GetTransaction(paymentID)

	if tx == nil || tx.Provider != "fastpay" {
		c.JSON(http.StatusNotFound, FastPayError{
			Error:   "NOT_FOUND",
			Code:    "NOT_FOUND",
			Message: "Payment not found",
		})
		return
	}

	// Check if session expired
	if expiresAt, ok := tx.Extra["expires_at"].(time.Time); ok {
		if time.Now().After(expiresAt) && tx.Status == "pending" {
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

// FastPayRefundRequest represents refund request
type FastPayRefundRequest struct {
	PaymentID string `json:"payment_id" binding:"required"`
	Amount    int64  `json:"amount" binding:"required,min=1"`
	Reason    string `json:"reason"`
}

// FastPayRefund handles refund requests
func FastPayRefund(c *gin.Context) {
	ApplyLatency()

	// Validate Basic Auth
	auth := c.GetHeader("Authorization")
	if auth == "" || !strings.HasPrefix(auth, "Basic ") {
		c.JSON(http.StatusUnauthorized, FastPayError{
			Error:   "INVALID_CREDENTIALS",
			Code:    "INVALID_CREDENTIALS",
			Message: "Authorization required",
		})
		return
	}

	var req FastPayRefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, FastPayError{
			Error:   "INVALID_REQUEST",
			Code:    "INVALID_REQUEST",
			Message: err.Error(),
		})
		return
	}

	tx := GetTransaction(req.PaymentID)
	if tx == nil || tx.Provider != "fastpay" {
		c.JSON(http.StatusNotFound, FastPayError{
			Error:   "NOT_FOUND",
			Code:    "NOT_FOUND",
			Message: "Payment not found",
		})
		return
	}

	if tx.Status != "completed" {
		c.JSON(http.StatusBadRequest, FastPayError{
			Error:   "INVALID_STATUS",
			Code:    "INVALID_STATUS",
			Message: "Only completed payments can be refunded",
		})
		return
	}

	if req.Amount > tx.Amount {
		c.JSON(http.StatusBadRequest, FastPayError{
			Error:   "INVALID_AMOUNT",
			Code:    "INVALID_AMOUNT",
			Message: "Refund amount cannot exceed payment amount",
		})
		return
	}

	// Create refund
	refundID := GenerateTransactionID("fp_ref")
	UpdateTransactionStatus(req.PaymentID, "refunded")

	c.JSON(http.StatusOK, gin.H{
		"refund_id":  refundID,
		"payment_id": req.PaymentID,
		"amount":     req.Amount,
		"status":     "completed",
		"created_at": time.Now(),
	})
}

// FastPaySimulateWebhookRequest represents webhook simulation request
type FastPaySimulateWebhookRequest struct {
	PaymentID string `json:"payment_id" binding:"required"`
	Status    string `json:"status" binding:"required,oneof=completed failed expired"`
}

// FastPaySimulateWebhook simulates sending a webhook
func FastPaySimulateWebhook(c *gin.Context) {
	var req FastPaySimulateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := GetTransaction(req.PaymentID)
	if tx == nil || tx.Provider != "fastpay" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Update transaction status
	UpdateTransactionStatus(req.PaymentID, req.Status)

	// Generate webhook signature
	timestamp := time.Now().Unix()
	payload := fmt.Sprintf(`{"payment_id":"%s","status":"%s","amount":%d,"order_id":"%s","timestamp":%d}`,
		tx.ID, req.Status, tx.Amount, tx.OrderID, timestamp)

	h := hmac.New(sha256.New, []byte(config.FastPayPassword))
	h.Write([]byte(payload + fmt.Sprintf("%d", timestamp)))
	signature := "sha256=" + hex.EncodeToString(h.Sum(nil))

	c.JSON(http.StatusOK, gin.H{
		"message":     "Webhook simulated",
		"webhook_url": tx.WebhookURL,
		"headers": gin.H{
			"X-Mesopotamia-Signature": signature,
			"X-Mesopotamia-Timestamp": timestamp,
			"X-Mesopotamia-Provider":  "fastpay",
		},
		"payload": payload,
	})

	stats.mu.Lock()
	stats.WebhooksSent++
	stats.mu.Unlock()
}

// FastPayPaymentPage shows a mock payment page
func FastPayPaymentPage(c *gin.Context) {
	paymentID := c.Param("id")
	tx := GetTransaction(paymentID)

	if tx == nil || tx.Provider != "fastpay" {
		c.String(http.StatusNotFound, "Payment not found")
		return
	}

	// Render HTML payment page
	html := `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FastPay - Mock Payment</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
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
            background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
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
            color: #FF6B6B;
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
            background: #FF6B6B;
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
            <h1>⚡ FastPay</h1>
            <p>Mock Payment Gateway</p>
        </div>
        <div class="content">
            <div class="badge" id="status-badge">` + tx.Status + `</div>
            <div class="amount">` + fmt.Sprintf("%d", tx.Amount) + ` <span>IQD</span></div>
            <div class="details">
                <p><strong>Payment ID:</strong> ` + tx.ID + `</p>
                <p><strong>Order ID:</strong> ` + tx.OrderID + `</p>
                <p><strong>Merchant:</strong> Test Store</p>
            </div>
            <div class="buttons">
                <button class="btn btn-success" onclick="completePayment()">✓ Complete</button>
                <button class="btn btn-danger" onclick="cancelPayment()">✗ Cancel</button>
            </div>
        </div>
    </div>
    <script>
        function completePayment() {
            fetch('/fastpay/webhook/simulate', {
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
            fetch('/fastpay/webhook/simulate', {
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
