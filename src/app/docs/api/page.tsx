'use client';

import { FadeIn } from '@/components/ScrollAnimations';

export default function ApiReferencePage() {
    return (
        <div className="pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <FadeIn>
                    <h1 className="text-4xl font-bold text-white mb-6">API Reference</h1>
                    <p className="text-xl text-gray-400 mb-10">Complete SDK documentation for Node.js.</p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="prose prose-invert max-w-none">
                        <h2>MesopotamiaSDK</h2>
                        <p>The main SDK class for interacting with Iraqi payment gateways.</p>

                        <h3>Constructor</h3>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`new MesopotamiaSDK(config: SdkConfig)`}</pre>
                            </div>
                        </div>

                        <h3>Methods</h3>

                        <h4 className="text-purple-400">createPayment()</h4>
                        <p>Creates a new payment transaction.</p>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`createPayment(request: PaymentRequest): Promise<PaymentResponse>`}</pre>
                            </div>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-2 text-gray-400">Parameter</th>
                                    <th className="text-left py-2 text-gray-400">Type</th>
                                    <th className="text-left py-2 text-gray-400">Required</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/5">
                                    <td className="py-2 text-white">provider</td>
                                    <td className="py-2 text-cyan-400">PaymentProvider</td>
                                    <td className="py-2 text-green-400">✓</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-2 text-white">amount</td>
                                    <td className="py-2 text-cyan-400">number</td>
                                    <td className="py-2 text-green-400">✓</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-2 text-white">orderId</td>
                                    <td className="py-2 text-cyan-400">string</td>
                                    <td className="py-2 text-green-400">✓</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-2 text-white">callbackUrl</td>
                                    <td className="py-2 text-cyan-400">string</td>
                                    <td className="py-2 text-green-400">✓</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-2 text-white">webhookUrl</td>
                                    <td className="py-2 text-cyan-400">string</td>
                                    <td className="py-2 text-green-400">✓</td>
                                </tr>
                            </tbody>
                        </table>

                        <h4 className="text-purple-400 mt-8">getPaymentStatus()</h4>
                        <p>Gets the current status of a payment.</p>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`getPaymentStatus(provider: PaymentProvider, transactionId: string): Promise<PaymentStatus>`}</pre>
                            </div>
                        </div>

                        <h4 className="text-purple-400 mt-8">verifyWebhook()</h4>
                        <p>Verifies a webhook signature for authenticity.</p>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`verifyWebhook(provider, signature, payload, timestamp?): boolean`}</pre>
                            </div>
                        </div>

                        <h4 className="text-purple-400 mt-8">refundPayment()</h4>
                        <p>Refunds a payment (FastPay only).</p>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`refundPayment(transactionId, amount, reason?): Promise<RefundResponse>`}</pre>
                            </div>
                        </div>

                        <h2>Enums</h2>

                        <h4>PaymentProvider</h4>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`enum PaymentProvider {
  ZAIN_CASH = 'zaincash',
  FAST_PAY = 'fastpay',
  FIB = 'fib',
}`}</pre>
                            </div>
                        </div>

                        <h4>PaymentStatus</h4>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}`}</pre>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
