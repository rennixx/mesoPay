import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:intl/intl.dart' show NumberFormat;
import '../../mesopotamia_sdk.dart';

/// Configuration for the payment sheet appearance
class PaymentSheetConfig {
  /// Merchant name to display
  final String merchantName;

  /// Merchant logo URL (optional)
  final String? merchantLogoUrl;

  /// Primary color theme
  final Color primaryColor;

  /// Whether to show provider selection
  final bool showProviderSelection;

  /// Available providers for selection
  final List<PaymentProvider> availableProviders;

  /// Default selected provider
  final PaymentProvider? defaultProvider;

  /// Custom locale for formatting (default is 'ar_IQ')
  final String locale;

  const PaymentSheetConfig({
    required this.merchantName,
    this.merchantLogoUrl,
    this.primaryColor = Colors.blue,
    this.showProviderSelection = true,
    this.availableProviders = PaymentProvider.values,
    this.defaultProvider,
    this.locale = 'ar_IQ',
  });
}

/// Result from payment sheet
class PaymentSheetResult {
  /// Whether payment was completed
  final bool completed;

  /// Payment response if successful
  final PaymentResponse? response;

  /// Error message if failed
  final String? errorMessage;

  const PaymentSheetResult({
    required this.completed,
    this.response,
    this.errorMessage,
  });
}

/// Payment Sheet UI Component
/// A bottom sheet modal for payment processing with provider selection
class MesopotamiaPaymentSheet extends StatefulWidget {
  final MesopotamiaSDK sdk;
  final PaymentRequest paymentRequest;
  final PaymentSheetConfig config;

  const MesopotamiaPaymentSheet({
    super.key,
    required this.sdk,
    required this.paymentRequest,
    this.config = const PaymentSheetConfig(
      merchantName: 'Merchant',
    ),
  });

  @override
  State<MesopotamiaPaymentSheet> createState() => _MesopotamiaPaymentSheetState();
}

