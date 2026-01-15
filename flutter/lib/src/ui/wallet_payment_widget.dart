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

  /// Set to true to show a "Simulate Success" button for testing
  final bool simulationMode;

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
    this.primaryColor = const Color(0xFF6366F1),
    this.simulationMode = false,
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
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Could not open ${widget.config.providerName} app'),
              backgroundColor: Colors.red.shade700,
            ),
          );
        }
      }
    }
  }

  void _simulateSuccess() {
    setState(() {
      _status = PaymentPollStatus.completed;
      _statusMessage = "Simulated successful payment";
    });
    _pollTimer?.cancel();
    _countdownTimer?.cancel();
    widget.config.onPaymentConfirmed?.call(widget.config.transactionId);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHeader(),
          const SizedBox(height: 16),
          _buildAmountDisplay(),
          const SizedBox(height: 24),

          // Main content area
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: _buildCurrentStateView(),
          ),

          const SizedBox(height: 24),

          // Simulation Mode Button
          if (widget.config.simulationMode &&
              _status == PaymentPollStatus.pending) ...[
            _buildSimulationBanner(),
            const SizedBox(height: 16),
          ],

          // Cancel button (only when pending)
          if (_status == PaymentPollStatus.pending)
            TextButton(
              onPressed: () {
                _pollTimer?.cancel();
                _countdownTimer?.cancel();
                widget.config.onCancel?.call();
              },
              child: Text(
                'Cancel Transaction',
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
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
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Color(0xFF6B7280),
          ),
        ),
      ],
    );
  }

  Widget _buildAmountDisplay() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Text(
        _formatAmount(),
        style: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          color: Color(0xFF1F2937),
          letterSpacing: -0.5,
        ),
      ),
    );
  }

  Widget _buildCurrentStateView() {
    switch (_status) {
      case PaymentPollStatus.pending:
        return _buildPendingState();
      case PaymentPollStatus.completed:
        return _buildSuccessState();
      case PaymentPollStatus.failed:
      case PaymentPollStatus.expired:
        return _buildFailedState();
    }
  }

  Widget _buildPendingState() {
    return Column(
      key: const ValueKey('pending'),
      children: [
        if (widget.config.qrCodeUrl != null) ...[
          _buildQrCodeView(),
          const SizedBox(height: 16),
          Text(
            'Scan this QR code in your ${widget.config.providerName} app',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 24),
        ],
        if (widget.config.deepLinkUrl != null) ...[
          _buildOpenInAppButton(),
          const SizedBox(height: 20),
        ],
        _buildWaitingBanner(),
      ],
    );
  }

  Widget _buildQrCodeView() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10),
        ],
      ),
      child: widget.config.qrCodeUrl != null
          ? _QrCodeWithLoading(url: widget.config.qrCodeUrl!, size: 180)
          : Container(
              width: 180,
              height: 180,
              color: Colors.grey.shade50,
              child: const Icon(Icons.qr_code, size: 60, color: Colors.grey),
            ),
    );
  }

  Widget _buildOpenInAppButton() {
    return Container(
      width: double.infinity,
      height: 52,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: LinearGradient(
          colors: [
            widget.config.primaryColor,
            widget.config.primaryColor.withOpacity(0.8)
          ],
        ),
      ),
      child: ElevatedButton.icon(
        onPressed: _openInApp,
        icon: const Icon(Icons.open_in_new, size: 20, color: Colors.white),
        label: Text('Open ${widget.config.providerName}'),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
    );
  }

  Widget _buildWaitingBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
      decoration: BoxDecoration(
        color: widget.config.primaryColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor:
                  AlwaysStoppedAnimation<Color>(widget.config.primaryColor),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Waiting for payment',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: widget.config.primaryColor,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: widget.config.primaryColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              _formatTime(_remainingSeconds),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: widget.config.primaryColor,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSimulationBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade200, width: 1.5),
      ),
      child: Row(
        children: [
          const Icon(Icons.science_outlined, color: Colors.amber, size: 24),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Demo Mode',
              style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.amber),
            ),
          ),
          ElevatedButton(
            onPressed: _simulateSuccess,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.amber,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child:
                const Text('Simulate Success', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessState() {
    return Column(
      key: const ValueKey('success'),
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withOpacity(0.1),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
          ),
          child: const Icon(Icons.check_circle_rounded,
              size: 40, color: Color(0xFF10B981)),
        ),
        const SizedBox(height: 20),
        const Text(
          'Payment Successful!',
          style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F2937)),
        ),
        if (_statusMessage != null) ...[
          const SizedBox(height: 8),
          Text(
            _statusMessage!,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
          ),
        ],
      ],
    );
  }

  Widget _buildFailedState() {
    final isExpired = _status == PaymentPollStatus.expired;
    return Column(
      key: const ValueKey('failed'),
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: const Color(0xFFEF4444).withOpacity(0.1),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.2)),
          ),
          child: const Icon(Icons.error_outline_rounded,
              size: 40, color: Color(0xFFEF4444)),
        ),
        const SizedBox(height: 20),
        Text(
          isExpired ? 'Payment Expired' : 'Payment Failed',
          style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F2937)),
        ),
        const SizedBox(height: 8),
        Text(
          isExpired
              ? 'The payment session has timed out.'
              : _statusMessage ?? 'An error occurred.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        ),
      ],
    );
  }
}

class _QrCodeWithLoading extends StatefulWidget {
  final String url;
  final double size;

  const _QrCodeWithLoading({required this.url, required this.size});

  @override
  State<_QrCodeWithLoading> createState() => _QrCodeWithLoadingState();
}

class _QrCodeWithLoadingState extends State<_QrCodeWithLoading> {
  bool _isLoaded = false;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        if (!_isLoaded)
          SizedBox(
            width: widget.size,
            height: widget.size,
            child: CircularProgressIndicator(
                strokeWidth: 2, color: Colors.grey.shade300),
          ),
        Image.network(
          widget.url,
          width: widget.size,
          height: widget.size,
          loadingBuilder: (context, child, progress) {
            if (progress == null) {
              WidgetsBinding.instance.addPostFrameCallback(
                  (_) => setState(() => _isLoaded = true));
              return child;
            }
            return const SizedBox.shrink();
          },
        ),
      ],
    );
  }
}
