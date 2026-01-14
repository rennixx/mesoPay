const express = require('express');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== IN-MEMORY DATABASE (Demo Purpose) =====
let merchantSettings = {
    mesopayApiUrl: 'http://localhost:3000',
    storeName: 'CloudSync Pro',
    webhookUrl: 'http://localhost:4000/api/webhook',
    isConfigured: true
};

// User subscriptions database
const users = new Map();

// Initialize a demo user
users.set('demo@cloudsync.io', {
    email: 'demo@cloudsync.io',
    name: 'Demo User',
    subscription: {
        plan: 'free',
        status: 'active',
        storage: '2 GB',
        features: ['Basic upload', '1 device'],
        paidAt: null,
        expiresAt: null
    }
});

// Payments log
let paymentsLog = [];

// Plan definitions
const PLANS = {
    basic: {
        name: 'Basic',
        price: 25000,
        storage: '10 GB',
        features: ['10 GB Storage', '2 devices', 'Basic support', 'Standard upload speed']
    },
    pro: {
        name: 'Pro',
        price: 50000,
        storage: '100 GB',
        features: ['100 GB Storage', '5 devices', 'Priority support', 'Fast upload', 'File versioning']
    },
    enterprise: {
        name: 'Enterprise',
        price: 150000,
        storage: 'Unlimited',
        features: ['Unlimited Storage', 'Unlimited devices', '24/7 support', 'Lightning fast', 'Analytics', 'Team management']
    }
};

// ===== API ENDPOINTS =====

// Get current user subscription
app.get('/api/user', (req, res) => {
    const user = users.get('demo@cloudsync.io');
    res.json(user);
});

// Get Settings
app.get('/api/settings', (req, res) => {
    res.json(merchantSettings);
});

// Save Settings
app.post('/api/settings', (req, res) => {
    const { mesopayApiUrl, storeName, webhookUrl } = req.body;

    merchantSettings = {
        ...merchantSettings,
        mesopayApiUrl: mesopayApiUrl || merchantSettings.mesopayApiUrl,
        storeName: storeName || merchantSettings.storeName,
        webhookUrl: webhookUrl || merchantSettings.webhookUrl,
        isConfigured: true
    };

    console.log('✅ Settings saved:', merchantSettings);
    res.json({ success: true, settings: merchantSettings });
});

// Create Checkout Session
app.post('/api/checkout', async (req, res) => {
    try {
        const { plan } = req.body;
        const planData = PLANS[plan.toLowerCase()];

        if (!planData) {
            return res.status(400).json({ success: false, error: 'Invalid plan' });
        }

        const orderId = `SUB-${plan.toUpperCase()}-${Date.now()}`;

        console.log(`🛒 Creating checkout for ${planData.name} plan - ${planData.price} IQD`);

        // Call MesoPay to create a session
        const response = await fetch(`${merchantSettings.mesopayApiUrl}/api/create-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeName: merchantSettings.storeName,
                orderId: orderId,
                amount: planData.price,
                currency: 'IQD',
                description: `${planData.name} Subscription`,
                successUrl: `http://localhost:${PORT}/dashboard.html?upgraded=true&plan=${plan}`,
                cancelUrl: `http://localhost:${PORT}/pricing.html`,
                webhookUrl: merchantSettings.webhookUrl
            })
        });

        const data = await response.json();

        if (data.success) {
            // Store pending subscription
            const user = users.get('demo@cloudsync.io');
            user.pendingUpgrade = {
                orderId: orderId,
                plan: plan.toLowerCase(),
                planData: planData
            };

            console.log(`✅ Session created: ${data.sessionId}`);
            res.json({
                success: true,
                paymentUrl: data.paymentUrl,
                orderId: orderId
            });
        } else {
            throw new Error(data.error || 'Failed to create session');
        }

    } catch (error) {
        console.error('❌ Checkout Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Webhook Receiver - This is called by MesoPay after payment!
app.post('/api/webhook', (req, res) => {
    const signature = req.headers['x-mesopay-signature'];
    const payload = req.body;

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('💰 PAYMENT WEBHOOK RECEIVED!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Order ID:', payload.orderId);
    console.log('Amount:', payload.amount, payload.currency);
    console.log('Status:', payload.status);
    console.log('Transaction:', payload.transactionId);

    // Update user subscription based on payment
    const user = users.get('demo@cloudsync.io');

    if (user.pendingUpgrade && payload.status === 'paid') {
        const { plan, planData } = user.pendingUpgrade;

        // Upgrade the user!
        user.subscription = {
            plan: plan,
            status: 'active',
            storage: planData.storage,
            features: planData.features,
            paidAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        };

        delete user.pendingUpgrade;

        console.log('');
        console.log('🎉 USER UPGRADED TO', plan.toUpperCase(), 'PLAN!');
        console.log('   Storage:', planData.storage);
        console.log('   Features:', planData.features.join(', '));
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Log the payment
    paymentsLog.push({
        ...payload,
        receivedAt: new Date().toISOString()
    });

    res.status(200).json({ received: true });
});

// Simulate upgrade (for testing without webhook)
app.post('/api/simulate-upgrade', (req, res) => {
    const { plan } = req.body;
    const planData = PLANS[plan.toLowerCase()];

    if (!planData) {
        return res.status(400).json({ success: false, error: 'Invalid plan' });
    }

    const user = users.get('demo@cloudsync.io');
    user.subscription = {
        plan: plan.toLowerCase(),
        status: 'active',
        storage: planData.storage,
        features: planData.features,
        paidAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    console.log('🎉 Simulated upgrade to', plan.toUpperCase());
    res.json({ success: true, subscription: user.subscription });
});

// Reset subscription (for testing)
app.post('/api/reset-subscription', (req, res) => {
    const user = users.get('demo@cloudsync.io');
    user.subscription = {
        plan: 'free',
        status: 'active',
        storage: '2 GB',
        features: ['Basic upload', '1 device'],
        paidAt: null,
        expiresAt: null
    };
    delete user.pendingUpgrade;

    console.log('🔄 Subscription reset to FREE');
    res.json({ success: true, subscription: user.subscription });
});

// Get Payments Log
app.get('/api/payments', (req, res) => {
    res.json(paymentsLog);
});

// Start Server
app.listen(PORT, () => {
    console.log(`
  ☁️  CloudSync Pro Demo running at http://localhost:${PORT}
  
  📄 Pages:
     - Home:      http://localhost:${PORT}/
     - Dashboard: http://localhost:${PORT}/dashboard.html
     - Pricing:   http://localhost:${PORT}/pricing.html
     - Settings:  http://localhost:${PORT}/settings.html
  
  🧪 Test User: demo@cloudsync.io (Free plan)
  `);
});
