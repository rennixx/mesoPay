#!/bin/bash
# Concurrent Request Test Script for Mesopotamia SDK
# Tests multiple simultaneous payment requests

set -e

MOCK_GATEWAY_URL="http://localhost:8080"
NUM_REQUESTS=10

echo "========================================"
echo "Concurrent Request Stress Test"
echo "========================================"
echo "Testing $NUM_REQUESTS concurrent requests..."
echo ""

# Function to create a FastPay payment
create_payment() {
    local id=$1
    curl -s -X POST "$MOCK_GATEWAY_URL/fastpay/payment/init" \
        -H "Content-Type: application/json" \
        -H "Authorization: Basic c3RvcmUxMjM6cGFzczEyMw==" \
        -d "{
            \"amount\": $((10000 + id * 1000)),
            \"order_id\": \"CONCURRENT_TEST_$id\",
            \"callback_url\": \"http://example.com/callback\",
            \"webhook_url\": \"http://example.com/webhook\"
        }"
}

# Export function for parallel execution
export -f create_payment
export MOCK_GATEWAY_URL

echo "Launching $NUM_REQUESTS concurrent requests..."

# Using bash background processes for concurrent execution
START_TIME=$(date +%s%N)

for i in $(seq 1 $NUM_REQUESTS); do
    create_payment $i > "/tmp/test_response_$i.json" 2>&1 &
    PIDS["$i"]=$!
done

# Wait for all processes to complete
FAILED=0
for i in "${!PIDS[@]}"; do
    wait ${PIDS[$i]} || ((FAILED++))
done

END_TIME=$(date +%s%N)

# Calculate duration
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

echo "All requests completed in ${DURATION}ms"
echo ""

# Check results
SUCCESS_COUNT=0
for i in $(seq 1 $NUM_REQUESTS); do
    RESPONSE=$(cat "/tmp/test_response_$i.json")
    if [[ $RESPONSE == *"payment_id"* ]]; then
        ((SUCCESS_COUNT++))
    else
        echo "Request $i failed:"
        echo "  $RESPONSE"
    fi
done

echo "========================================"
echo "Results:"
echo "  Total Requests: $NUM_REQUESTS"
echo "  Successful: $SUCCESS_COUNT"
echo "  Failed: $((NUM_REQUESTS - SUCCESS_COUNT))"
echo "  Duration: ${DURATION}ms"
echo "  Average: $((DURATION / NUM_REQUESTS))ms per request"
echo "========================================"

# Cleanup
rm -f /tmp/test_response_*.json

if [ $SUCCESS_COUNT -eq $NUM_REQUESTS ]; then
    echo "✓ All concurrent requests succeeded!"
    exit 0
else
    echo "✗ Some requests failed"
    exit 1
fi
