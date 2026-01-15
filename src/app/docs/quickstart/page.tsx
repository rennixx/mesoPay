'use client';

import { FadeIn } from '@/components/ScrollAnimations';
import Link from 'next/link';

export default function QuickstartPage() {
    return (
        <div className="pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <FadeIn>
                    <h1 className="text-4xl font-bold text-white mb-6">Quickstart Guide</h1>
                    <p className="text-xl text-gray-400 mb-10">Get started with MesoPay SDK in under 5 minutes.</p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="prose prose-invert max-w-none">
                        <h2>Installation</h2>

                        <h3>Node.js / TypeScript</h3>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <code className="text-green-400">npm install mesopotamia-sdk</code>
                            </div>
                        </div>

                        <h3>Flutter</h3>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <code className="text-green-400">flutter pub add mesopotamia_sdk</code>
                            </div>
                        </div>

                        <h3>Rust</h3>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <code className="text-green-400">cargo add mesopotamia-core</code>
                            </div>
                        </div>

                        <h2>Basic Setup</h2>
                        <div className="code-block mb-6">
                            <div className="code-header">
                                <span className="text-sm text-gray-400">app.ts</span>
                            </div>
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`import { MesopotamiaSDK, PaymentProvider, Environment } from 'mesopotamia-sdk';

const sdk = new MesopotamiaSDK({
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

                        <h2>Create a Payment</h2>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const payment = await sdk.createPayment({
  provider: PaymentProvider.ZAIN_CASH,
  amount: 50000, // 50,000 IQD
  orderId: 'ORDER_123',
  callbackUrl: 'https://yourapp.com/callback',
  webhookUrl: 'https://yourapp.com/webhook',
});

// Redirect user to payment
res.redirect(payment.redirectUrl);`}</pre>
                            </div>
                        </div>

                        <h2>Next Steps</h2>
                        <div className="grid md:grid-cols-3 gap-4 not-prose mt-6">
                            <Link href="/docs/zaincash" className="card hover:border-green-500/30">
                                <h3 className="text-lg font-semibold text-white mb-2">ZainCash</h3>
                                <p className="text-sm text-gray-400">Mobile wallet integration</p>
                            </Link>
                            <Link href="/docs/fastpay" className="card hover:border-blue-500/30">
                                <h3 className="text-lg font-semibold text-white mb-2">FastPay</h3>
                                <p className="text-sm text-gray-400">E-commerce payments</p>
                            </Link>
                            <Link href="/docs/fib" className="card hover:border-purple-500/30">
                                <h3 className="text-lg font-semibold text-white mb-2">FIB</h3>
                                <p className="text-sm text-gray-400">Enterprise banking</p>
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
