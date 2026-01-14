import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import '../../mesopotamia_sdk.dart';

/// HTTP-based gateway client (fallback when native FFI is unavailable)
///
/// This implementation uses HTTP requests directly to the gateways.
/// It will be replaced by native FFI calls when available.
class HttpGatewayClient {
  final String Function(PaymentProvider) getBaseUrl;
  final Map<PaymentProvider, ProviderConfig> configs;

  HttpGatewayClient({
    required this.getBaseUrl,
    required this.configs,
  });

  /// Create a payment transaction
  Future<PaymentResponse> createPayment(InternalPaymentRequest request) async {
    switch (request.provider) {
      case PaymentProvider.zainCash:
        return _createZainCashPayment(request);
      case PaymentProvider.fastPay:
        return _createFastPayPayment(request);
      case PaymentProvider.fib:
        return _createFIBPayment(request);
    }
  }

  /// Get payment status
  Future<PaymentResponse> getPaymentStatus(
    PaymentProvider provider,
    String transactionId,
  ) async {
    switch (provider) {
      case PaymentProvider.zainCash:
        return _getZainCashStatus(transactionId);
      case PaymentProvider.fastPay:
        return _getFastPayStatus(transactionId);
      case PaymentProvider.fib:
        return _getFIBStatus(transactionId);
    }
  }

  /// Create ZainCash payment
  Future<PaymentResponse> _createZainCashPayment(InternalPaymentRequest request) async {
    final config = configs[PaymentProvider.zainCash];
    if (config == null) {
      throw MesopotamiaError(
        message: 'ZainCash not configured',
        code: 'NOT_CONFIGURED',
        provider: PaymentProvider.zainCash,
      );
    }

    // Generate JWT token (would use native crypto in production)
    final payload = {
      'merchant_id': config.merchantId,
      'amount': request.amount,
      'order_id': request.orderId,
      'service_type': 'payment',
      'callback_url': request.callbackUrl,
      'webhook_url': request.webhookUrl,
      'iat': DateTime.now().millisecondsSinceEpoch ~/ 1000,
      'exp': DateTime.now().millisecondsSinceEpoch ~/ 1000 + 300,
    };

    // For now, this is a placeholder - JWT generation would call native code
    final token = _generateJWT(payload, config.apiSecret);

    final response = await http.post(
      Uri.parse('${getBaseUrl(PaymentProvider.zainCash)}/transaction/init'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'token': token}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final internal = InternalPaymentResponse.fromJson(data);
      return PaymentResponse(
        transactionId: internal.transactionId,
        redirectUrl: internal.redirectUrl,
        deepLink: internal.deepLink,
        status: internal.status,
        provider: internal.provider,
      );
    } else {
      throw _handleError(response, PaymentProvider.zainCash);
    }
  }

