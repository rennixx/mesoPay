import '../../mesopotamia_sdk.dart';

/// Payment response model for internal use
class InternalPaymentResponse {
  final String transactionId;
  final String redirectUrl;
  final String? deepLink;
  final PaymentStatus status;
  final PaymentProvider provider;

  InternalPaymentResponse({
    required this.transactionId,
    required this.redirectUrl,
    this.deepLink,
    required this.status,
    required this.provider,
  });

  /// Parse from JSON
  factory InternalPaymentResponse.fromJson(Map<String, dynamic> json) {
    return InternalPaymentResponse(
      transactionId: json['transaction_id'] as String,
      redirectUrl: json['redirect_url'] as String,
      deepLink: json['deep_link'] as String?,
      status: PaymentStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => PaymentStatus.pending,
      ),
      provider: PaymentProvider.values.firstWhere(
        (e) => e.name == json['provider'],
        orElse: () => PaymentProvider.zainCash,
      ),
    );
  }
}
