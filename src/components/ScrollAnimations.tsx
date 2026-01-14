'use client';

import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';

// Fade in when scrolling into view
export function FadeIn({
    children,
    delay = 0,
    direction = 'up',
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const directions = {
        up: { y: 40, x: 0 },
        down: { y: -40, x: 0 },
        left: { x: 40, y: 0 },
        right: { x: -40, y: 0 },
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, ...directions[direction] }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
            transition={{
                duration: 0.8,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Stagger children animations
export function StaggerContainer({
    children,
    className = '',
    staggerDelay = 0.1,
}: {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Child item for stagger animation
export function StaggerItem({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                        duration: 0.6,
                        ease: [0.21, 0.47, 0.32, 0.98]
                    }
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Parallax effect for background elements
export function ParallaxElement({
    children,
    speed = 0.5,
    className = '',
}: {
    children: ReactNode;
    speed?: number;
    className?: string;
}) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start']
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, speed * 200]);
    const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

    return (
        <motion.div
            ref={ref}
            style={{ y: smoothY }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Scale up on scroll
export function ScaleOnScroll({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{
                duration: 0.6,
                ease: [0.21, 0.47, 0.32, 0.98]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Floating animation for decorative elements
export function FloatingElement({
    children,
    duration = 6,
    className = ''
}: {
    children: ReactNode;
    duration?: number;
    className?: string;
}) {
    return (
        <motion.div
            animate={{
                y: [-10, 10, -10],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Blur in effect
export function BlurIn({
    children,
    delay = 0,
    className = ''
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={isInView ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(20px)' }}
            transition={{
                duration: 0.8,
                delay,
                ease: [0.21, 0.47, 0.32, 0.98]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Glow pulse animation
export function GlowPulse({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            animate={{
                boxShadow: [
                    '0 0 20px rgba(139, 92, 246, 0.3)',
                    '0 0 60px rgba(139, 92, 246, 0.5)',
                    '0 0 20px rgba(139, 92, 246, 0.3)',
                ],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Text reveal animation (character by character)
export function TextReveal({
    text,
    className = ''
}: {
    text: string;
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const words = text.split(' ');

    return (
        <motion.span
            ref={ref}
            className={className}
        >
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{
                        duration: 0.5,
                        delay: i * 0.1,
                        ease: [0.21, 0.47, 0.32, 0.98]
                    }}
                    className="inline-block mr-[0.25em]"
                >
                    {word}
                </motion.span>
            ))}
        </motion.span>
    );
}
