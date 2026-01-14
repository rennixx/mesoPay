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
