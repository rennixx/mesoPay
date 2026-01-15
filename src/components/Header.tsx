'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                className={`
          flex items-center gap-2 px-2 py-2 rounded-full
          backdrop-blur-xl border transition-all duration-300
          ${scrolled
                        ? 'bg-black/80 border-white/10 shadow-lg shadow-black/20'
                        : 'bg-white/5 border-white/10'
                    }
        `}
            >
                {/* Logo - Only Image */}
                <Link href="/" className="flex items-center pl-3 pr-4 group">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Image
                            src="/logo.png"
                            alt="MesoPay"
                            width={120}
                            height={32}
                            className="h-8 w-auto"
                            priority
                        />
                    </motion.div>
                </Link>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10 hidden md:block" />

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {[
                        { href: '#features', label: 'Features' },
                        { href: '#hosted-checkout', label: 'Checkout' },
                        { href: '#flutter-sdk', label: 'Flutter' },
                        { href: '#installation', label: 'Install' },
                        { href: '/docs', label: 'Docs' },
                    ].map((link) => (
                        <motion.div key={link.href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href={link.href}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                            >
                                {link.label}
                            </Link>
                        </motion.div>
                    ))}
                </nav>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10 hidden md:block" />

                {/* CTA Buttons */}
                <div className="flex items-center gap-2">
                    <motion.a
                        href="https://github.com/yourusername/mesopotamia-sdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span className="hidden lg:inline">GitHub</span>
                    </motion.a>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                            href="#installation"
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-shadow"
                        >
                            Get Started
                        </Link>
                    </motion.div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        className="md:hidden text-white p-2 rounded-full hover:bg-white/5"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </motion.button>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-20 left-4 right-4 p-4 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 md:hidden"
                    >
                        <nav className="flex flex-col gap-2">
                            {[
                                { href: '#features', label: 'Features' },
                                { href: '#hosted-checkout', label: 'Hosted Checkout' },
                                { href: '#flutter-sdk', label: 'Flutter SDK' },
                                { href: '#installation', label: 'Installation' },
                                { href: '#gateways', label: 'Gateways' },
                                { href: '/docs', label: 'Docs' },
                            ].map((link, i) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link
                                        href={link.href}
                                        className="block px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="pt-2 mt-2 border-t border-white/10"
                            >
                                <Link
                                    href="#installation"
                                    className="block px-4 py-3 text-center text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
