'use client';

import { motion } from 'framer-motion';
import { FadeIn, BlurIn } from './ScrollAnimations';

const platforms = [
    {
        name: 'iOS',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
        )
    },
    {
        name: 'Android',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.523 15.341c-.583 0-1.056.473-1.056 1.056 0 .583.473 1.056 1.056 1.056.583 0 1.056-.473 1.056-1.056 0-.583-.473-1.056-1.056-1.056zm-11.046 0c-.583 0-1.056.473-1.056 1.056 0 .583.473 1.056 1.056 1.056.583 0 1.056-.473 1.056-1.056 0-.583-.473-1.056-1.056-1.056zM17.886 7.998l1.958-3.39c.108-.188.044-.428-.143-.536-.188-.108-.428-.044-.536.143L17.17 7.699c-1.455-.665-3.09-1.035-4.829-1.035h-.682c-1.739 0-3.374.37-4.829 1.035L4.835 4.215c-.108-.188-.348-.251-.536-.143-.188.108-.251.348-.143.536l1.958 3.39C2.591 9.965.348 14.128.348 18.877h23.304c0-4.749-2.243-8.912-5.766-10.879zM6.477 15.341c-.583 0-1.056.473-1.056 1.056 0 .583.473 1.056 1.056 1.056.583 0 1.056-.473 1.056-1.056 0-.583-.473-1.056-1.056-1.056zm11.046 0c-.583 0-1.056.473-1.056 1.056 0 .583.473 1.056 1.056 1.056.583 0 1.056-.473 1.056-1.056 0-.583-.473-1.056-1.056-1.056z" />
            </svg>
        )
    },
    {
        name: 'Web',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        )
    },
    {
        name: 'macOS',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v10h16V6H4zm4 14h8v2H8v-2z" />
            </svg>
        )
    },
    {
        name: 'Windows',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
            </svg>
        )
    },
    {
        name: 'Linux',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489.117.779.391 1.458.816 2.003-1.082-.066-1.647.655-1.647 1.228 0 .467.288.79.637.926-.078.303-.147.61-.147.953 0 1.273.87 2.162 1.977 2.162.422 0 .752-.116 1.018-.292.262.175.554.276.9.276.5 0 .905-.195 1.18-.538.275.343.68.538 1.18.538.346 0 .638-.1.9-.276.266.176.596.292 1.018.292 1.107 0 1.977-.889 1.977-2.162 0-.342-.069-.65-.147-.953.349-.136.637-.459.637-.926 0-.573-.565-1.294-1.647-1.228.425-.545.7-1.224.816-2.003.123-.805-.01-1.657-.287-2.489-.589-1.77-1.831-3.47-2.716-4.521-.75-1.067-.974-1.928-1.05-3.02-.066-1.491 1.056-5.965-3.17-6.298-.165-.013-.325-.021-.48-.021zm-.023 1.413c2.253 0 2.016 2.933 2.07 4.024.057 1.173.282 2.21 1.143 3.433.836.995 2.012 2.583 2.512 4.083.234.702.32 1.4.229 2.007-.073.478-.234.883-.486 1.206a4.9 4.9 0 0 0-.252-.243c-.2-.17-.425-.312-.67-.424-.244-.112-.509-.195-.79-.244-.281-.05-.579-.066-.886-.05.172-.193.29-.42.34-.668.052-.253.036-.52-.05-.775-.068-.2-.173-.39-.31-.559-.135-.167-.304-.31-.496-.424.065-.147.103-.3.114-.46.014-.203-.023-.41-.11-.603-.075-.165-.185-.319-.32-.456.067-.177.1-.368.094-.557-.007-.224-.067-.442-.177-.638-.091-.163-.215-.31-.367-.432.015-.173-.007-.35-.066-.518-.057-.163-.15-.315-.273-.445-.11-.117-.247-.213-.401-.284.013-.149 0-.3-.04-.445-.052-.192-.145-.375-.274-.532-.127-.152-.291-.28-.478-.374zm-1.1 10.646c.235 0 .426.19.426.423 0 .234-.191.424-.426.424-.234 0-.425-.19-.425-.424 0-.234.191-.423.425-.423zm2.247 0c.234 0 .425.19.425.423 0 .234-.19.424-.425.424-.234 0-.425-.19-.425-.424 0-.234.19-.423.425-.423z" />
            </svg>
        )
    },
];

