'use client';

import { motion } from 'framer-motion';
import { FadeIn, BlurIn } from './ScrollAnimations';

export default function HostedCheckout() {
    return (
        <section id="hosted-checkout" className="py-32 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-indigo-500/10 via-transparent to-transparent rounded-full" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6">
                <FadeIn className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 text-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-gray-400">New Feature</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        <span className="text-white">Hosted </span>
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Checkout
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Let MesoPay handle the entire checkout experience. Zero frontend code required.
                        Just redirect your customers and receive webhooks.
                    </p>
                </FadeIn>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left - Code Example */}
                    <FadeIn delay={0.1}>
                        <motion.div
                            className="code-block glow-border"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="code-header">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <span className="text-xs text-gray-500">checkout.ts</span>
                            </div>
                            <div className="code-content">
                                <pre className="text-sm leading-relaxed">
                                    <code>
                                        <span className="token-comment">// Create a hosted checkout session</span>{'\n'}
                                        <span className="token-keyword">const</span>{' '}
                                        <span className="token-variable">session</span> ={' '}
                                        <span className="token-keyword">await</span> fetch(
                                        <span className="token-string">&apos;/api/create-session&apos;</span>, {'{'}{'\n'}
                                        {'  '}method: <span className="token-string">&apos;POST&apos;</span>,{'\n'}
                                        {'  '}body: JSON.stringify({'{'}{'\n'}
                                        {'    '}storeName: <span className="token-string">&apos;Your Store&apos;</span>,{'\n'}
                                        {'    '}orderId: <span className="token-string">&apos;ORD-12345&apos;</span>,{'\n'}
                                        {'    '}amount: <span className="token-number">75000</span>,{'\n'}
                                        {'    '}successUrl: <span className="token-string">&apos;/success&apos;</span>,{'\n'}
                                        {'    '}cancelUrl: <span className="token-string">&apos;/cancel&apos;</span>,{'\n'}
                                        {'    '}webhookUrl: <span className="token-string">&apos;/api/webhook&apos;</span>,{'\n'}
                                        {'  '}{'}'}){'\n'}
                                        {'}'});{'\n\n'}
                                        <span className="token-comment">// Redirect customer to checkout</span>{'\n'}
                                        window.location.href = session.<span className="token-property">checkoutUrl</span>;
                                    </code>
                                </pre>
                            </div>
                        </motion.div>
                    </FadeIn>

                    {/* Right - Visual */}
                    <BlurIn delay={0.2}>
                        <div className="relative">
                            {/* Checkout Preview Card */}
                            <motion.div
                                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
                                initial={{ y: 20 }}
                                whileInView={{ y: 0 }}
                                viewport={{ once: true }}
                            >
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">CloudSync Pro</div>
                                            <div className="text-xs text-gray-500 font-mono">Order #CS-12345</div>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <div className="font-bold text-gray-900">75,000</div>
                                            <div className="text-xs text-gray-400 font-semibold">IQD</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Methods */}
                                <div className="p-6">
                                    {/* Tabs */}
                                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
                                        <div className="flex-1 py-2.5 bg-white rounded-lg text-center text-sm font-semibold text-indigo-600 shadow-sm">
                                            Card
                                        </div>
                                        <div className="flex-1 py-2.5 rounded-lg text-center text-sm font-medium text-gray-400">
                                            Wallet
                                        </div>
                                    </div>

                                    {/* Card Form Preview */}
                                    <div className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center">
                                                <span className="text-white text-[10px] font-bold">VISA</span>
                                            </div>
                                            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                <div className="flex -space-x-1">
                                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <div className="text-xs text-gray-400 mb-1">Card Number</div>
                                            <div className="text-gray-700 font-mono">4242 4242 4242 4242</div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <div className="text-xs text-gray-400 mb-1">Expiry</div>
                                                <div className="text-gray-700 font-mono">12/28</div>
                                            </div>
                                            <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <div className="text-xs text-gray-400 mb-1">CVV</div>
                                                <div className="text-gray-700 font-mono">•••</div>
                                            </div>
                                        </div>

                                        <motion.div
                                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-center text-white font-semibold shadow-lg"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Pay 75,000 IQD
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
                                    <span className="text-xs text-gray-400">Powered by</span>
                                    <img src="/mesopay_logo_black.png" alt="MesoPay" className="h-5" />
                                </div>
                            </motion.div>

                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-2xl" />
                        </div>
                    </BlurIn>
                </div>

                {/* Benefits */}
                <FadeIn delay={0.3} className="mt-20">
                    <div className="grid sm:grid-cols-3 gap-6">
                        {[
                            {
                                icon: '🔒',
                                title: 'PCI Compliant',
                                description: 'Card data never touches your servers'
                            },
                            {
                                icon: '🎨',
                                title: 'Customizable',
                                description: 'Match your brand with custom logos and colors'
                            },
                            {
                                icon: '📱',
                                title: 'Mobile Ready',
                                description: 'Responsive design works on any device'
                            },
                        ].map((benefit, i) => (
                            <motion.div
                                key={i}
                                className="card text-center"
                                whileHover={{ y: -4 }}
                            >
                                <div className="text-3xl mb-3">{benefit.icon}</div>
                                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                                <p className="text-gray-400 text-sm">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </FadeIn>
            </div>
        </section>
    );
}
