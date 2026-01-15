'use client';

import { FadeIn } from '@/components/ScrollAnimations';

export default function FastPayPage() {
    return (
        <div className="pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <FadeIn>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                            F
                        </div>
                        <h1 className="text-4xl font-bold text-white">FastPay</h1>
                    </div>
                    <p className="text-xl text-gray-400 mb-10">E-commerce payments with refund support.</p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="prose prose-invert max-w-none">
                        <div className="glass p-4 rounded-xl mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Amount Range</span>
                                <span className="text-white">500 - 10,000,000 IQD</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-400">Authentication</span>
                                <span className="text-blue-400 font-mono">Basic Auth</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-gray-400">Refunds</span>
                                <span className="text-green-400">✓ Supported</span>
                            </div>
                        </div>

                        <h2>Configuration</h2>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const sdk = new MesopotamiaSDK({
  environment: Environment.SANDBOX,
  providers: {
    [PaymentProvider.FAST_PAY]: {
      merchantId: process.env.FASTPAY_MERCHANT_ID!,
      apiKey: process.env.FASTPAY_USERNAME!,
      apiSecret: process.env.FASTPAY_PASSWORD!,
    },
  },
});`}</pre>
                            </div>
                        </div>

                        <h2>Refunds</h2>
                        <p>FastPay is the only gateway that supports programmatic refunds:</p>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const refund = await sdk.refundPayment(
  'ORIGINAL_TRANSACTION_ID',
  50000, // Partial refund: 50,000 IQD
  'Customer requested refund'
);

console.log('Refund ID:', refund.refundId);`}</pre>
                            </div>
                        </div>

                        <h3>Refund Rules</h3>
                        <ul>
                            <li>Full or partial refunds supported</li>
                            <li>Must be within 30 days of original transaction</li>
                            <li>One refund per transaction</li>
                        </ul>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
