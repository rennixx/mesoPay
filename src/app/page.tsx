'use client';

import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HostedCheckout from '@/components/HostedCheckout';
import FlutterShowcase from '@/components/FlutterShowcase';
import Installation from '@/components/Installation';
import Gateways from '@/components/Gateways';
import { motion } from 'framer-motion';
import { FadeIn } from '@/components/ScrollAnimations';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HostedCheckout />
      <FlutterShowcase />
      <Installation />
      <Gateways />

      {/* Call to Action */}
      <section className="py-32 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-purple-500/20 via-purple-500/5 to-transparent rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <FadeIn>
            <motion.h2
              className="text-4xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Ready to{' '}
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                simplify
              </span>{' '}
              your payments?
            </motion.h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join Iraqi developers who are building the future of digital payments
              with Mesopotamia SDK.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="#installation"
                className="btn-primary text-lg px-10 py-4 group"
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)' }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
                {' '}Get Started Now
              </motion.a>
              <motion.a
                href="https://github.com/yourusername/mesopotamia-sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-lg px-10 py-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Star on GitHub
              </motion.a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
