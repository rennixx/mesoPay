// Package main implements a mock gateway server for testing Mesopotamia SDK
// Simulates ZainCash, FastPay, and FIB payment gateways
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}

	// Create router
	router := gin.Default()

	// Add middleware
	router.Use(RequestLogger())
	router.Use(CORSMiddleware())

	// Health check endpoint
	router.GET("/health", HealthCheck)

	// ZainCash endpoints
	zaincash := router.Group("/zaincash")
	{
		zaincash.POST("/transaction/init", ZainCashInitTransaction)
		zaincash.GET("/transaction/status/:id", ZainCashTransactionStatus)
		zaincash.POST("/webhook/simulate", ZainCashSimulateWebhook)
		zaincash.GET("/pay/:id", ZainCashPaymentPage)
	}

	// FastPay endpoints
	fastpay := router.Group("/fastpay")
	{
		fastpay.POST("/payment/init", FastPayInitPayment)
		fastpay.GET("/payment/status/:id", FastPayPaymentStatus)
		fastpay.POST("/payment/refund", FastPayRefund)
		fastpay.POST("/webhook/simulate", FastPaySimulateWebhook)
		fastpay.GET("/pay/:id", FastPayPaymentPage)
	}

	// FIB endpoints
	fib := router.Group("/fib")
	{
		fib.POST("/oauth/token", FIBGetToken)
		fib.POST("/payment/create", FIBCreatePayment)
		fib.GET("/payment/status/:id", FIBPaymentStatus)
		fib.POST("/webhook/simulate", FIBSimulateWebhook)
		fib.GET("/pay/:id", FIBPaymentPage)
	}

	// Webhook receiver (for testing)
	router.POST("/webhook", WebhookReceiver)

	// Configuration endpoints (for testing)
	config := router.Group("/config")
	{
		config.POST("/failure-rate", SetFailureRate)
		config.POST("/latency", SetLatency)
		config.GET("/stats", GetStats)
		config.POST("/reset", ResetConfig)
	}

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Mock Gateway Server starting on port %s", port)
	log.Printf("📚 API Documentation: http://localhost:%s/health", port)
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("Endpoints:")
	log.Println("  ZainCash:  POST /zaincash/transaction/init")
	log.Println("  FastPay:   POST /fastpay/payment/init")
	log.Println("  FIB:       POST /fib/oauth/token")
	log.Println("             POST /fib/payment/create")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
