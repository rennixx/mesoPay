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

  /// Background color
  final Color backgroundColor;

  const SimpleCardPaymentForm({
    super.key,
    required this.amount,
    this.currency = 'IQD',
    this.onSubmit,
    this.primaryColor = const Color(0xFF6366F1),
    this.backgroundColor = Colors.white,
  });

  @override
  State<SimpleCardPaymentForm> createState() => _SimpleCardPaymentFormState();
}

class CardData {
  final String cardNumber;
  final String expDate;
  final String cvv;
  final String cardHolder;
  final CardType cardType;

  CardData({
    required this.cardNumber,
    required this.expDate,
    required this.cvv,
    required this.cardHolder,
    required this.cardType,
  });

  bool get isValid =>
      cardNumber.replaceAll(' ', '').length >= 16 &&
      expDate.length == 5 &&
      cvv.length >= 3 &&
      cardHolder.isNotEmpty;
}

class _SimpleCardPaymentFormState extends State<SimpleCardPaymentForm> {
  final _cardNumberController = TextEditingController();
  final _expDateController = TextEditingController();
  final _cvvController = TextEditingController();
  final _holderController = TextEditingController();

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
    _holderController.dispose();
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

    if (cleanNumber.startsWith('4')) return CardType.visa;
    if (cleanNumber.startsWith('5')) return CardType.mastercard;

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
      cardHolder: _holderController.text,
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
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: widget.backgroundColor,
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
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Card Details',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1F2937),
                  letterSpacing: -0.5,
                ),
              ),
              _buildCardIcons(),
            ],
          ),
          const SizedBox(height: 24),

          // Card Holder
          _buildLabel('Card Holder Name'),
          const SizedBox(height: 8),
          _buildTextField(
            controller: _holderController,
            hint: 'e.g. John Doe',
            icon: Icons.person_outline,
          ),
          const SizedBox(height: 16),

          // Card Number
          _buildLabel('Card Number'),
          const SizedBox(height: 8),
          _buildCardNumberField(),
          const SizedBox(height: 16),

          // Row for Exp & CVV
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel('Expiry Date'),
                    const SizedBox(height: 8),
                    _buildExpDateField(),
                  ],
                ),
              ),
              const SizedBox(width: 12),
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

          const SizedBox(height: 32),
          _buildPayButton(),
          const SizedBox(height: 20),
          _buildFooter(),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Color(0xFF6B7280),
      ),
    );
  }

  Widget _buildCardIcons() {
    return Row(
      children: [
        _buildIconBox(CardType.visa),
        const SizedBox(width: 8),
        _buildIconBox(CardType.mastercard),
      ],
    );
  }

  Widget _buildIconBox(CardType type) {
    final isActive =
        _detectedCardType == type || _detectedCardType == CardType.unknown;
    final isSelected = _detectedCardType == type;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isSelected ? Colors.grey.shade50 : Colors.white,
        border: Border.all(
          color: isSelected ? widget.primaryColor : const Color(0xFFE5E7EB),
          width: isSelected ? 1.5 : 1,
        ),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Opacity(
        opacity: isActive ? 1.0 : 0.3,
        child: type == CardType.visa
            ? const Text('VISA',
                style: TextStyle(
                    color: Color(0xFF1A1F71),
                    fontWeight: FontWeight.w900,
                    fontStyle: FontStyle.italic,
                    fontSize: 10))
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                          color: Color(0xFFEB001B), shape: BoxShape.circle)),
                  Transform.translate(
                    offset: const Offset(-3, 0),
                    child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                            color: const Color(0xFFF79E1B).withOpacity(0.8),
                            shape: BoxShape.circle)),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
  }) {
    return TextField(
      controller: controller,
      decoration: _inputDecoration(hint: hint, icon: icon),
      style: const TextStyle(fontSize: 15, color: Color(0xFF1F2937)),
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
      decoration: _inputDecoration(
          hint: '0000 0000 0000 0000', icon: Icons.credit_card),
      style: const TextStyle(
          fontSize: 15, color: Color(0xFF1F2937), letterSpacing: 1),
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
      decoration:
          _inputDecoration(hint: 'MM/YY', icon: Icons.calendar_today_outlined),
      style: const TextStyle(fontSize: 15, color: Color(0xFF1F2937)),
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
      decoration: _inputDecoration(hint: '***', icon: Icons.lock_outline),
      style: const TextStyle(fontSize: 15, color: Color(0xFF1F2937)),
    );
  }

  InputDecoration _inputDecoration(
      {required String hint, required IconData icon}) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, size: 20, color: const Color(0xFF9CA3AF)),
      hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: widget.primaryColor, width: 2),
      ),
    );
  }

  Widget _buildPayButton() {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: LinearGradient(
          colors: [widget.primaryColor, widget.primaryColor.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: widget.primaryColor.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleSubmit,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.white),
              )
            : Text(
                'Pay ${_formatAmount()}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }

  Widget _buildFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.lock, size: 14, color: Colors.grey.shade400),
        const SizedBox(width: 6),
        Text(
          'Secured by MesoPay',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade400,
          ),
        ),
      ],
    );
  }
}

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
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
      TextEditingValue oldValue, TextEditingValue newValue) {
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