  /// Create FastPay payment
  Future<PaymentResponse> _createFastPayPayment(InternalPaymentRequest request) async {
    final config = configs[PaymentProvider.fastPay];
    if (config == null) {
      throw MesopotamiaError(
        message: 'FastPay not configured',
        code: 'NOT_CONFIGURED',
        provider: PaymentProvider.fastPay,
      );
    }

    final basicAuth = base64Encode(utf8.encode('${config.apiKey}:${config.apiSecret}'));

    final response = await http.post(
      Uri.parse('${getBaseUrl(PaymentProvider.fastPay)}/payment/init'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic $basicAuth',
      },
      body: jsonEncode({
        'amount': request.amount,
        'order_id': request.orderId,
        'callback_url': request.callbackUrl,
        'webhook_url': request.webhookUrl,
        if (request.description != null) 'description': request.description,
        if (request.metadata != null) 'metadata': request.metadata,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      // FastPay returns payment_id instead of transaction_id
      return PaymentResponse(
        transactionId: data['payment_id'] as String,
        redirectUrl: data['redirect_url'] as String,
        deepLink: null,
        status: PaymentStatus.pending,
        provider: PaymentProvider.fastPay,
      );
    } else {
      throw _handleError(response, PaymentProvider.fastPay);
    }
  }

  /// Create FIB payment
  Future<PaymentResponse> _createFIBPayment(InternalPaymentRequest request) async {
    final config = configs[PaymentProvider.fib];
    if (config == null) {
      throw MesopotamiaError(
        message: 'FIB not configured',
        code: 'NOT_CONFIGURED',
        provider: PaymentProvider.fib,
      );
    }

    // Get OAuth token
    final token = await _getFIBToken(config);

    final response = await http.post(
      Uri.parse('${getBaseUrl(PaymentProvider.fib)}/payment/create'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'amount': request.amount,
        'order_id': request.orderId,
        'callback_url': request.callbackUrl,
        'webhook_url': request.webhookUrl,
        if (request.description != null) 'description': request.description,
        if (request.metadata != null) 'metadata': request.metadata,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      // FIB returns payment_id and web_url instead of transaction_id and redirect_url
      return PaymentResponse(
        transactionId: data['payment_id'] as String,
        redirectUrl: data['web_url'] as String,
        deepLink: data['deep_link'] as String?,
        status: PaymentStatus.pending,
        provider: PaymentProvider.fib,
      );
    } else {
      throw _handleError(response, PaymentProvider.fib);
    }
  }

  /// Get FIB OAuth token
  Future<String> _getFIBToken(ProviderConfig config) async {
    final response = await http.post(
      Uri.parse('${getBaseUrl(PaymentProvider.fib)}/oauth/token'),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'grant_type=client_credentials&client_id=${config.apiKey}&client_secret=${config.apiSecret}',
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return data['access_token'] as String;
    } else {
      throw _handleError(response, PaymentProvider.fib);
    }
  }

  /// Handle error response
  MesopotamiaError _handleError(http.Response response, PaymentProvider provider) {
    try {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return MesopotamiaError(
        message: data['message'] as String? ?? 'Unknown error',
        code: data['code'] as String?,
        provider: provider,
      );
    } catch (e) {
      return MesopotamiaError(
        message: 'HTTP ${response.statusCode}: ${response.body}',
        code: 'HTTP_ERROR',
        provider: provider,
      );
    }
  }

  /// Generate JWT token with HS256 signing
  String _generateJWT(Map<String, dynamic> payload, String secret) {
    // JWT Header
    final header = {'alg': 'HS256', 'typ': 'JWT'};

    // Encode header and payload with base64url encoding
    final headerEncoded = _base64UrlEncode(jsonEncode(header));
    final payloadEncoded = _base64UrlEncode(jsonEncode(payload));

    // Create signature with HMAC-SHA256
    final data = utf8.encode('$headerEncoded.$payloadEncoded');
    final key = utf8.encode(secret);
    final hmac = Hmac(sha256, key);
    final digest = hmac.convert(data);

    // Encode signature with base64url (not hex!)
    final signature = _base64UrlEncodeBytes(digest.bytes);

    return '$headerEncoded.$payloadEncoded.$signature';
  }

  /// Base64 URL encode string without padding
  String _base64UrlEncode(String input) {
    final bytes = utf8.encode(input);
    final base64 = base64Encode(bytes);
    return base64
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
  }

  /// Base64 URL encode bytes without padding
  String _base64UrlEncodeBytes(List<int> bytes) {
    final base64 = base64Encode(bytes);
    return base64
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
  }

  /// Get ZainCash transaction status
  Future<PaymentResponse> _getZainCashStatus(String transactionId) async {
    final response = await http.get(
      Uri.parse('${getBaseUrl(PaymentProvider.zainCash)}/transaction/status/$transactionId'),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return PaymentResponse(
        transactionId: data['transaction_id'] as String,
        redirectUrl: '',
        deepLink: null,
        status: _parseStatus(data['status'] as String),
        provider: PaymentProvider.zainCash,
      );
    } else {
      throw _handleError(response, PaymentProvider.zainCash);
    }
  }

  /// Get FastPay payment status
  Future<PaymentResponse> _getFastPayStatus(String paymentId) async {
    final config = configs[PaymentProvider.fastPay];
    if (config == null) {
      throw MesopotamiaError(
        message: 'FastPay not configured',
        code: 'NOT_CONFIGURED',
        provider: PaymentProvider.fastPay,
      );
    }

    final basicAuth = base64Encode(utf8.encode('${config.apiKey}:${config.apiSecret}'));

    final response = await http.get(
      Uri.parse('${getBaseUrl(PaymentProvider.fastPay)}/payment/status/$paymentId'),
      headers: {
        'Authorization': 'Basic $basicAuth',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return PaymentResponse(
        transactionId: data['payment_id'] as String,
        redirectUrl: '',
        deepLink: null,
        status: _parseStatus(data['status'] as String),
        provider: PaymentProvider.fastPay,
      );
    } else {
      throw _handleError(response, PaymentProvider.fastPay);
    }
  }

  /// Get FIB payment status
  Future<PaymentResponse> _getFIBStatus(String paymentId) async {
    final config = configs[PaymentProvider.fib];
    if (config == null) {
      throw MesopotamiaError(
        message: 'FIB not configured',
        code: 'NOT_CONFIGURED',
        provider: PaymentProvider.fib,
      );
    }

    // Get OAuth token
    final token = await _getFIBToken(config);

    final response = await http.get(
      Uri.parse('${getBaseUrl(PaymentProvider.fib)}/payment/status/$paymentId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return PaymentResponse(
        transactionId: data['payment_id'] as String,
        redirectUrl: '',
        deepLink: null,
        status: _parseStatus(data['status'] as String),
        provider: PaymentProvider.fib,
      );
    } else {
      throw _handleError(response, PaymentProvider.fib);
    }
  }

  /// Parse status string to PaymentStatus enum
  PaymentStatus _parseStatus(String status) {
    return PaymentStatus.values.firstWhere(
      (e) => e.name == status,
      orElse: () => PaymentStatus.pending,
    );
  }
}