export default function FlutterShowcase() {
    return (
        <section id="flutter-sdk" className="py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6">
                {/* Header */}
                <FadeIn className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 text-sm">
                        <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14.314 0L2.3 12 6 15.7 21.684.013h-7.357L14.314 0zm.014 11.072L7.857 17.53l6.47 6.47H21.7l-6.46-6.468 6.46-6.46h-7.37z" />
                        </svg>
                        <span className="text-gray-400">Flutter SDK</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        <span className="text-white">Beautiful UI, </span>
                        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Every Platform
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Pre-built payment widgets that match your app&apos;s design.
                        Write once, deploy everywhere with Flutter.
                    </p>
                </FadeIn>

                {/* Main Content */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left - Phone Mockups */}
                    <BlurIn delay={0.1}>
                        <div className="relative flex justify-center items-end gap-6">
                            {/* Card Payment Phone */}
                            <motion.div
                                className="relative z-10"
                                initial={{ y: 40, opacity: 0, rotate: -5 }}
                                whileInView={{ y: 0, opacity: 1, rotate: -5 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="w-[220px] bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-700">
                                    {/* Phone notch */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-20" />
                                    {/* Screen */}
                                    <div className="bg-gray-100 rounded-[2rem] overflow-hidden">
                                        {/* Status bar */}
                                        <div className="h-8 bg-gray-100 flex items-center justify-between px-6 text-[10px] text-gray-500">
                                            <span>9:41</span>
                                            <div className="flex gap-1">
                                                <div className="w-3 h-2 bg-gray-400 rounded-sm" />
                                                <div className="w-4 h-2 bg-gray-400 rounded-sm" />
                                            </div>
                                        </div>
                                        {/* Content */}
                                        <div className="p-4 pt-2 pb-8 min-h-[380px] bg-gray-50">
                                            {/* Card icons */}
                                            <div className="flex gap-2 mb-4">
                                                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                                                    <span className="text-white text-[8px] font-bold">VISA</span>
                                                </div>
                                                <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center">
                                                    <div className="flex -space-x-1">
                                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Form fields */}
                                            <div className="space-y-3">
                                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                    <div className="text-[9px] text-gray-400 mb-1">Card Number</div>
                                                    <div className="text-[11px] text-gray-700 font-mono">4242 4242 4242 4242</div>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                    <div className="text-[9px] text-gray-400 mb-1">Card Holder</div>
                                                    <div className="text-[11px] text-gray-700">Ahmed Mohammed</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                                                        <div className="text-[9px] text-gray-400 mb-1">Expiry</div>
                                                        <div className="text-[11px] text-gray-700 font-mono">12/28</div>
                                                    </div>
                                                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                                                        <div className="text-[9px] text-gray-400 mb-1">CVV</div>
                                                        <div className="text-[11px] text-gray-700 font-mono">•••</div>
                                                    </div>
                                                </div>
                                                <div className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-center text-white text-[11px] font-semibold shadow-lg mt-4">
                                                    Pay 50,000 IQD
                                                </div>
                                            </div>
                                            {/* Footer */}
                                            <div className="flex items-center justify-center gap-1.5 mt-4">
                                                <span className="text-[9px] text-gray-400">Secured by</span>
                                                <span className="text-[9px] font-bold text-gray-600">MesoPay</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/20 rounded-full blur-xl" />
                            </motion.div>

                            {/* Wallet Payment Phone */}
                            <motion.div
                                className="relative"
                                initial={{ y: 40, opacity: 0, rotate: 5 }}
                                whileInView={{ y: 0, opacity: 1, rotate: 5 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                <div className="w-[200px] bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border border-gray-700">
                                    {/* Phone notch */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full z-20" />
                                    {/* Screen */}
                                    <div className="bg-gray-100 rounded-[2rem] overflow-hidden">
                                        {/* Status bar */}
                                        <div className="h-7 bg-gray-100 flex items-center justify-between px-5 text-[9px] text-gray-500">
                                            <span>9:41</span>
                                            <div className="flex gap-1">
                                                <div className="w-2.5 h-1.5 bg-gray-400 rounded-sm" />
                                                <div className="w-3 h-1.5 bg-gray-400 rounded-sm" />
                                            </div>
                                        </div>
                                        {/* Content */}
                                        <div className="p-3 pt-1 pb-6 min-h-[340px] bg-gray-50">
                                            <div className="text-center text-[10px] text-gray-500 mb-3">Pay with FastPay</div>
                                            {/* Amount */}
                                            <div className="bg-white rounded-lg py-2 px-3 text-center mb-4 border border-gray-200">
                                                <span className="text-lg font-bold text-gray-800">50,000</span>
                                                <span className="text-[10px] text-gray-400 ml-1">IQD</span>
                                            </div>
                                            {/* QR Code placeholder */}
                                            <div className="bg-white rounded-xl p-3 mb-4 border border-gray-200">
                                                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <div className="grid grid-cols-5 gap-0.5">
                                                        {[1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1].map((filled, i) => (
                                                            <div
                                                                key={i}
                                                                className={`w-3 h-3 rounded-sm ${filled ? 'bg-gray-800' : 'bg-white'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Waiting status */}
                                            <div className="bg-red-50 rounded-lg py-2 px-3 flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                <span className="text-[9px] text-red-600 font-medium">Waiting for payment</span>
                                                <span className="text-[9px] text-red-500 font-mono">04:32</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-black/20 rounded-full blur-xl" />
                            </motion.div>
                        </div>
                    </BlurIn>

                    {/* Right - Code + Platforms */}
                    <div>
                        <FadeIn delay={0.2}>
                            <motion.div
                                className="code-block glow-border mb-8"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="code-header">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="text-xs text-gray-500">checkout_screen.dart</span>
                                </div>
                                <div className="code-content">
                                    <pre className="text-sm leading-relaxed">
                                        <code>
                                            <span className="token-keyword">import</span>{' '}
                                            <span className="token-string">&apos;package:mesopotamia_sdk/mesopotamia_sdk.dart&apos;</span>;{'\n\n'}
                                            <span className="token-comment">{'// Show the payment sheet'}</span>{'\n'}
                                            <span className="token-keyword">final</span> result = <span className="token-keyword">await</span>{' '}
                                            <span className="token-function">showMesoPaySheet</span>({'\n'}
                                            {'  '}context: context,{'\n'}
                                            {'  '}amount: <span className="token-number">50000</span>,{'\n'}
                                            {'  '}currency: <span className="token-string">&apos;IQD&apos;</span>,{'\n'}
                                            {'  '}orderId: <span className="token-string">&apos;ORDER_123&apos;</span>,{'\n'}
                                            );{'\n\n'}
                                            <span className="token-keyword">if</span> (result.success) {'{'}{'\n'}
                                            {'  '}<span className="token-comment">{'// Payment completed!'}</span>{'\n'}
                                            {'  '}print(result.transactionId);{'\n'}
                                            {'}'}
                                        </code>
                                    </pre>
                                </div>
                            </motion.div>
                        </FadeIn>

                        {/* Platform badges */}
                        <FadeIn delay={0.3}>
                            <div className="mb-6">
                                <p className="text-sm text-gray-400 mb-4">Works on every platform:</p>
                                <div className="flex flex-wrap gap-2">
                                    {platforms.map((platform, i) => (
                                        <motion.div
                                            key={platform.name}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 + i * 0.05 }}
                                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                        >
                                            <span>{platform.icon}</span>
                                            <span className="text-sm text-gray-300">{platform.name}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>

                        {/* CTA */}
                        <FadeIn delay={0.4}>
                            <motion.a
                                href="#installation"
                                className="inline-flex items-center gap-2 btn-primary"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14.314 0L2.3 12 6 15.7 21.684.013h-7.357L14.314 0zm.014 11.072L7.857 17.53l6.47 6.47H21.7l-6.46-6.468 6.46-6.46h-7.37z" />
                                </svg>
                                Get Flutter SDK
                            </motion.a>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </section>
    );
}
