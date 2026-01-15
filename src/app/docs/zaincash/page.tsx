'use client';

import { FadeIn } from '@/components/ScrollAnimations';

export default function ZainCashPage() {
    return (
        <div className="pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <FadeIn>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                            Z
                        </div>
                        <h1 className="text-4xl font-bold text-white">ZainCash</h1>
                    </div>
                    <p className="text-xl text-gray-400 mb-10">Iraq&apos;s leading mobile wallet with millions of users.</p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="prose prose-invert max-w-none">
                        <div className="glass p-4 rounded-xl mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Amount Range</span>
                                <span className="text-white">1,000 - 5,000,000 IQD</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-400">Authentication</span>
                                <span className="text-green-400 font-mono">JWT (HS256)</span>
                            </div>
                        </div>

                        <h2>Configuration</h2>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX,
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: process.env.ZAINCASH_MERCHANT_ID!,
      apiKey: process.env.ZAINCASH_API_KEY!,
      apiSecret: process.env.ZAINCASH_API_SECRET!,
    },
  },
});`}</pre>
                            </div>
                        </div>

                        <h2>Create Payment</h2>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const payment = await sdk.createPayment({
  provider: PaymentProvider.ZAIN_CASH,
  amount: 25000, // 25,000 IQD
  orderId: 'ORDER_123',
  callbackUrl: 'https://yourapp.com/callback',
  webhookUrl: 'https://yourapp.com/webhook',
});

// For mobile apps, use deep link
if (payment.deepLink) {
  openDeepLink(payment.deepLink);
} else {
  res.redirect(payment.redirectUrl);
}`}</pre>
                            </div>
                        </div>

                        <h2>Handle Webhook</h2>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`app.post('/webhook/zaincash', (req, res) => {
  const isValid = sdk.verifyWebhook(
    PaymentProvider.ZAIN_CASH,
    req.headers['x-mesopotamia-signature'],
    req.rawBody,
    parseInt(req.headers['x-mesopotamia-timestamp'])
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook...
  res.json({ received: true });
});`}</pre>
                            </div>
                        </div>

                        <h2>Best Practices</h2>
                        <ul>
                            <li>Use deep links for mobile apps for better UX</li>
                            <li>Store transaction IDs for reconciliation</li>
                            <li>Handle transaction timeouts (15 minutes)</li>
                            <li>Always verify webhook signatures</li>
                        </ul>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
