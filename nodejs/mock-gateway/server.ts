/**
 * Mock Payment Gateway Server for Testing
 *
 * This server simulates the payment gateway APIs for:
 * - ZainCash
 * - FastPay
 * - FIB
 *
 * Run with: npm run mock-gateway
 */

import express from 'express';
import crypto from 'crypto';

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Store transactions in memory
const transactions = new Map<string, any>();

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ==================== ZainCash Endpoints ====================

app.post('/zaincash/transaction/init', (req, res) => {
  const { token, amount } = req.body;

  // Validate JWT token (simplified - in reality would decode and verify)
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  const transactionId = `zc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const transaction = {
    transaction_id: transactionId,
    amount: amount || 0,
    status: 'pending',
    redirect_url: `https://sandbox.zaincash.iq/redirect/${transactionId}`,
    deep_link: `zaincash://payment/${transactionId}`,
    provider: 'zainCash',
    created_at: new Date().toISOString(),
  };

  transactions.set(transactionId, transaction);

  console.log(`[ZainCash] Created transaction: ${transactionId}`);
  res.json(transaction);
});

app.get('/zaincash/transaction/status/:id', (req, res) => {
  const transaction = transactions.get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json({ id: req.params.id, status: transaction.status });
});

// ==================== FastPay Endpoints ====================

const FASTPAY_CREDENTIALS = {
  storeId: 'store123',
  password: 'pass123',
};

// Basic Auth middleware for FastPay
const fastPayAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
  const [storeId, password] = credentials.split(':');

  if (storeId !== FASTPAY_CREDENTIALS.storeId || password !== FASTPAY_CREDENTIALS.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  next();
};

app.post('/fastpay/payment/init', fastPayAuth, (req, res) => {
  const { amount, order_id, callback_url, webhook_url, description, metadata } = req.body;

  // Validate amount range (500 - 10,000,000 IQD)
  if (amount < 500 || amount > 10000000) {
    return res.status(400).json({
      error: 'Invalid amount',
      message: 'Amount must be between 500 and 10000000 IQD',
    });
  }

  const transactionId = `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const transaction = {
    payment_id: transactionId,
    transaction_id: transactionId,
    amount,
    order_id,
    status: 'pending',
    redirect_url: `https://sandbox.fastpay.iq/redirect/${transactionId}`,
    deep_link: `fastpay://payment/${transactionId}`,
    provider: 'fastPay',
    description: description || null,
    metadata: metadata || null,
    created_at: new Date().toISOString(),
  };

  transactions.set(transactionId, transaction);

  console.log(`[FastPay] Created payment: ${transactionId} (${amount} IQD)`);
  res.json(transaction);
});

app.get('/fastpay/payment/status/:id', (req, res) => {
  const transaction = transactions.get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json({
    payment_id: req.params.id,
    transaction_id: req.params.id,
    status: transaction.status,
    amount: transaction.amount,
  });
});

app.post('/fastpay/payment/refund/:id', fastPayAuth, (req, res) => {
  const transaction = transactions.get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  if (transaction.status !== 'completed') {
    return res.status(400).json({ error: 'Can only refund completed payments' });
  }

  transaction.status = 'refunded';
  transaction.refunded_at = new Date().toISOString();

  console.log(`[FastPay] Refunded payment: ${req.params.id}`);
  res.json({
    payment_id: req.params.id,
    status: 'refunded',
    refund_amount: transaction.amount,
  });
});

// ==================== FIB Endpoints ====================

const FIB_CREDENTIALS = {
  clientId: 'client123',
  clientSecret: 'secret123',
};

// OAuth token storage
let fibAccessToken: string | null = null;
let fibTokenExpiresAt: number | null = null;

