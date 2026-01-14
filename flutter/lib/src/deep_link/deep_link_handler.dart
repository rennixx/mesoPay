import 'dart:async';
import 'package:flutter/material.dart';
import '../../mesopotamia_sdk.dart';

/// Deep link result from payment callback
class DeepLinkResult {
  /// The transaction ID from the payment
  final String transactionId;

  /// Payment status
  final PaymentStatus status;

  /// Original provider used
  final PaymentProvider provider;

  /// Additional metadata from callback
  final Map<String, String>? metadata;

  const DeepLinkResult({
    required this.transactionId,
    required this.status,
    required this.provider,
    this.metadata,
  });

  /// Create from URI query parameters
  factory DeepLinkResult.fromUri(Uri uri, PaymentProvider provider) {
    final params = uri.queryParameters;

    // Extract transaction ID (different param names per provider)
    final transactionId = params['transaction_id'] ??
        params['payment_id'] ??
        params['id'] ??
        params['txn'] ??
        '';

    // Extract status
    final statusStr = params['status'] ?? 'unknown';
    final status = _parseStatus(statusStr);

    // Extract metadata
    final metadata = <String, String>{};
    params.forEach((key, value) {
      if (!['transaction_id', 'payment_id', 'id', 'txn', 'status'].contains(key)) {
        metadata[key] = value;
      }
    });

    return DeepLinkResult(
      transactionId: transactionId,
      status: status,
      provider: provider,
      metadata: metadata.isNotEmpty ? metadata : null,
    );
  }

  static PaymentStatus _parseStatus(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return PaymentStatus.completed;
      case 'failed':
      case 'error':
        return PaymentStatus.failed;
      case 'pending':
      case 'processing':
        return PaymentStatus.pending;
      case 'cancelled':
      case 'canceled':
        return PaymentStatus.cancelled;
      case 'expired':
        return PaymentStatus.expired;
      default:
        return PaymentStatus.pending;
    }
  }

  /// Convert to payment response
  PaymentResponse toPaymentResponse() {
    return PaymentResponse(
      transactionId: transactionId,
      redirectUrl: '',
      status: status,
      provider: provider,
    );
  }
}

/// Callback from deep link stream
typedef DeepLinkCallback = void Function(DeepLinkResult result);

/// Deep link handler for payment callbacks
/// Handles incoming deep links from payment providers
class MesopotamiaDeepLinkHandler {
  final MesopotamiaSDK sdk;
  final StreamController<DeepLinkResult> _linkController = StreamController.broadcast();
  final Map<String, DeepLinkCallback> _pendingCallbacks = {};

  /// Stream of deep link results
  Stream<DeepLinkResult> get linkStream => _linkController.stream;

  MesopotamiaDeepLinkHandler({required this.sdk});

  /// Initialize deep linking
  /// Call this from main() or initState()
  Future<void> initialize() async {
    // Initial link check (for cold start)
    final initialLink = await getInitialLink();
    if (initialLink != null) {
      _handleLink(initialLink);
    }
  }

  /// Get the initial link (app opened from link)
  Future<Uri?> getInitialLink() async {
    try {
      // In a real implementation, this would use uni_links or flutter_deep_linking
      // For now, return null as this is a stub
      return null;
    } catch (e) {
      if (sdk.enableLogging) {
        debugPrint('MesopotamiaSDK: Failed to get initial link: $e');
      }
      return null;
    }
  }

  /// Handle incoming deep link
  /// Call this from your deep link handler
  void handleIncomingLink(Uri uri) {
    _handleLink(uri);
  }

  void _handleLink(Uri uri) {
    try {
      if (sdk.enableLogging) {
        debugPrint('MesopotamiaSDK: Handling deep link: $uri');
      }

      // Check if this is a Mesopotamia payment callback
      final path = uri.path.toLowerCase();

      // Try to identify provider from path or host
      PaymentProvider? provider;
      for (final p in PaymentProvider.values) {
        final providerName = _getProviderName(p);
        if (path.contains(providerName) ||
            uri.host.contains(providerName) ||
            uri.queryParameters.containsKey('provider')) {
          provider = p;
          break;
        }
      }

      if (provider == null) {
        if (sdk.enableLogging) {
          debugPrint('MesopotamiaSDK: Unknown provider in deep link');
        }
        return;
      }

      // Parse the result
      final result = DeepLinkResult.fromUri(uri, provider);

      // Notify via stream
      if (!_linkController.isClosed) {
        _linkController.add(result);
      }

      // Notify via callback if registered
      final callbackKey = result.transactionId;
      if (_pendingCallbacks.containsKey(callbackKey)) {
        _pendingCallbacks[callbackKey]!(result);
        _pendingCallbacks.remove(callbackKey);
      }

      if (sdk.enableLogging) {
        debugPrint('MesopotamiaSDK: Deep link processed: ${result.transactionId} - ${result.status}');
      }
    } catch (e) {
      if (sdk.enableLogging) {
        debugPrint('MesopotamiaSDK: Error handling deep link: $e');
      }
    }
  }

