import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Card type enum
enum CardType { visa, mastercard, unknown }

/// Simple, beautiful card payment form
/// Minimalist design matching modern payment UX
class SimpleCardPaymentForm extends StatefulWidget {
  /// Amount to pay (in smallest unit)
  final int amount;

  /// Currency code (e.g., 'IQD', 'USD')
  final String currency;

  /// Callback when payment is submitted
  final void Function(CardData data)? onSubmit;

  /// Primary button color
  final Color primaryColor;

  const SimpleCardPaymentForm({
    super.key,
    required this.amount,
    this.currency = 'IQD',
    this.onSubmit,
    this.primaryColor = const Color(0xFF6C5CE7),
  });

  @override
  State<SimpleCardPaymentForm> createState() => _SimpleCardPaymentFormState();
}

class CardData {
  final String cardNumber;
  final String expDate;
  final String cvv;
  final CardType cardType;

  CardData({
    required this.cardNumber,
    required this.expDate,
    required this.cvv,
    required this.cardType,
  });

  bool get isValid =>
      cardNumber.replaceAll(' ', '').length >= 16 &&
      expDate.length == 5 &&
      cvv.length >= 3;
}

class _SimpleCardPaymentFormState extends State<SimpleCardPaymentForm> {
  final _cardNumberController = TextEditingController();
  final _expDateController = TextEditingController();
  final _cvvController = TextEditingController();

  bool _isLoading = false;
  CardType _detectedCardType = CardType.unknown;

  @override
  void initState() {
    super.initState();
    _cardNumberController.addListener(_onCardNumberChanged);
  }

  @override
  void dispose() {
    _cardNumberController.removeListener(_onCardNumberChanged);
    _cardNumberController.dispose();
    _expDateController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  void _onCardNumberChanged() {
    final newType = _detectCardType(_cardNumberController.text);
    if (newType != _detectedCardType) {
      setState(() {
        _detectedCardType = newType;
      });
    }
  }

  CardType _detectCardType(String number) {
    final cleanNumber = number.replaceAll(' ', '');
    if (cleanNumber.isEmpty) return CardType.unknown;

    // Visa: starts with 4
    if (cleanNumber.startsWith('4')) {
      return CardType.visa;
    }
    // Mastercard: starts with 51-55 or 2221-2720
    if (cleanNumber.startsWith('5') && cleanNumber.length >= 2) {
      final secondDigit = int.tryParse(cleanNumber[1]) ?? 0;
      if (secondDigit >= 1 && secondDigit <= 5) {
        return CardType.mastercard;
      }
    }
    if (cleanNumber.startsWith('2')) {
      if (cleanNumber.length >= 4) {
        final prefix = int.tryParse(cleanNumber.substring(0, 4)) ?? 0;
        if (prefix >= 2221 && prefix <= 2720) {
          return CardType.mastercard;
        }
      }
    }

    return CardType.unknown;
  }

  String _formatAmount() {
    final formatted = widget.amount.toString().replaceAllMapped(
          RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]},',
        );
    return '$formatted ${widget.currency}';
  }

  void _handleSubmit() {
    final data = CardData(
      cardNumber: _cardNumberController.text,
      expDate: _expDateController.text,
      cvv: _cvvController.text,
      cardType: _detectedCardType,
    );

    if (data.isValid && widget.onSubmit != null) {
      setState(() => _isLoading = true);
      widget.onSubmit!(data);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header - "Pay with"
          const Text(
            'Pay with',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Color(0xFF2D3436),
            ),
          ),
          const SizedBox(height: 16),

          // Card type icons - only Visa and Mastercard
          _buildCardIcons(),
          const SizedBox(height: 28),

          // Card number
          _buildLabel('Card number'),
          const SizedBox(height: 8),
          _buildCardNumberField(),
          const SizedBox(height: 20),

          // Exp Date & CVV Row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel('Exp Date'),
                    const SizedBox(height: 8),
                    _buildExpDateField(),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel('CVV'),
                    const SizedBox(height: 8),
                    _buildCVVField(),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),

          // Pay Button
          _buildPayButton(),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: Color(0xFF636E72),
      ),
    );
  }

  Widget _buildCardIcons() {
    return Row(
      children: [
        _buildVisaIcon(),
        const SizedBox(width: 12),
        _buildMastercardIcon(),
      ],
    );
  }

  Widget _buildVisaIcon() {
    final isActive = _detectedCardType == CardType.visa;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF1A1F71) : Colors.white,
        border: Border.all(
          color: isActive ? const Color(0xFF1A1F71) : const Color(0xFFE0E0E0),
          width: isActive ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(4),
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: const Color(0xFF1A1F71).withAlpha(80),
                  blurRadius: 8,
                  spreadRadius: 1,
                ),
              ]
            : null,
      ),
      child: Text(
        'VISA',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: isActive ? Colors.white : const Color(0xFF1A1F71),
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  Widget _buildMastercardIcon() {
    final isActive = _detectedCardType == CardType.mastercard;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 48,
      height: 32,
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFFF5F00) : Colors.white,
        border: Border.all(
          color: isActive ? const Color(0xFFFF5F00) : const Color(0xFFE0E0E0),
          width: isActive ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(4),
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: const Color(0xFFFF5F00).withAlpha(100),
                  blurRadius: 8,
                  spreadRadius: 1,
                ),
              ]
            : null,
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            left: 8,
            child: Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(
                color: Color(0xFFEB001B),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            right: 8,
            child: Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(
                color: Color(0xFFF79E1B),
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardNumberField() {
    return TextField(
      controller: _cardNumberController,
      keyboardType: TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        _CardNumberFormatter(),
        LengthLimitingTextInputFormatter(19),
      ],
      style: const TextStyle(
        fontSize: 16,
        color: Color(0xFF2D3436),
        letterSpacing: 1,
      ),
      decoration: _inputDecoration(),
    );
  }

  Widget _buildExpDateField() {
    return TextField(
      controller: _expDateController,
      keyboardType: TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        _ExpiryDateFormatter(),
        LengthLimitingTextInputFormatter(5),
      ],
      style: const TextStyle(
        fontSize: 16,
        color: Color(0xFF2D3436),
      ),
      decoration: _inputDecoration(hint: 'MM/YY'),
    );
  }

  Widget _buildCVVField() {
    return TextField(
      controller: _cvvController,
      keyboardType: TextInputType.number,
      obscureText: true,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(4),
      ],
      style: const TextStyle(
        fontSize: 16,
        color: Color(0xFF2D3436),
      ),
      decoration: _inputDecoration(hint: '•••'),
    );
  }

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        color: const Color(0xFF2D3436).withAlpha(80),
      ),
      filled: true,
      fillColor: const Color(0xFFF8F9FA),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide: BorderSide(
          color: widget.primaryColor.withAlpha(100),
          width: 2,
        ),
      ),
    );
  }

  Widget _buildPayButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleSubmit,
        style: ElevatedButton.styleFrom(
          backgroundColor: widget.primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              )
            : Text(
                'Pay ${_formatAmount()}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.3,
                ),
              ),
      ),
    );
  }
}

// Formatters
class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(text[i]);
    }
    return TextEditingValue(
      text: buffer.toString(),
      selection: TextSelection.collapsed(offset: buffer.length),
    );
  }
}

class _ExpiryDateFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll('/', '');
    final buffer = StringBuffer();
    for (int i = 0; i < text.length && i < 4; i++) {
      if (i == 2) buffer.write('/');
      buffer.write(text[i]);
    }
    return TextEditingValue(
      text: buffer.toString(),
      selection: TextSelection.collapsed(offset: buffer.length),
    );
  }
}
