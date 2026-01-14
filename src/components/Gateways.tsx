'use client';

import { motion } from 'framer-motion';
import { FadeIn, StaggerContainer, StaggerItem } from './ScrollAnimations';

const gateways = [
    {
        name: 'ZainCash',
        description: 'Iraq\'s leading mobile wallet with millions of users. Perfect for consumer payments.',
        color: 'from-green-500 to-emerald-600',
        bgGlow: 'bg-green-500/20',
        auth: 'JWT (HS256)',
        amountRange: '1,000 - 5,000,000 IQD',
        features: ['Mobile wallet', 'Deep linking', 'Instant payments'],
        logo: 'Z',
    },
    {
        name: 'FastPay',
        description: 'Fast and reliable payment processing for e-commerce and online services.',
        color: 'from-blue-500 to-indigo-600',
        bgGlow: 'bg-blue-500/20',
        auth: 'Basic Auth',
        amountRange: '500 - 10,000,000 IQD',
        features: ['Refund support', 'Web interface', 'Quick checkout'],
        logo: 'F',
    },
    {
        name: 'FIB',
        description: 'First Iraqi Bank\'s digital payment solution. Trusted banking infrastructure.',
        color: 'from-purple-500 to-violet-600',
        bgGlow: 'bg-purple-500/20',
        auth: 'OAuth2 Bearer',
        amountRange: '1,000 - 100,000,000 IQD',
        features: ['Banking app', 'High limits', 'Enterprise ready'],
        logo: 'FIB',
    },
];

export default function Gateways() {
    return (
        <section id="gateways" className="py-32 relative overflow-hidden">
            {/* Flowing background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-6">
                <FadeIn className="text-center mb-20">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        <span className="text-white">Supported </span>
                        <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                            Gateways
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        All major Iraqi payment gateways in one unified API. No more juggling multiple integrations.
                    </p>
                </FadeIn>

                <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.15}>
                    {gateways.map((gateway, index) => (
                        <StaggerItem key={index}>
                            <motion.div
                                className="group relative h-full"
                                whileHover={{ y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Glow effect on hover */}
                                <motion.div
                                    className={`absolute -inset-1 bg-gradient-to-r ${gateway.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-all duration-500`}
                                />

                                <div className="relative card h-full flex flex-col backdrop-blur-sm">
                                    {/* Logo */}
                                    <motion.div
                                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gateway.color} flex items-center justify-center text-white text-2xl font-bold mb-6`}
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {gateway.logo}
                                    </motion.div>

                                    {/* Name & Description */}
                                    <h3 className="text-2xl font-bold text-white mb-2">{gateway.name}</h3>
                                    <p className="text-gray-400 mb-6 flex-grow">{gateway.description}</p>

                                    {/* Details */}
                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 text-sm">Authentication</span>
                                            <span className="text-gray-300 text-sm font-mono bg-white/5 px-2 py-1 rounded">{gateway.auth}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 text-sm">Amount Range</span>
                                            <span className="text-gray-300 text-sm">{gateway.amountRange}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {gateway.features.map((feature, i) => (
                                                <motion.span
                                                    key={i}
                                                    className={`px-3 py-1 text-xs rounded-full bg-gradient-to-r ${gateway.color} bg-opacity-10 text-white/80 border border-white/10`}
                                                    whileHover={{ scale: 1.05 }}
                                                >
                                                    {feature}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* Comparison Note */}
                <FadeIn delay={0.3} className="mt-16 text-center">
                    <motion.p
                        className="text-gray-500 text-sm inline-flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                    >
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        All gateways support webhook verification, idempotency, and automatic retries.
                    </motion.p>
                </FadeIn>
            </div>
        </section>
    );
}
