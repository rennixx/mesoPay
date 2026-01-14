// Crypto performance benchmarks
// Run with: cargo bench --bench crypto

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use mesopotamia_core::crypto;

fn bench_hmac_sha256(c: &mut Criterion) {
    let secret = "test_secret_key_for_signing";
    let payload = r#"{"transaction_id":"tx_123456","status":"completed","amount":50000,"order_id":"ORDER_001"}"#;

    c.bench_function("hmac_sha256", |b| {
        b.iter(|| crypto::generate_hmac_sha256(black_box(secret), black_box(payload)))
    });

    // Benchmark with different payload sizes
    let mut group = c.benchmark_group("hmac_payload_sizes");
    for size in [100, 500, 1000, 5000].iter() {
        let large_payload = "x".repeat(*size);
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, _| {
            b.iter(|| crypto::generate_hmac_sha256(secret, &large_payload))
        });
    }
    group.finish();
}

fn bench_jwt_generation(c: &mut Criterion) {
    c.bench_function("jwt_hs256_generation", |b| {
        b.iter(|| {
            crypto::generate_jwt_hs256(
                black_box("merchant_123"),
                black_box(50000),
                black_box("ORDER_123"),
                black_box("https://example.com/callback"),
                black_box("https://example.com/webhook"),
                black_box("secret"),
                black_box(300),
            )
        })
    });
}

fn bench_webhook_verification(c: &mut Criterion) {
    let secret = "webhook_secret";
    let payload = r#"{"transaction_id":"tx_123","status":"completed"}"#;
    let signature = crypto::generate_hmac_sha256(secret, payload).unwrap();

    c.bench_function("webhook_verify", |b| {
        b.iter(|| {
            crypto::verify_webhook_signature(
                black_box(&format!("sha256={}", signature)),
                black_box(payload),
                black_box(secret),
            )
        })
    });
}

fn bench_jwt_verification(c: &mut Criterion) {
    let secret = "test_secret";
    let token = crypto::generate_jwt_hs256(
        "merchant_123",
        50000,
        "ORDER_123",
        "https://example.com/callback",
        "https://example.com/webhook",
        secret,
        300,
    ).unwrap();

    c.bench_function("jwt_verify", |b| {
        b.iter(|| crypto::verify_jwt_hs256(black_box(&token), black_box(secret)))
    });
}

criterion_group!(
    benches,
    bench_hmac_sha256,
    bench_jwt_generation,
    bench_webhook_verification,
    bench_jwt_verification
);
criterion_main!(benches);
