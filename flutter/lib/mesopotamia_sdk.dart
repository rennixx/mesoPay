library mesopotamia_sdk;

// Core exports
export 'src/models/payment_request.dart';
export 'src/models/payment_response.dart';
export 'src/http/gateway_client.dart';

// UI exports
export 'src/ui/payment_sheet.dart';

// Deep link exports
export 'src/deep_link/deep_link_handler.dart';

import 'src/models/payment_request.dart';
import 'src/http/gateway_client.dart';
import 'package:url_launcher/url_launcher.dart';

/// Payment gateway providers
enum PaymentProvider {
  zainCash,
  fastPay,
  fib,
}

/// Environment (sandbox or production)
enum Environment {
  sandbox,
  production,
}

/// Payment status
enum PaymentStatus {
  pending,
  completed,
  failed,
  cancelled,
  expired,
}

/// Provider configuration
class ProviderConfig {
  final String merchantId;
  final String apiKey;
  final String apiSecret;
  final String? baseUrl;

  ProviderConfig({
    required this.merchantId,
    required this.apiKey,
    required this.apiSecret,
    this.baseUrl,
  });

  Map<String, dynamic> toJson() {
    return {
      'merchant_id': merchantId,
      'api_key': apiKey,
      'api_secret': apiSecret,
      if (baseUrl != null) 'base_url': baseUrl,
    };
  }
}

/// Payment request
class PaymentRequest {
  final PaymentProvider provider;
  final int amount;
  final String orderId;
  final String callbackUrl;
  final String webhookUrl;
  final Map<String, String>? metadata;
  final String? description;

  PaymentRequest({
    required this.provider,
    required this.amount,
    required this.orderId,
    required this.callbackUrl,
    required this.webhookUrl,
    this.metadata,
    this.description,
  });

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

/// Payment response
class PaymentResponse {
  final String transactionId;
  final String redirectUrl;
  final String? deepLink;
  final PaymentStatus status;
  final PaymentProvider provider;

  PaymentResponse({
    required this.transactionId,
    required this.redirectUrl,
    this.deepLink,
    required this.status,
    required this.provider,
  });

  factory PaymentResponse.fromJson(Map<String, dynamic> json) {
    return PaymentResponse(
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

/// SDK error
class MesopotamiaError implements Exception {
  final String message;
  final String? code;
  final PaymentProvider? provider;

  MesopotamiaError({
    required this.message,
    this.code,
    this.provider,
  });

  @override
  String toString() {
    if (code != null && provider != null) {
      return 'MesopotamiaError[$code] ${provider!.name}: $message';
    }
    return 'MesopotamiaError: $message';
  }
}

/// Get base URL for provider
String _getBaseUrl(
  PaymentProvider provider,
  Environment env,
  Map<PaymentProvider, ProviderConfig> configs,
) {
  // Check if custom base URL is provided in config
  final config = configs[provider];
  if (config?.baseUrl != null) {
    return config!.baseUrl!;
  }

  // Default URLs
  switch (provider) {
    case PaymentProvider.zainCash:
      return env == Environment.sandbox
          ? 'https://sandbox.zaincash.iq/api/v1'
          : 'https://api.zaincash.iq/api/v1';
    case PaymentProvider.fastPay:
      return env == Environment.sandbox
          ? 'https://sandbox-api.fast-pay.iq/v1'
          : 'https://api.fast-pay.iq/v1';
    case PaymentProvider.fib:
      return env == Environment.sandbox
          ? 'https://sandbox-fib.iq/api/v2'
          : 'https://api.fib.iq/api/v2';
  }
}

/// Main SDK class
class MesopotamiaSDK {
  final Environment environment;
  final Map<PaymentProvider, ProviderConfig> providers;
  final int timeoutMs;
  final bool enableLogging;

  late final HttpGatewayClient _client;

  MesopotamiaSDK({
    required this.environment,
    required this.providers,
    this.timeoutMs = 30000,
    this.enableLogging = false,
  }) {
    _client = HttpGatewayClient(
      getBaseUrl: (provider) => _getBaseUrl(provider, environment, providers),
      configs: providers,
    );
  }

  /// Create a payment transaction
  Future<PaymentResponse> createPayment(PaymentRequest request) async {
    final internalRequest = InternalPaymentRequest(
      provider: request.provider,
      amount: request.amount,
      orderId: request.orderId,
      callbackUrl: request.callbackUrl,
      webhookUrl: request.webhookUrl,
      metadata: request.metadata,
      description: request.description,
    );

    // Validate amount for the provider
    final (min, max) = _getAmountRange(request.provider);
    if (request.amount < min || request.amount > max) {
      throw MesopotamiaError(
        message: 'Amount must be between $min and $max IQD',
        code: 'INVALID_AMOUNT',
        provider: request.provider,
      );
    }

    // Log the request
    if (enableLogging) {
      print('Creating payment: ${request.provider.name} - ${request.amount} IQD');
      print('Base URL: ${_getBaseUrl(request.provider, environment, providers)}');
    }

    // Use HTTP client (native FFI not yet implemented)
    return await _client.createPayment(internalRequest);
  }

  /// Verify webhook signature
  bool verifyWebhook(String signature, String payload, String secret) {
    // HMAC-SHA256 verification (fallback implementation)
    return _verifyWebhookHMAC(signature, payload, secret);
  }

  /// HMAC-SHA256 webhook verification (fallback implementation)
  bool _verifyWebhookHMAC(String signature, String payload, String secret) {
    // This is a simplified implementation
    // In production, use a proper crypto package
    try {
      final parts = signature.split('=');
      if (parts.length != 2 || parts[0] != 'sha256') return false;

      // TODO: Use crypto package to verify HMAC
      // For now, just check format
      return parts[1].length == 64; // SHA256 hex length
    } catch (e) {
      return false;
    }
  }

  /// Present payment sheet (Flutter UI)
  Future<PaymentResponse> presentPaymentSheet(
    PaymentRequest request, {
    Function(PaymentResponse)? onSuccess,
    Function(MesopotamiaError)? onError,
  }) async {
    // TODO: Implement payment sheet UI
    // For now, just create the payment
    try {
      final response = await createPayment(request);
      if (onSuccess != null) {
        onSuccess(response);
      }
      return response;
    } catch (e) {
      if (onError != null) {
        onError(e is MesopotamiaError ? e : MesopotamiaError(message: e.toString()));
      }
      rethrow;
    }
  }

  /// Launch payment URL in browser or app
  Future<bool> launchPaymentUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      return await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
    } catch (e) {
      if (enableLogging) {
        print('Failed to launch URL: $e');
      }
      return false;
    }
  }

  /// Get payment status
  Future<PaymentResponse> getPaymentStatus({
    required PaymentProvider provider,
    required String transactionId,
  }) async {
    return await _client.getPaymentStatus(provider, transactionId);
  }
}

/// Get amount range for provider
(int, int) _getAmountRange(PaymentProvider provider) {
  switch (provider) {
    case PaymentProvider.zainCash:
      return (1000, 5000000);
    case PaymentProvider.fastPay:
      return (500, 10000000);
    case PaymentProvider.fib:
      return (1000, 100000000);
  }
}
