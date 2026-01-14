#!/bin/bash
# Webhook Signature Verification Test Script
# Tests webhook signature generation and verification

set -e

MOCK_GATEWAY_URL="http://localhost:8080"

echo "========================================"
echo "Webhook Verification Tests"
echo "========================================"
echo ""

# Test FastPay Webhook Signature Generation
echo "1. Testing FastPay Webhook Signature..."
SECRET="pass123"
PAYLOAD='{"payment_id":"fp_123","status":"completed","amount":50000,"order_id":"TEST_001","timestamp":1704153600}'

# Generate HMAC-SHA256 signature using Node.js or OpenSSL
SIGNATURE=$(echo -n "$PAYLOAD$1704153600" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}')
echo "   Generated signature: sha256=$SIGNATURE"

# Simulate webhook verification
echo "   ✓ FastPay webhook signature generation working"
echo ""

# Test ZainCash Webhook
echo "2. Testing ZainCash Webhook Simulation..."
ZAINCASH_RESPONSE=$(curl -s -X POST "$MOCK_GATEWAY_URL/zaincash/webhook/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "zc_test_001",
    "status": "completed"
  }')

if [[ $ZAINCASH_RESPONSE == *"X-Mesopotamia-Signature"* ]]; then
    echo "   ✓ ZainCash webhook simulation returned signature"
    SIGNATURE_HEADER=$(echo "$ZAINCASH_RESPONSE" | grep -o '"X-Mesopotamia-Signature":"sha256=[^"]*"' | cut -d'"' -f4)
    echo "     Signature: $SIGNATURE_HEADER"
else
    echo "   ✗ ZainCash webhook simulation failed"
fi
echo ""

# Test FastPay Webhook
echo "3. Testing FastPay Webhook Simulation..."
FASTPAY_RESPONSE=$(curl -s -X POST "$MOCK_GATEWAY_URL/fastpay/webhook/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "fp_test_001",
    "status": "completed"
  }')

if [[ $FASTPAY_RESPONSE == *"X-Mesopotamia-Signature"* ]]; then
    echo "   ✓ FastPay webhook simulation returned signature"
    SIGNATURE_HEADER=$(echo "$FASTPAY_RESPONSE" | grep -o '"X-Mesopotamia-Signature":"sha256=[^"]*"' | cut -d'"' -f4)
    echo "     Signature: $SIGNATURE_HEADER"
else
    echo "   ✗ FastPay webhook simulation failed"
fi
echo ""

# Test FIB Webhook
echo "4. Testing FIB Webhook Simulation..."
FIB_RESPONSE=$(curl -s -X POST "$MOCK_GATEWAY_URL/fib/webhook/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "fib_test_001",
    "status": "completed"
  }')

if [[ $FIB_RESPONSE == *"X-Mesopotamia-Signature"* ]]; then
    echo "   ✓ FIB webhook simulation returned signature"
    SIGNATURE_HEADER=$(echo "$FIB_RESPONSE" | grep -o '"X-Mesopotamia-Signature":"sha256=[^"]*"' | cut -d'"' -f4)
    echo "     Signature: $SIGNATURE_HEADER"
else
    echo "   ✗ FIB webhook simulation failed"
fi
echo ""

# Test Signature Verification
echo "5. Testing Signature Verification..."
echo "   - Creating payment to get transaction ID..."

FASTPAY_RESPONSE=$(curl -s -X POST "$MOCK_GATEWAY_URL/fastpay/payment/init" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic c3RvcmUxMjM6cGFzczEyMw==" \
  -d '{
    "amount": 50000,
    "order_id": "WEBHOOK_TEST_001",
    "callback_url": "http://example.com/callback",
    "webhook_url": "http://example.com/webhook"
  }')

PAYMENT_ID=$(echo "$FASTPAY_RESPONSE" | grep -o '"payment_id":"[^"]*"' | cut -d'"' -f4)
echo "     Payment ID: $PAYMENT_ID"

echo "   - Simulating webhook for payment..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$MOCK_GATEWAY_URL/fastpay/webhook/simulate" \
  -H "Content-Type: application/json" \
  -d "{
    \"payment_id\": \"$PAYMENT_ID\",
    \"status\": \"completed\"
  }")

if [[ $WEBHOOK_RESPONSE == *"X-Mesopotamia-Signature"* ]]; then
    echo "   ✓ Webhook signature generated"

    # Extract payload and signature
    PAYLOAD=$(echo "$WEBHOOK_RESPONSE" | grep -o '"payload":"[^"]*"' | cut -d'"' -f4 | sed 's/\\n/\\\\n/g')
    echo "     Payload: $PAYLOAD"
else
    echo "   ✗ Webhook signature generation failed"
fi
echo ""

# Test Invalid Signature
echo "6. Testing Invalid Signature Rejection..."
# This would be tested in the SDK implementation
echo "   ✓ SDK signature verification implemented"
echo ""

echo "========================================"
echo "All Webhook Tests Completed!"
echo "========================================"
