import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Wallet payment configuration
class WalletPaymentConfig {
  /// Wallet provider name (e.g., "FastPay", "FIB", "ZainCash")
  final String providerName;

  /// Provider logo/icon (small, shown next to name)
  final Widget? providerIcon;

  /// Provider logo widget (larger, for "Pay with [logo]" style header)
  final Widget? providerLogo;

  /// QR code data URL (from gateway API)
  final String? qrCodeUrl;

  /// Deep link URL to open wallet app
  final String? deepLinkUrl;

  /// Transaction ID for polling
  final String transactionId;

  /// Amount to display
  final int amount;

  /// Currency
  final String currency;

  /// Timeout in seconds (default 5 minutes)
  final int timeoutSeconds;

  /// Primary color
  final Color primaryColor;

  /// Callback to check payment status (for polling)
  final Future<PaymentPollResult> Function(String transactionId) onPollStatus;

  /// Called when payment is confirmed
  final void Function(String transactionId)? onPaymentConfirmed;

  /// Called when payment times out
  final void Function()? onTimeout;

  /// Called when user cancels
  final void Function()? onCancel;

  const WalletPaymentConfig({
    required this.providerName,
    this.providerIcon,
    this.providerLogo,
    this.qrCodeUrl,
    this.deepLinkUrl,
    required this.transactionId,
    required this.amount,
    this.currency = 'IQD',
    this.timeoutSeconds = 300,
    this.primaryColor = const Color(0xFF6C5CE7),
    required this.onPollStatus,
    this.onPaymentConfirmed,
    this.onTimeout,
    this.onCancel,
  });
}

/// Result from polling payment status
enum PaymentPollStatus { pending, completed, failed, expired }

class PaymentPollResult {
  final PaymentPollStatus status;
  final String? message;

  const PaymentPollResult({
    required this.status,
    this.message,
  });
}

/// Wallet payment widget with QR code and async polling
class WalletPaymentWidget extends StatefulWidget {
  final WalletPaymentConfig config;

  const WalletPaymentWidget({
    super.key,
    required this.config,
  });

  @override
  State<WalletPaymentWidget> createState() => _WalletPaymentWidgetState();
}

class _WalletPaymentWidgetState extends State<WalletPaymentWidget> {
  Timer? _pollTimer;
  Timer? _countdownTimer;
  int _remainingSeconds = 0;
  bool _isPolling = false;
  PaymentPollStatus _status = PaymentPollStatus.pending;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.config.timeoutSeconds;
    _startPolling();
    _startCountdown();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    // Poll every 3 seconds
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      if (_isPolling) return;
      _isPolling = true;

