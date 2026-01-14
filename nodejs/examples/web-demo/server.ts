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
    createdAt: Date;
    expiresAt: Date;
}

const sessions = new Map<string, PaymentSession>();

// Generate unique session ID
function generateSessionId(): string {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// API: Create Payment Session (Merchants call this)
app.post('/api/create-session', (req, res) => {
    try {
        const { storeName, storeIcon, orderId, amount, currency = 'IQD', description } = req.body;

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
        }
    });
});

// API: Create Payment
app.post('/api/pay', async (req, res) => {
    try {
        const { provider, amount } = req.body;

        console.log(`Creating payment for ${provider} - ${amount} IQD`);

        // In a real app, generate a real unique Order ID
        const orderId = `ORD-${Date.now()}`;

        const payment = await sdk.createPayment({
            provider: provider as PaymentProvider,
            amount: Number(amount),
            orderId: orderId,
            callbackUrl: `http://localhost:${PORT}/success.html`,
            webhookUrl: `http://localhost:${PORT}/api/webhook`,
            description: 'Mesopotamia SDK Web Demo',
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

// API: Webhook (Simulation)
app.post('/api/webhook', (req, res) => {
    console.log('Webhook Received:', req.body);
    res.status(200).send('OK');
});

// Start Server
app.listen(PORT, () => {
    console.log(`
  🚀 Mesopotamia Web Demo running at http://localhost:${PORT}
  Payment Simulator Ready.
  `);
});
