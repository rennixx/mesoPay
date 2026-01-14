'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn, ScaleOnScroll } from './ScrollAnimations';

type Platform = 'flutter' | 'nodejs' | 'rust';

const installCommands: Record<Platform, { command: string; filename: string }> = {
    flutter: {
        command: 'flutter pub add mesopotamia_sdk',
        filename: 'pubspec.yaml',
    },
    nodejs: {
        command: 'npm install mesopotamia-sdk',
        filename: 'package.json',
    },
    rust: {
        command: 'cargo add mesopotamia-core',
        filename: 'Cargo.toml',
    },
};

const codeExamples: Record<Platform, string> = {
    flutter: `import 'package:mesopotamia_sdk/mesopotamia_sdk.dart';

final sdk = MesopotamiaSDK(
  environment: Environment.sandbox,
  providers: {
    PaymentProvider.zainCash: ProviderConfig(
      merchantId: 'your_merchant_id',
      apiKey: 'your_api_key',
      apiSecret: 'your_api_secret',
    ),
  },
);

// Show payment sheet
final result = await sdk.presentPaymentSheet(
  context: context,
  amount: 50000, // 50,000 IQD
  orderId: 'ORDER_123',
);`,
    nodejs: `const { MesopotamiaSDK, PaymentProvider } = require('mesopotamia-sdk');

const sdk = new MesopotamiaSDK({
  environment: 'sandbox',
  providers: {
    [PaymentProvider.ZAIN_CASH]: {
      merchantId: process.env.ZAINCASH_MERCHANT_ID,
      apiKey: process.env.ZAINCASH_API_KEY,
      apiSecret: process.env.ZAINCASH_API_SECRET,
    },
  },
});

// Create payment
const payment = await sdk.createPayment({
  provider: PaymentProvider.ZAIN_CASH,
  amount: 50000, // 50,000 IQD
  orderId: 'ORDER_123',
  callbackUrl: 'https://yourapp.com/callback',
  webhookUrl: 'https://yourapp.com/webhook',
});`,
    rust: `use mesopotamia_core::{MesopotamiaSDK, PaymentProvider, Environment};

let sdk = MesopotamiaSDK::new(SdkConfig {
    environment: Environment::Sandbox,
    providers: vec![
        (PaymentProvider::ZainCash, ProviderConfig {
            merchant_id: "your_merchant_id".to_string(),
            api_key: "your_api_key".to_string(),
            api_secret: "your_api_secret".to_string(),
            ..Default::default()
        }),
    ].into_iter().collect(),
    ..Default::default()
});

// Create payment
let payment = sdk.create_payment(PaymentRequest {
    provider: PaymentProvider::ZainCash,
    amount: 50000, // 50,000 IQD
    order_id: "ORDER_123".to_string(),
    callback_url: "https://yourapp.com/callback".to_string(),
    webhook_url: "https://yourapp.com/webhook".to_string(),
    ..Default::default()
})?;`,
};

const platformLabels: Record<Platform, string> = {
    flutter: 'Flutter',
    nodejs: 'Node.js / TypeScript',
    rust: 'Rust (Cargo)',
};