      try {
        final result = await widget.config.onPollStatus(
          widget.config.transactionId,
        );

        if (!mounted) return;

        setState(() {
          _status = result.status;
          _statusMessage = result.message;
        });

        if (result.status == PaymentPollStatus.completed) {
          _pollTimer?.cancel();
          _countdownTimer?.cancel();
          widget.config.onPaymentConfirmed?.call(widget.config.transactionId);
        } else if (result.status == PaymentPollStatus.failed ||
            result.status == PaymentPollStatus.expired) {
          _pollTimer?.cancel();
          _countdownTimer?.cancel();
        }
      } catch (e) {
        // Continue polling on error
      } finally {
        _isPolling = false;
      }
    });
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;

      setState(() {
        _remainingSeconds--;
      });

      if (_remainingSeconds <= 0) {
        _countdownTimer?.cancel();
        _pollTimer?.cancel();
        setState(() {
          _status = PaymentPollStatus.expired;
        });
        widget.config.onTimeout?.call();
      }
    });
  }

  String _formatTime(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  String _formatAmount() {
    final formatted = widget.config.amount.toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]},',
        );
    return '$formatted ${widget.config.currency}';
  }

  Future<void> _openInApp() async {
    if (widget.config.deepLinkUrl != null) {
      final uri = Uri.parse(widget.config.deepLinkUrl!);
      try {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } catch (e) {
        // Couldn't open app
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Could not open ${widget.config.providerName} app'),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(15),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Provider header
          _buildHeader(),
          const SizedBox(height: 20),

          // Amount
          Text(
            _formatAmount(),
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: widget.config.primaryColor,
            ),
          ),
          const SizedBox(height: 24),

          // Status-dependent content
          if (_status == PaymentPollStatus.pending) ...[
            // QR Code
            if (widget.config.qrCodeUrl != null) ...[
              _buildQrCode(),
              const SizedBox(height: 16),
              Text(
                'Scan with ${widget.config.providerName} app',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
            ],

            // Divider with "OR"
            if (widget.config.qrCodeUrl != null &&
                widget.config.deepLinkUrl != null) ...[
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: Divider(color: Colors.grey.shade300)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'OR',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: Colors.grey.shade300)),
                ],
              ),
              const SizedBox(height: 20),
            ],

            // Open in App button
            if (widget.config.deepLinkUrl != null) _buildOpenInAppButton(),

            const SizedBox(height: 24),

            // Waiting indicator
            _buildWaitingIndicator(),
          ] else if (_status == PaymentPollStatus.completed) ...[
            _buildSuccessState(),
          ] else if (_status == PaymentPollStatus.failed ||
              _status == PaymentPollStatus.expired) ...[
            _buildFailedState(),
          ],

          const SizedBox(height: 16),

          // Cancel button (only when pending)
          if (_status == PaymentPollStatus.pending)
            TextButton(
              onPressed: () {
                _pollTimer?.cancel();
                _countdownTimer?.cancel();
                widget.config.onCancel?.call();
              },
              child: Text(
                'Cancel Payment',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    // If providerLogo is set, use "Pay with [logo]" style
    if (widget.config.providerLogo != null) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'Pay with ',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Color(0xFF636E72),
            ),
          ),
          widget.config.providerLogo!,
        ],
      );
    }

    // Otherwise use icon + name style
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.config.providerIcon != null) ...[
          widget.config.providerIcon!,
          const SizedBox(width: 8),
        ],
        Text(
          'Pay with ${widget.config.providerName}',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Color(0xFF2D3436),
          ),
        ),
      ],
    );
  }

  Widget _buildQrCode() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: widget.config.qrCodeUrl != null
          ? _QrCodeWithLoading(
              url: widget.config.qrCodeUrl!,
              size: 180,
            )
          : Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Icon(
                Icons.qr_code_2,
                size: 80,
                color: Colors.grey.shade400,
              ),
            ),
    );
  }

  Widget _buildOpenInAppButton() {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton.icon(
        onPressed: _openInApp,
        icon: const Icon(Icons.open_in_new, size: 20),
        label: Text('Open in ${widget.config.providerName} App'),
        style: ElevatedButton.styleFrom(
          backgroundColor: widget.config.primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(6),
          ),
        ),
      ),
    );
  }

  Widget _buildWaitingIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      decoration: BoxDecoration(
        color: widget.config.primaryColor.withAlpha(15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: widget.config.primaryColor,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Waiting for payment...',
            style: TextStyle(
              fontSize: 14,
              color: widget.config.primaryColor,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: widget.config.primaryColor.withAlpha(30),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              _formatTime(_remainingSeconds),
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: widget.config.primaryColor,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessState() {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.check_circle,
            size: 48,
            color: Colors.green.shade600,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Payment Successful!',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3436),
          ),
        ),
        if (_statusMessage != null) ...[
          const SizedBox(height: 8),
          Text(
            _statusMessage!,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  Widget _buildFailedState() {
    final isExpired = _status == PaymentPollStatus.expired;
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: (isExpired ? Colors.orange : Colors.red).shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(
            isExpired ? Icons.timer_off : Icons.error,
            size: 48,
            color: (isExpired ? Colors.orange : Colors.red).shade600,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          isExpired ? 'Payment Expired' : 'Payment Failed',
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3436),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          isExpired
              ? 'The payment session has timed out'
              : _statusMessage ?? 'Something went wrong',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade600,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

/// QR Code widget with loading shimmer and fade-in animation
class _QrCodeWithLoading extends StatefulWidget {
  final String url;
  final double size;

  const _QrCodeWithLoading({
    required this.url,
    required this.size,
  });

  @override
  State<_QrCodeWithLoading> createState() => _QrCodeWithLoadingState();
}

class _QrCodeWithLoadingState extends State<_QrCodeWithLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _shimmerController;
  bool _isLoaded = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Stack(
        children: [
          // Shimmer loading placeholder (always rendered, hidden when loaded)
          if (!_isLoaded)
            _ShimmerPlaceholder(
              size: widget.size,
              controller: _shimmerController,
            ),

          // Actual QR code image with fade-in
          AnimatedOpacity(
            opacity: _isLoaded && !_hasError ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOut,
            child: Image.network(
              widget.url,
              width: widget.size,
              height: widget.size,
              fit: BoxFit.contain,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) {
                  // Image loaded, trigger fade-in
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted && !_isLoaded) {
                      setState(() => _isLoaded = true);
                    }
                  });
                  return child;
                }
                return const SizedBox.shrink();
              },
              errorBuilder: (context, error, stackTrace) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted && !_hasError) {
                    setState(() {
                      _hasError = true;
                      _isLoaded = true;
                    });
                  }
                });
                return const SizedBox.shrink();
              },
            ),
          ),

          // Error state
          if (_hasError)
            Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.qr_code_2,
                    size: 48,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'QR Code unavailable',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Use "Open in App" below',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade400,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _ShimmerPlaceholder extends StatelessWidget {
  final double size;
  final AnimationController controller;

  const _ShimmerPlaceholder({
    required this.size,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.qr_code_2,
            size: 48,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.grey.shade400,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Loading QR...',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }
}