app.post('/fib/oauth/token', (req, res) => {
  const { grant_type, client_id, client_secret } = req.body;

  if (grant_type !== 'client_credentials') {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  if (client_id !== FIB_CREDENTIALS.clientId || client_secret !== FIB_CREDENTIALS.clientSecret) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  // Generate a mock access token
  fibAccessToken = 'fib_mock_token_' + Date.now();
  fibTokenExpiresAt = Date.now() + 3600 * 1000; // 1 hour

  console.log('[FIB] Issued access token');
  res.json({
    access_token: fibAccessToken,
    token_type: 'Bearer',
    expires_in: 3600,
  });
});

// Bearer token middleware for FIB
const fibAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.split(' ')[1];

  // Check if token is our mock token
  if (!token.startsWith('fib_mock_token_')) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Check if token expired
  if (fibTokenExpiresAt && Date.now() > fibTokenExpiresAt) {
    return res.status(401).json({ error: 'Token expired' });
  }

  next();
};

app.post('/fib/payment/init', fibAuth, (req, res) => {
  const { amount, order_id, callback_url, webhook_url, description, metadata } = req.body;

  // Validate amount range (1000 - 100,000,000 IQD)
  if (amount < 1000 || amount > 100000000) {
    return res.status(400).json({
      error: 'Invalid amount',
      message: 'Amount must be between 1000 and 100000000 IQD',
    });
  }

  const transactionId = `fib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const transaction = {
    transaction_id: transactionId,
    amount,
    order_id,
    status: 'pending',
    redirect_url: `https://sandbox.fib.iq/redirect/${transactionId}`,
    deep_link: `fib://payment/${transactionId}`,
    provider: 'fib',
    description: description || null,
    metadata: metadata || null,
    created_at: new Date().toISOString(),
  };

  transactions.set(transactionId, transaction);

  console.log(`[FIB] Created payment: ${transactionId} (${amount} IQD)`);
  res.json(transaction);
});

app.get('/fib/payment/status/:id', fibAuth, (req, res) => {
  const transaction = transactions.get(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json({
    transaction_id: req.params.id,
    status: transaction.status,
    amount: transaction.amount,
  });
});

// ==================== Webhook Simulation ====================

app.post('/fastpay/webhook/simulate', (req, res) => {
  const { payment_id, status = 'completed' } = req.body;

  const transaction = transactions.get(payment_id);
  if (!transaction) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  // Update transaction status
  transaction.status = status;

  // Generate webhook payload
  const payload = JSON.stringify({
    transaction_id: payment_id,
    payment_id: payment_id,
    status: status,
    amount: transaction.amount,
    order_id: transaction.order_id,
    timestamp: new Date().toISOString(),
  });

  // Generate signature
  const signature = 'sha256=' +
    crypto.createHmac('sha256', FASTPAY_CREDENTIALS.password)
      .update(payload)
      .digest('hex');

  console.log(`[FastPay] Webhook simulation: ${payment_id} -> ${status}`);
  res.json({
    payload: JSON.parse(payload),
    signature,
    headers: {
      'Content-Type': 'application/json',
      'X-Mesopotamia-Signature': signature,
    },
  });
});

// ==================== Server Start ====================

app.listen(PORT, () => {
  console.log('\n=================================');
  console.log(`Mock Payment Gateway running on http://localhost:${PORT}`);
  console.log('=================================\n');
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /zaincash/transaction/init');
  console.log('  GET  /zaincash/transaction/status/:id');
  console.log('  POST /fastpay/payment/init');
  console.log('  GET  /fastpay/payment/status/:id');
  console.log('  POST /fastpay/payment/refund/:id');
  console.log('  POST /fastpay/webhook/simulate');
  console.log('  POST /fib/oauth/token');
  console.log('  POST /fib/payment/init');
  console.log('  GET  /fib/payment/status/:id');
  console.log('\nTest credentials:');
  console.log('  FastPay: store123:pass123');
  console.log('  FIB: client123:secret123');
  console.log('=================================\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down mock gateway...');
  process.exit(0);
});