  /// Register a callback for a specific transaction
  void registerCallback(String transactionId, DeepLinkCallback callback) {
    _pendingCallbacks[transactionId] = callback;
  }

  /// Listen for deep link results with automatic timeout
  Future<DeepLinkResult?> waitForResult(
    String transactionId, {
    Duration timeout = const Duration(minutes: 15),
  }) async {
    try {
      return linkStream
          .where((result) => result.transactionId == transactionId)
          .first
          .timeout(timeout);
    } catch (e) {
      if (sdk.enableLogging) {
        debugPrint('MesopotamiaSDK: Timeout waiting for result: $transactionId');
      }
      return null;
    }
  }

  String _getProviderName(PaymentProvider provider) {
    switch (provider) {
      case PaymentProvider.zainCash:
        return 'zaincash';
      case PaymentProvider.fastPay:
        return 'fastpay';
      case PaymentProvider.fib:
        return 'fib';
    }
  }

  /// Dispose resources
  void dispose() {
    _linkController.close();
    _pendingCallbacks.clear();
  }
}

/// Widget mixin for handling deep links
/// Use this in your widget to automatically handle payment callbacks
mixin DeepLinkHandlerMixin<T extends StatefulWidget> on State<T> {
  late final MesopotamiaDeepLinkHandler deepLinkHandler;

  /// Initialize deep link handling
  /// Call in initState()
  void initDeepLinkHandler(MesopotamiaSDK sdk) {
    deepLinkHandler = MesopotamiaDeepLinkHandler(sdk: sdk);
  }

  /// Handle deep link result
  /// Override this to handle payment results
  void handlePaymentResult(DeepLinkResult result) {
    // Default implementation - override in your widget
    debugPrint('Payment result: ${result.transactionId} - ${result.status}');
  }

  /// Subscribe to deep link stream
  void subscribeToDeepLinks() {
    deepLinkHandler.linkStream.listen(handlePaymentResult);
  }

  @override
  void dispose() {
    deepLinkHandler.dispose();
    super.dispose();
  }
}

/// Deep link configuration per provider
class DeepLinkConfig {
  /// Custom URL scheme for this app (e.g., 'myapp')
  final String urlScheme;

  /// Host for payment callbacks (e.g., 'payment')
  final String callbackHost;

  /// Path prefix for payment callbacks
  final String callbackPath;

  const DeepLinkConfig({
    required this.urlScheme,
    this.callbackHost = 'payment',
    this.callbackPath = '/callback',
  });

  /// Build callback URL for a provider
  String buildCallbackUrl(PaymentProvider provider) {
    final providerName = _getProviderPath(provider);
    return '$urlScheme://$callbackHost$callbackPath/$providerName';
  }

  String _getProviderPath(PaymentProvider provider) {
    switch (provider) {
      case PaymentProvider.zainCash:
        return 'zaincash';
      case PaymentProvider.fastPay:
        return 'fastpay';
      case PaymentProvider.fib:
        return 'fib';
    }
  }

  /// Parse URI and extract provider
  PaymentProvider? extractProvider(Uri uri) {
    final path = uri.path.toLowerCase();
    for (final provider in PaymentProvider.values) {
      if (path.contains(_getProviderPath(provider))) {
        return provider;
      }
    }
    return null;
  }
}

/// Utility class for deep link integration
class MesopotamiaDeepLink {
  /// Build callback URL for payment request
  static String buildCallbackUrl({
    required String urlScheme,
    required PaymentProvider provider,
    String host = 'payment',
    String path = '/callback',
  }) {
    final config = DeepLinkConfig(
      urlScheme: urlScheme,
      callbackHost: host,
      callbackPath: path,
    );
    return config.buildCallbackUrl(provider);
  }

  /// Validate deep link URL format
  static bool isValidCallbackUrl(Uri uri) {
    // Must have a scheme (custom URL scheme or https)
    if (uri.scheme.isEmpty) return false;

    // Must have query parameters
    if (uri.queryParameters.isEmpty) return false;

    // Must have at least transaction ID or status
    return uri.queryParameters.containsKey('transaction_id') ||
        uri.queryParameters.containsKey('payment_id') ||
        uri.queryParameters.containsKey('status');
  }

  /// Extract payment result from URI
  static DeepLinkResult? extractResult(Uri uri, PaymentProvider provider) {
    if (!isValidCallbackUrl(uri)) return null;

    try {
      return DeepLinkResult.fromUri(uri, provider);
    } catch (e) {
      return null;
    }
  }
}
