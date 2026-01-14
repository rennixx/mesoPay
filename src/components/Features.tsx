'use client';

import { motion } from 'framer-motion';
import { FadeIn, StaggerContainer, StaggerItem } from './ScrollAnimations';

const features = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        title: 'Secure by Default',
        description: 'Built with Rust for memory safety. All cryptographic operations happen in the secure core with secrets zeroed after use.',
        gradient: 'from-purple-500 to-violet-500',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        title: 'Lightning Fast',
        description: 'Signature generation in under 1ms. Optimized HTTP client with connection pooling and automatic retries.',
        gradient: 'from-yellow-500 to-orange-500',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
        title: 'Multi-Platform',
        description: 'Native support for Flutter (iOS/Android/Web), Node.js backends, and WebAssembly for browser apps.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
        ),
        title: 'Fully Localized',
        description: 'First-class support for English, Arabic (العربية), and Kurdish (کوردی) with RTL layouts.',
        gradient: 'from-green-500 to-emerald-500',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        title: 'Quick Integration',
        description: 'Go from zero to production in less than 2 hours. Pre-built UI components and comprehensive docs.',
        gradient: 'from-pink-500 to-rose-500',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'Production Ready',
        description: 'Circuit breakers, retry logic, idempotency keys, and comprehensive error handling built-in.',
        gradient: 'from-indigo-500 to-purple-500',
    },
];

export default function Features() {
    return (
        <section id="features" className="py-32 relative overflow-hidden">
            {/* Seamless background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                <FadeIn className="text-center mb-20">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        <span className="text-white">Built for </span>
                        <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                            Iraqi Developers
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Everything you need to integrate payments into your app, without the complexity.
                    </p>
                </FadeIn>

                <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
                    {features.map((feature, index) => (
                        <StaggerItem key={index}>
                            <motion.div
                                className="card group hover:border-purple-500/30 h-full"
                                whileHover={{
                                    y: -8,
                                    transition: { duration: 0.3 }
                                }}
                            >
                                <motion.div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4`}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {feature.icon}
                                </motion.div>
                                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    );
}
