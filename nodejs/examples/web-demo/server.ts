import express from 'express';
import path from 'path';
import { MesopotamiaSDK, PaymentProvider, Environment } from '../../src';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SDK with Sandbox credentials
const sdk = new MesopotamiaSDK({
    environment: Environment.SANDBOX,
    enableLogging: true,
    providers: {
        [PaymentProvider.ZAIN_CASH]: {
            merchantId: 'merchant_123',
            apiKey: 'pk_zain_123',
            apiSecret: 'sk_zain_123',
        },
        [PaymentProvider.FASTPAY]: {
            merchantId: 'store_123',
            apiKey: 'pk_fast_123',
            apiSecret: 'sk_fast_123',
        },
        [PaymentProvider.FIB]: {
            merchantId: 'client_123',
            apiKey: 'pk_fib_123',
            apiSecret: 'sk_fib_123',
        },
    },
});

// ===== PAYMENT SESSIONS (For Multi-Merchant Support) =====
interface PaymentSession {
    id: string;
    storeName: string;
    storeIcon?: string; // URL to store logo
    orderId: string;
    amount: number;
    currency: string;
    description?: string;
    successUrl?: string; // Redirect after successful payment
    cancelUrl?: string;  // Redirect if user cancels
    webhookUrl?: string; // Notify merchant's server on payment completion
    createdAt: Date;
    expiresAt: Date;
}

const sessions = new Map<string, PaymentSession>();

// Generate unique session ID
function generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Helper: Send Webhook to Merchant
async function sendWebhook(webhookUrl: string, payload: object): Promise<void> {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-MesoPay-Signature': generateSignature(payload),
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Webhook failed: ${response.status}`);
        }
    } catch (error) {
        console.error(`Webhook error:`, error);
    }
}

// Helper: Generate HMAC signature for webhook security
function generateSignature(payload: object): string {
    const crypto = require('crypto');
    const secret = 'mesopay_webhook_secret'; // In production, this would be per-merchant
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

// API: Create Payment Session (Merchants call this)
app.post('/api/create-session', (req, res) => {
    try {
        const { storeName, storeIcon, orderId, amount, currency = 'IQD', description, successUrl, cancelUrl, webhookUrl } = req.body;

        if (!storeName || !orderId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: storeName, orderId, amount'
            });
        }

        const sessionId = generateSessionId();
        const session: PaymentSession = {
            id: sessionId,
            storeName,
            storeIcon,
            orderId,
            amount: Number(amount),
            currency,
            description,
            successUrl: successUrl || `/success.html?order=${orderId}&amount=${amount}`,
            cancelUrl: cancelUrl || `/failed.html?order=${orderId}`,
            webhookUrl,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
        };

        sessions.set(sessionId, session);

        console.log(`✅ Session created: ${sessionId} for ${storeName}`);

        res.json({
            success: true,
            sessionId,
            paymentUrl: `http://localhost:${PORT}?session=${sessionId}`,
        });

    } catch (error: any) {
        console.error('Session Creation Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Get Session Details (Frontend calls this)
app.get('/api/session/:id', (req, res) => {
    const session = sessions.get(req.params.id);

    if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found or expired' });
    }

    if (new Date() > session.expiresAt) {
        sessions.delete(req.params.id);
        return res.status(410).json({ success: false, error: 'Session expired' });
    }

    res.json({
        success: true,
        session: {
            storeName: session.storeName,
            storeIcon: session.storeIcon,
            orderId: session.orderId,
            amount: session.amount,
            currency: session.currency,
            description: session.description,
            successUrl: session.successUrl,
            cancelUrl: session.cancelUrl,
        }
    });
});

// API: Create Payment
app.post('/api/pay', async (req, res) => {
    try {
        const { provider, amount, sessionId } = req.body;

        console.log(`Creating payment for ${provider} - ${amount} IQD`);

        // Get session if provided
        const session = sessionId ? sessions.get(sessionId) : null;
        const orderId = session?.orderId || `ORD-${Date.now()}`;

        const payment = await sdk.createPayment({
            provider: provider as PaymentProvider,
            amount: Number(amount),
            orderId: orderId,
            callbackUrl: session?.successUrl || `http://localhost:${PORT}/success.html`,
            webhookUrl: `http://localhost:${PORT}/api/internal-webhook?sessionId=${sessionId || ''}`,
            description: session?.description || 'MesoPay Web Demo',
        });

        res.json({
            success: true,
            redirectUrl: payment.redirectUrl,
            deepLink: payment.deepLink,
            transactionId: payment.transactionId
        });

    } catch (error: any) {
        console.error('Payment Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API: Internal Webhook Handler (receives from payment providers, forwards to merchants)
app.post('/api/internal-webhook', async (req, res) => {
    const { sessionId } = req.query;
    const paymentData = req.body;

    // If session has a merchant webhook URL, forward the notification
    if (sessionId) {
        const session = sessions.get(sessionId as string);
        if (session) {
            const txnId = paymentData.transactionId || `TXN-${Date.now()}`;
            const status = paymentData.status === 'completed' ? 'SUCCESS' : 'FAILED';

            console.log(`💳 Session completed: ${sessionId} → ${status} (${txnId})`);

            if (session.webhookUrl) {
                const webhookPayload = {
                    event: 'payment.completed',
                    orderId: session.orderId,
                    amount: session.amount,
                    currency: session.currency,
                    status: 'paid',
                    transactionId: txnId,
                    timestamp: new Date().toISOString(),
                };

                // Send webhook to merchant (async, don't block response)
                sendWebhook(session.webhookUrl, webhookPayload);
            }

            // Clean up completed session
            sessions.delete(sessionId as string);
        }
    }

    res.status(200).send('OK');
});

// API: Webhook (Fallback for local testing)
app.post('/api/webhook', (req, res) => {
    res.status(200).send('OK');
});

// Start Server
app.listen(PORT, () => {
    console.log(`
  🚀 Mesopotamia Web Demo running at http://localhost:${PORT}
  Payment Simulator Ready.
  `);
});