class _MesopotamiaPaymentSheetState extends State<MesopotamiaPaymentSheet> {
  PaymentProvider? _selectedProvider;
  bool _isProcessing = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _selectedProvider = widget.config.defaultProvider ??
        (widget.config.availableProviders.isNotEmpty
            ? widget.config.availableProviders.first
            : PaymentProvider.zainCash);
  }

  Future<void> _processPayment() async {
    if (_selectedProvider == null) return;

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    try {
      final request = PaymentRequest(
        provider: _selectedProvider!,
        amount: widget.paymentRequest.amount,
        orderId: widget.paymentRequest.orderId,
        callbackUrl: widget.paymentRequest.callbackUrl,
        webhookUrl: widget.paymentRequest.webhookUrl,
        metadata: widget.paymentRequest.metadata,
        description: widget.paymentRequest.description,
      );

      final response = await widget.sdk.createPayment(request);

      if (mounted) {
        // Navigate to payment URL
        // On web, use redirectUrl instead of deepLink (custom URL schemes don't work in browsers)
        final url = kIsWeb || response.deepLink == null || response.deepLink!.isEmpty
            ? response.redirectUrl
            : response.deepLink!;
        await widget.sdk.launchPaymentUrl(url);

        // Poll for payment status update
        // Give user 60 seconds to complete payment
        final startTime = DateTime.now();
        const timeout = Duration(seconds: 60);
        const pollInterval = Duration(seconds: 2);

        PaymentResponse? finalResponse;
        while (DateTime.now().difference(startTime) < timeout) {
          await Future.delayed(pollInterval);

          try {
            final status = await widget.sdk.getPaymentStatus(
              provider: response.provider,
              transactionId: response.transactionId,
            );

            // Update response with latest status
            finalResponse = PaymentResponse(
              transactionId: response.transactionId,
              redirectUrl: response.redirectUrl,
              deepLink: response.deepLink,
              status: status.status,
              provider: response.provider,
            );

            if (status.status == PaymentStatus.completed ||
                status.status == PaymentStatus.failed ||
                status.status == PaymentStatus.cancelled) {
              break;
            }
          } catch (e) {
            // Continue polling on error
            continue;
          }
        }

        // Use final response if we got one, otherwise use original
        final resultResponse = finalResponse ?? response;

        // Close sheet with result
        if (mounted) {
          Navigator.of(context).pop(PaymentSheetResult(
            completed: resultResponse.status == PaymentStatus.completed,
            response: resultResponse,
            errorMessage: resultResponse.status != PaymentStatus.completed
                ? 'Payment ${resultResponse.status.name}'
                : null,
          ));
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isProcessing = false;
        });
      }
    }
  }

  String _formatAmount(int amount) {
    final formatter = NumberFormat.currency(
      locale: widget.config.locale,
      symbol: 'IQD',
      decimalDigits: 0,
    );
    return formatter.format(amount.toDouble());
  }

  String _getProviderName(PaymentProvider provider) {
    switch (provider) {
      case PaymentProvider.zainCash:
        return 'ZainCash';
      case PaymentProvider.fastPay:
        return 'FastPay';
      case PaymentProvider.fib:
        return 'FIB';
    }
  }

  String _getProviderDescription(PaymentProvider provider) {
    switch (provider) {
      case PaymentProvider.zainCash:
        return 'ادفع باستخدام محفظة زين كاش';
      case PaymentProvider.fastPay:
        return 'ادفع باستخدام فاست باي';
      case PaymentProvider.fib:
        return 'ادفع باستخدام بنك العراق الأول';
    }
  }

  Color _getProviderColor(PaymentProvider provider) {
    switch (provider) {
      case PaymentProvider.zainCash:
        return const Color(0xFF00A651);
      case PaymentProvider.fastPay:
        return const Color(0xFFED1C24);
      case PaymentProvider.fib:
        return const Color(0xFF003366);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.4),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                if (widget.config.merchantLogoUrl != null)
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        widget.config.merchantLogoUrl!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: widget.config.primaryColor,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.store,
                            color: theme.colorScheme.onPrimary,
                          ),
                        ),
                      ),
                    ),
                  ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.config.merchantName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (widget.paymentRequest.description != null)
                        Text(
                          widget.paymentRequest.description!,
                          style: theme.textTheme.bodySmall,
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Amount display
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: widget.config.primaryColor.withOpacity(0.1),
            ),
            child: Column(
              children: [
                Text(
                  'المبلغ المطلوب',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  _formatAmount(widget.paymentRequest.amount),
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: widget.config.primaryColor,
                  ),
                ),
              ],
            ),
          ),

          // Provider selection
          if (widget.config.showProviderSelection)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'اختر طريقة الدفع',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...widget.config.availableProviders.map((provider) =>
                      _buildProviderOption(provider, theme)),
                ],
              ),
            ),

          // Error message
          if (_errorMessage != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    color: theme.colorScheme.error,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: theme.colorScheme.error),
                    ),
                  ),
                ],
              ),
            ),

          // Action buttons
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isProcessing
                        ? null
                        : () => Navigator.of(context).pop(),
                    child: const Text('إلغاء'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _isProcessing ? null : _processPayment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: widget.config.primaryColor,
                      foregroundColor: theme.colorScheme.onPrimary,
                    ),
                    child: _isProcessing
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('ادفع الآن'),
                  ),
                ),
              ],
            ),
          ),

          // Secure payment notice
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.lock_outline,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 4),
                Text(
                  'دفع آمن ومشفر',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProviderOption(PaymentProvider provider, ThemeData theme) {
    final isSelected = _selectedProvider == provider;
    final providerColor = _getProviderColor(provider);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: _isProcessing
            ? null
            : () {
                setState(() {
                  _selectedProvider = provider;
                });
              },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(
              color: isSelected ? providerColor : theme.dividerColor,
              width: isSelected ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(12),
            color: isSelected
                ? providerColor.withOpacity(0.1)
                : theme.colorScheme.surface,
          ),
          child: Row(
            children: [
              // Provider icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: providerColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    _getProviderName(provider)[0],
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Provider info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getProviderName(provider),
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      _getProviderDescription(provider),
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              // Selection indicator
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected ? providerColor : theme.dividerColor,
                    width: 2,
                  ),
                ),
                child: isSelected
                    ? Center(
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: providerColor,
                          ),
                        ),
                      )
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Show payment sheet as a modal bottom sheet
Future<PaymentSheetResult?> showMesopotamiaPaymentSheet({
  required BuildContext context,
  required MesopotamiaSDK sdk,
  required PaymentRequest paymentRequest,
  PaymentSheetConfig config = const PaymentSheetConfig(
    merchantName: 'Merchant',
  ),
}) {
  return showModalBottomSheet<PaymentSheetResult>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => MesopotamiaPaymentSheet(
      sdk: sdk,
      paymentRequest: paymentRequest,
      config: config,
    ),
  );
}
