import '../../mesopotamia_sdk.dart';

/// Payment request model for internal use
class InternalPaymentRequest {
  final PaymentProvider provider;
  final int amount;
  final String orderId;
  final String callbackUrl;
  final String webhookUrl;
  final Map<String, String>? metadata;
  final String? description;

  InternalPaymentRequest({
    required this.provider,
    required this.amount,
    required this.orderId,
    required this.callbackUrl,
    required this.webhookUrl,
    this.metadata,
    this.description,
  });

  /// Convert to JSON for FFI
  Map<String, dynamic> toJson() {
    return {
      'provider': provider.name,
      'amount': amount,
      'order_id': orderId,
      'callback_url': callbackUrl,
      'webhook_url': webhookUrl,
      if (metadata != null) 'metadata': metadata,
      if (description != null) 'description': description,
    };
  }
}
