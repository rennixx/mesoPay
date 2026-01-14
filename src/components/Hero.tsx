'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { FadeIn, FloatingElement, BlurIn, ParallaxElement } from './ScrollAnimations';

export default function Hero() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start']
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

    return (
        <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Effects - with parallax */}
            <motion.div
                className="absolute inset-0 grid-pattern opacity-30"
                style={{ y: useTransform(scrollYProgress, [0, 1], [0, 100]) }}
            />

            {/* Gradient Orbs with floating animation */}
            <FloatingElement duration={8} className="absolute -top-40 -right-40">
                <div className="gradient-orb gradient-orb-purple w-[600px] h-[600px] animate-pulse-glow" />
            </FloatingElement>

            <FloatingElement duration={10} className="absolute -bottom-40 -left-40">
                <div className="gradient-orb gradient-orb-blue w-[500px] h-[500px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            </FloatingElement>

            <ParallaxElement speed={-0.3} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="gradient-orb gradient-orb-cyan w-[300px] h-[300px] opacity-20" />
            </ParallaxElement>

            <motion.div
                className="relative z-10 max-w-7xl mx-auto px-6 py-20"
                style={{ y, opacity, scale }}
            >
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left - Content */}
                    <div className="text-center lg:text-left">
                        {/* Badge */}
                        <FadeIn delay={0.1}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm">
                                <motion.span
                                    className="w-2 h-2 rounded-full bg-green-500"
                                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <span className="text-gray-400">Now supporting ZainCash, FastPay & FIB</span>
                            </div>
                        </FadeIn>

                        {/* Headline */}
                        <FadeIn delay={0.2}>
                            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
                                <span className="text-white">One SDK.</span>
                                <br />
                                <motion.span
                                    className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent inline-block"
                                    style={{ backgroundSize: '200% 200%' }}
                                    animate={{
                                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                                >
                                    All Iraqi Gateways.
                                </motion.span>
                            </h1>
                        </FadeIn>

                        {/* Subheadline */}
                        <FadeIn delay={0.3}>
                            <p className="text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                                Stop juggling multiple payment integrations. Mesopotamia SDK provides a unified,
                                secure interface for ZainCash, FastPay, and FIB — with one codebase.
                            </p>
                        </FadeIn>

                        {/* CTA Buttons */}
                        <FadeIn delay={0.4}>
                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                                    <Link href="#installation" className="btn-primary text-base px-8 py-4">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Get Started in 5 Minutes
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                                    <a
                                        href="https://github.com/yourusername/mesopotamia-sdk"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary text-base px-8 py-4"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                        </svg>
                                        View on GitHub
                                    </a>
                                </motion.div>
                            </div>
                        </FadeIn>

                        {/* Stats */}
                        <FadeIn delay={0.5}>
                            <div className="flex items-center gap-8 mt-12 justify-center lg:justify-start">
                                {[
                                    { value: '3', label: 'Gateways' },
                                    { value: '<2h', label: 'Integration Time' },
                                    { value: '<1ms', label: 'Signature Speed' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 + i * 0.1 }}
                                        className="flex items-center gap-8"
                                    >
                                        {i > 0 && <div className="w-px h-10 bg-white/10 -ml-8" />}
                                        <div>
                                            <div className="text-3xl font-bold text-white">{stat.value}</div>
                                            <div className="text-sm text-gray-500">{stat.label}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </FadeIn>
                    </div>

                    {/* Right - Code Preview */}
                    <BlurIn delay={0.3}>
                        <motion.div
                            className="code-block glow-border"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="code-header">
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        className="w-3 h-3 rounded-full bg-red-500/80"
                                        whileHover={{ scale: 1.2 }}
                                    />
                                    <motion.div
                                        className="w-3 h-3 rounded-full bg-yellow-500/80"
                                        whileHover={{ scale: 1.2 }}
                                    />
                                    <motion.div
                                        className="w-3 h-3 rounded-full bg-green-500/80"
                                        whileHover={{ scale: 1.2 }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">payment.ts</span>
                            </div>
                            <div className="code-content">
                                <pre className="text-sm leading-relaxed">
                                    <code>
                                        <span className="token-keyword">import</span> {'{'}
                                        <span className="token-variable"> MesopotamiaSDK</span>,{' '}
                                        <span className="token-variable">PaymentProvider</span>
                                        {'}'} <span className="token-keyword">from</span>{' '}
                                        <span className="token-string">&apos;mesopotamia-sdk&apos;</span>;{'\n\n'}
                                        <span className="token-comment">// Initialize SDK</span>{'\n'}
                                        <span className="token-keyword">const</span>{' '}
                                        <span className="token-variable">sdk</span> ={' '}
                                        <span className="token-keyword">new</span>{' '}
                                        <span className="token-function">MesopotamiaSDK</span>({'{'}
                                        {'\n'}
                                        {'  '}environment: <span className="token-string">&apos;sandbox&apos;</span>,{'\n'}
                                        {'  '}providers: {'{'}{'\n'}
                                        {'    '}[PaymentProvider.<span className="token-property">ZAIN_CASH</span>]: {'{'}{'\n'}
                                        {'      '}merchantId: <span className="token-string">&apos;your_id&apos;</span>,{'\n'}
                                        {'      '}apiSecret: process.env.<span className="token-property">SECRET</span>,{'\n'}
                                        {'    '}{'},'}{'\n'}
                                        {'  '}{'}'},{'\n'}
                                        {'}'});{'\n\n'}
                                        <span className="token-comment">// Create payment</span>{'\n'}
                                        <span className="token-keyword">const</span>{' '}
                                        <span className="token-variable">payment</span> ={' '}
                                        <span className="token-keyword">await</span> sdk.
                                        <span className="token-function">createPayment</span>({'{'}
                                        {'\n'}
                                        {'  '}provider: PaymentProvider.<span className="token-property">ZAIN_CASH</span>,{'\n'}
                                        {'  '}amount: <span className="token-number">50000</span>,{' '}
                                        <span className="token-comment">// 50,000 IQD</span>{'\n'}
                                        {'  '}orderId: <span className="token-string">&apos;ORDER_123&apos;</span>,{'\n'}
                                        {'}'});
                                    </code>
                                </pre>
                            </div>
                        </motion.div>
                    </BlurIn>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ opacity }}
            >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </motion.div>
        </section>
    );
}
