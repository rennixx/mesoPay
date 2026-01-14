'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ScrollAnimations';
// comment
const docs = [
    {
        title: 'Quickstart',
        description: 'Get started with MesoPay SDK in under 5 minutes',
        href: '/docs/quickstart',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
        color: 'from-yellow-500 to-orange-500',
    },
    {
        title: 'API Reference',
        description: 'Complete SDK documentation for Node.js and Flutter',
        href: '/docs/api',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
        color: 'from-blue-500 to-cyan-500',
    },
    {
        title: 'ZainCash',
        description: "Integrate Iraq's leading mobile wallet",
        href: '/docs/zaincash',
        icon: (
            <div className="text-lg font-bold">Z</div>
        ),
        color: 'from-green-500 to-emerald-500',
    },
    {
        title: 'FastPay',
        description: 'E-commerce payments with refund support',
        href: '/docs/fastpay',
        icon: (
            <div className="text-lg font-bold">F</div>
        ),
        color: 'from-blue-500 to-indigo-500',
    },
    {
        title: 'FIB',
        description: 'Enterprise banking integration',
        href: '/docs/fib',
        icon: (
            <div className="text-sm font-bold">FIB</div>
        ),
        color: 'from-purple-500 to-violet-500',
    },
    {
        title: 'Security',
        description: 'Best practices for production deployment',
        href: '/docs/security',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        color: 'from-red-500 to-pink-500',
    },
];

export default function DocsPage() {
    return (
        <div className="min-h-screen pt-32 pb-20">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-6xl mx-auto px-6">
                {/* Header */}
                <FadeIn className="text-center mb-16">
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                        <span className="text-white">Documentation</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Everything you need to integrate MesoPay SDK into your application.
                    </p>
                </FadeIn>

                {/* Quick Links */}
                <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {docs.map((doc, index) => (
                        <StaggerItem key={index}>
                            <Link href={doc.href}>
                                <motion.div
                                    className="card group h-full cursor-pointer hover:border-purple-500/30"
                                    whileHover={{ y: -4 }}
                                >
                                    <motion.div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${doc.color} flex items-center justify-center text-white mb-4`}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                    >
                                        {doc.icon}
                                    </motion.div>
                                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                                        {doc.title}
                                    </h3>
                                    <p className="text-gray-400">{doc.description}</p>
                                </motion.div>
                            </Link>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* Quick Install */}
                <FadeIn>
                    <div className="glass p-8 rounded-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Quick Install</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="code-block">
                                <div className="code-header">
                                    <span className="text-sm text-gray-400">Node.js</span>
                                </div>
                                <div className="code-content">
                                    <code className="text-green-400">npm install mesopotamia-sdk</code>
                                </div>
                            </div>
                            <div className="code-block">
                                <div className="code-header">
                                    <span className="text-sm text-gray-400">Flutter</span>
                                </div>
                                <div className="code-content">
                                    <code className="text-green-400">flutter pub add mesopotamia_sdk</code>
                                </div>
                            </div>
                            <div className="code-block">
                                <div className="code-header">
                                    <span className="text-sm text-gray-400">Rust</span>
                                </div>
                                <div className="code-content">
                                    <code className="text-green-400">cargo add mesopotamia-core</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                {/* GitHub Link */}
                <FadeIn delay={0.1} className="mt-12 text-center">
                    <motion.a
                        href="https://github.com/yourusername/mesopotamia-sdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        whileHover={{ scale: 1.05 }}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        View source on GitHub
                    </motion.a>
                </FadeIn>
            </div>
        </div>
    );
}
