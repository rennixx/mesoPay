'use client';

import { FadeIn } from '@/components/ScrollAnimations';
import Link from 'next/link';

export default function SecurityPage() {
    return (
        <div className="min-h-screen pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <FadeIn>
                    <Link href="/docs" className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Docs
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-white">Security</h1>
                    </div>
                    <p className="text-xl text-gray-400 mb-10">Best practices for production deployment.</p>
                </FadeIn>

                <FadeIn delay={0.1}>
                    <div className="prose prose-invert max-w-none">
                        <h2>Secrets Management</h2>

                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                            <p className="text-red-400 font-semibold mb-2">❌ Never hardcode secrets</p>
                            <div className="code-block">
                                <div className="code-content">
                                    <pre className="text-sm text-gray-300">{`apiSecret: 'sk_live_abc123' // NEVER do this!`}</pre>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                            <p className="text-green-400 font-semibold mb-2">✓ Use environment variables</p>
                            <div className="code-block">
                                <div className="code-content">
                                    <pre className="text-sm text-gray-300">{`apiSecret: process.env.API_SECRET!`}</pre>
                                </div>
                            </div>
                        </div>

                        <h2>Webhook Security</h2>
                        <p>Always verify webhook signatures before processing:</p>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const isValid = sdk.verifyWebhook(
  provider,
  signature,
  payload,
  timestamp
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}`}</pre>
                            </div>
                        </div>

                        <h2>Replay Attack Prevention</h2>
                        <div className="code-block mb-6">
                            <div className="code-content">
                                <pre className="text-sm text-gray-300">{`const timestamp = parseInt(req.headers['x-timestamp']);
const now = Math.floor(Date.now() / 1000);
const tolerance = 300; // 5 minutes

if (Math.abs(now - timestamp) > tolerance) {
  return res.status(401).json({ error: 'Request expired' });
}`}</pre>
                            </div>
                        </div>

                        <h2>Production Checklist</h2>
                        <div className="not-prose">
                            <ul className="space-y-2 text-gray-300">
                                {[
                                    'Secrets stored in environment variables',
                                    'Webhook signature verification',
                                    'Replay attack prevention',
                                    'HTTPS enforced',
                                    'Amount validation on backend',
                                    'Rate limiting implemented',
                                    'Sensitive data excluded from logs',
                                    'Audit logging enabled',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded border border-white/20 flex items-center justify-center text-xs">
                                            ☐
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
