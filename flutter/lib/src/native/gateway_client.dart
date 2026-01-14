import 'dart:ffi';
import 'dart:convert';
import 'package:ffi/ffi.dart';
import '../../mesopotamia_sdk.dart';

/// FFI bindings to Mesopotamia Rust core
///
/// This class provides the interface between Dart and the native Rust library.
/// It uses Dart FFI to call native functions.
class MesopotamiaFFI {
  /// Native library handle
  static DynamicLibrary? _lib;

  /// Get the native library
  static DynamicLibrary get _library {
    _lib ??= _openLibrary();
    return _lib!;
  }

  /// Open the appropriate native library based on platform
  static DynamicLibrary _openLibrary() {
    try {
      // Try Android
      return DynamicLibrary.open('libmesopotamia.so');
    } catch (e) {
      try {
        // Try iOS
        return DynamicLibrary.open('Mesopotamia.framework/Mesopotamia');
      } catch (e2) {
        // Try Windows/Linux
        try {
          return DynamicLibrary.open('mesopotamia.dll');
        } catch (e3) {
          // Try macOS
          try {
            return DynamicLibrary.open('libmesopotamia.dylib');
          } catch (e4) {
            throw Exception('Could not open Mesopotamia native library: $e, $e2, $e3, $e4');
          }
        }
      }
    }
  }

  /// Create payment transaction
  ///
  /// Returns a JSON string containing the payment response
  static String createPayment(String requestJson) {
    final createPaymentFunc = _library.lookupFunction<
        Pointer<Utf8> Function(Pointer<Utf8>),
        Pointer<Utf8> Function(Pointer<Utf8>)>('mesopotamia_create_payment');

    final requestPtr = requestJson.toNativeUtf8();
    final resultPtr = createPaymentFunc(requestPtr.cast());

    final result = resultPtr.toDartString();

    // Free memory
    // TODO: Implement proper memory management with free_string function
    calloc.free(requestPtr);

    return result;
  }

  /// Verify webhook signature
  static bool verifyWebhook(String signature, String payload, String secret) {
    final verifyWebhookFunc = _library.lookupFunction<
        Int32 Function(Pointer<Utf8>, Pointer<Utf8>, Pointer<Utf8>),
        int Function(Pointer<Utf8>, Pointer<Utf8>, Pointer<Utf8>)>('mesopotamia_verify_webhook');

    final sigPtr = signature.toNativeUtf8();
    final payloadPtr = payload.toNativeUtf8();
    final secretPtr = secret.toNativeUtf8();

    final result = verifyWebhookFunc(sigPtr.cast(), payloadPtr.cast(), secretPtr.cast());

    calloc.free(sigPtr);
    calloc.free(payloadPtr);
    calloc.free(secretPtr);

    return result == 1;
  }

  /// Get SDK version
  static String getVersion() {
    try {
      final getVersionFunc = _library.lookupFunction<
          Pointer<Utf8> Function(),
          Pointer<Utf8> Function()>('mesopotamia_get_version');

      final resultPtr = getVersionFunc();
      final result = resultPtr.toDartString();

      return result;
    } catch (e) {
      // Fallback if function not available
      return '0.1.0';
    }
  }
}

/// Native implementation gateway client
///
/// This class handles communication with the native Rust library.
/// It will be used by the main SDK class when native FFI is available.
class NativeGatewayClient {
  /// Create a payment transaction
  static Future<PaymentResponse> createPayment(InternalPaymentRequest request) async {
    try {
      final requestJson = jsonEncode(request.toJson());
      final responseJson = MesopotamiaFFI.createPayment(requestJson);
      final responseMap = jsonDecode(responseJson) as Map<String, dynamic>;

      final internal = InternalPaymentResponse.fromJson(responseMap);
      return PaymentResponse(
        transactionId: internal.transactionId,
        redirectUrl: internal.redirectUrl,
        deepLink: internal.deepLink,
        status: internal.status,
        provider: internal.provider,
      );
    } catch (e) {
      throw MesopotamiaError(
        message: 'Failed to create payment: $e',
        code: 'FFI_ERROR',
        provider: request.provider,
      );
    }
  }

  /// Verify webhook signature
  static bool verifyWebhook(String signature, String payload, String secret) {
    return MesopotamiaFFI.verifyWebhook(signature, payload, secret);
  }

  /// Check if native library is available
  static bool get isAvailable {
    try {
      MesopotamiaFFI.getVersion();
      return true;
    } catch (e) {
      return false;
    }
  }
}