const platformIcons: Record<Platform, React.ReactNode> = {
    flutter: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.314 0L2.3 12 6 15.7 21.684.013h-7.357L14.314 0zm.014 11.072L7.857 17.53l6.47 6.47H21.7l-6.46-6.468 6.46-6.46h-7.37z" />
        </svg>
    ),
    nodejs: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.998 24c-.321 0-.641-.084-.922-.247L8.14 21.92c-.438-.245-.224-.332-.08-.383.561-.194.674-.239 1.272-.578.063-.035.145-.022.209.015l2.256 1.34c.082.045.198.045.275 0l8.795-5.076c.082-.047.134-.141.134-.238V6.921c0-.099-.053-.193-.137-.242l-8.791-5.072c-.081-.047-.189-.047-.271 0L3.075 6.68c-.085.049-.139.143-.139.242v10.075c0 .096.054.189.134.236l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v9.948c0 1.747-.951 2.748-2.604 2.748-.509 0-.909 0-2.026-.551l-2.307-1.328A1.848 1.848 0 011.4 17.076V6.998c0-.678.365-1.313.957-1.65L11.15.263c.577-.323 1.344-.323 1.918 0l8.795 5.082c.592.337.955.973.955 1.65v10.078c0 .678-.363 1.313-.955 1.651l-8.795 5.079c-.281.163-.601.247-.924.247h.002z" />
        </svg>
    ),
    rust: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.835 11.703l-1.008-.623a8.92 8.92 0 00-.063-.503l.86-.755a.326.326 0 00-.116-.523l-1.08-.294a8.058 8.058 0 00-.161-.488l.692-.886a.326.326 0 00-.19-.517l-1.106-.082a6.665 6.665 0 00-.263-.45l.496-1a.326.326 0 00-.261-.452l-1.1.124a8.52 8.52 0 00-.357-.39l.285-1.075a.326.326 0 00-.326-.4l-1.054.324a7.944 7.944 0 00-.437-.313l.065-1.104a.326.326 0 00-.382-.339l-.97.51a8.277 8.277 0 00-.5-.224l-.155-1.085a.326.326 0 00-.427-.266l-.858.68c-.175-.06-.35-.114-.528-.16l-.37-1.025a.328.328 0 00-.46-.187l-.72.825a9.51 9.51 0 00-.552-.084l-.57-.933a.326.326 0 00-.477-.102l-.56.945a9.395 9.395 0 00-.551.085l-.72-.826a.326.326 0 00-.46.186l-.37 1.025c-.178.046-.353.1-.527.16l-.858-.68a.326.326 0 00-.427.266l-.155 1.085c-.168.07-.335.145-.5.224l-.97-.51a.326.326 0 00-.382.339l.065 1.104c-.149.1-.295.204-.437.313l-1.054-.324a.326.326 0 00-.326.4l.285 1.076a8.52 8.52 0 00-.357.389l-1.1-.124a.326.326 0 00-.262.452l.496 1c-.092.147-.18.297-.263.45l-1.106.082a.326.326 0 00-.19.517l.692.886a8.058 8.058 0 00-.16.488l-1.081.294a.326.326 0 00-.116.523l.86.755c-.026.166-.047.334-.063.503l-1.008.623a.326.326 0 000 .565l1.008.623c.016.169.037.337.063.503l-.86.755a.326.326 0 00.116.523l1.08.294c.046.165.1.328.161.488l-.692.886a.326.326 0 00.19.517l1.106.082c.082.153.17.303.263.45l-.496 1a.326.326 0 00.262.452l1.1-.124c.113.135.232.265.356.39l-.285 1.075a.326.326 0 00.326.4l1.054-.324c.143.11.288.214.438.313l-.066 1.104a.326.326 0 00.383.339l.969-.51c.165.08.332.155.5.224l.155 1.085a.326.326 0 00.427.266l.858-.68c.175.06.35.114.528.16l.37 1.025a.326.326 0 00.46.187l.72-.825c.182.035.367.063.552.084l.57.933a.326.326 0 00.477.102l.56-.945c.185-.022.37-.05.551-.085l.72.826a.326.326 0 00.46-.186l.37-1.025c.178-.046.353-.1.527-.16l.858.68a.326.326 0 00.427-.266l.155-1.085c.168-.07.335-.145.5-.224l.97.51a.326.326 0 00.382-.339l-.065-1.104c.149-.1.295-.204.437-.313l1.054.324a.326.326 0 00.326-.4l-.285-1.076c.124-.124.243-.254.357-.389l1.1.124a.326.326 0 00.261-.452l-.496-1c.092-.147.18-.297.263-.45l1.106-.082a.326.326 0 00.19-.517l-.692-.886c.061-.16.115-.323.16-.488l1.081-.294a.326.326 0 00.116-.523l-.86-.755c.026-.166.047-.334.063-.503l1.008-.623a.326.326 0 000-.565zM12 19.096a7.096 7.096 0 110-14.192 7.096 7.096 0 010 14.192z" />
        </svg>
    ),
};

export default function Installation() {
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('nodejs');
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section id="installation" className="py-32 relative overflow-hidden">
            {/* Flowing background gradient */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-5xl mx-auto px-6">
                <FadeIn className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        <span className="text-white">Get Started in </span>
                        <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            Seconds
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Mesopotamia SDK is available for Node.js, Flutter, and plain Rust. Select your platform below.
                    </p>
                </FadeIn>

                {/* Platform Tabs */}
                <FadeIn delay={0.1}>
                    <div className="flex justify-center mb-10">
                        <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                            {(Object.keys(platformLabels) as Platform[]).map((platform) => (
                                <motion.button
                                    key={platform}
                                    onClick={() => setSelectedPlatform(platform)}
                                    className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors ${selectedPlatform === platform ? 'text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {selectedPlatform === platform && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30"
                                            transition={{ type: 'spring', duration: 0.5 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2">
                                        {platformIcons[platform]}
                                        {platformLabels[platform]}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                {/* Install Command */}
                <ScaleOnScroll>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedPlatform + '-command'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="mb-10"
                        >
                            <div className="code-block max-w-2xl mx-auto overflow-hidden">
                                <div className="code-header">
                                    <span className="text-sm text-gray-400 font-mono">
                                        {installCommands[selectedPlatform].filename}
                                    </span>
                                    <motion.button
                                        onClick={() => copyToClipboard(installCommands[selectedPlatform].command)}
                                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <AnimatePresence mode="wait">
                                            {copied ? (
                                                <motion.span
                                                    key="copied"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex items-center gap-2 text-green-400"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Copied!
                                                </motion.span>
                                            ) : (
                                                <motion.span
                                                    key="copy"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    Copy
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                </div>
                                <div className="code-content">
                                    <code className="text-green-400 font-mono text-lg">
                                        {installCommands[selectedPlatform].command}
                                    </code>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </ScaleOnScroll>

                {/* Code Example */}
                <FadeIn delay={0.2}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedPlatform + '-code'}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div
                                className="code-block glow-border"
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="code-header">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {selectedPlatform === 'flutter' ? 'main.dart' : selectedPlatform === 'nodejs' ? 'app.js' : 'main.rs'}
                                    </span>
                                </div>
                                <div className="code-content max-h-[400px] overflow-y-auto">
                                    <pre className="text-sm">
                                        <code className="text-gray-300 whitespace-pre">{codeExamples[selectedPlatform]}</code>
                                    </pre>
                                </div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </FadeIn>
            </div>
        </section>
    );
}
