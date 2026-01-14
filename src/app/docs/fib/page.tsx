'use client';

import { FadeIn } from '@/components/ScrollAnimations';
import Link from 'next/link';

export default function FIBPage() {
    return (
        <div className="min-h-screen pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <FadeIn>
                    <Link href="/docs" className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Docs
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                            FIB
                        </div>
                        <h1 className="text-4xl font-bold text-white">First Iraqi Bank</h1>
                    </div>
                    <p className="text-xl text-gray-400 mb-10">Enterprise banking integration with highest limits.</p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="prose prose-invert max-w-none">
                        <div className="glass p-4 rounded-xl mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Amount Range</span>
                                <span className="text-white">1,000 - 100,000,000 IQD</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-400">Authentication</span>
                                <span className="text-purple-400 font-mono">OAuth2 Bearer</span>
                            </div>
                        </div>

                        <h2>Configuration</h2>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX,
  providers: {
    [PaymentProvider.FIB]: {
      merchantId: process.env.FIB_MERCHANT_ID!,
      apiKey: process.env.FIB_CLIENT_ID!,
      apiSecret: process.env.FIB_CLIENT_SECRET!,
    },
  },
});`}</pre>
                            </div>
                        </div>

                        <h2>High-Value Transactions</h2>
                        <p>FIB supports the highest transaction limits (up to 100M IQD):</p>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const payment = await sdk.createPayment({
  provider: PaymentProvider.FIB,
  amount: 50000000, // 50 million IQD
  orderId: 'ENTERPRISE_ORDER_001',
  callbackUrl: 'https://yourapp.com/callback',
  webhookUrl: 'https://yourapp.com/webhook',
  metadata: {
    companyName: 'Acme Corp',
    invoiceNumber: 'INV-2024-001',
  },
});`}</pre>
                            </div>
                        </div>

                        <h2>OAuth2 Flow</h2>
                        <p>The SDK handles OAuth2 token management automatically:</p>
                        <ul>
                            <li>Requests access token using client credentials</li>
                            <li>Caches token until expiry</li>
                            <li>Automatically refreshes expired tokens</li>
                        </ul>

                        <h2>Enterprise Features</h2>
                        <ul>
                            <li>Batch payments</li>
                            <li>Recurring billing</li>
                            <li>Custom reporting</li>
                            <li>Dedicated support</li>
                        </ul>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
