import 'package:flutter/material.dart';
import 'package:mesopotamia_sdk/src/ui/simple_card_form.dart';
import 'package:mesopotamia_sdk/src/ui/wallet_payment_widget.dart';

void main() {
  runApp(const MesoPayDemoApp());
}

class MesoPayDemoApp extends StatelessWidget {
  const MesoPayDemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MesoPay',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6C5CE7)),
        useMaterial3: true,
      ),
      home: const PaymentDemoPage(),
    );
  }
}

class PaymentDemoPage extends StatefulWidget {
  const PaymentDemoPage({super.key});

  @override
  State<PaymentDemoPage> createState() => _PaymentDemoPageState();
}

class _PaymentDemoPageState extends State<PaymentDemoPage> {
  int _selectedTab = 0; // 0 = Card, 1 = Wallet
  int _selectedWallet = 0; // 0 = FastPay, 1 = FIB

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Constrained width container
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // MesoPay Logo
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16, left: 4),
                        child: Image.network(
                          'mesopay_logo.png',
                          height: 32,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              height: 32,
                              width: 100,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF6C5CE7), Color(0xFFA29BFE)],
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Center(
                                child: Text(
                                  'MesoPay',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                      // Payment method tabs
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2D2D44),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: _buildTab(
                                'Card',
                                Icons.credit_card,
                                0,
                              ),
                            ),
                            Expanded(
                              child: _buildTab(
                                'Wallet',
                                Icons.account_balance_wallet,
                                1,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Payment form based on selection
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: _selectedTab == 0
                            ? _buildCardPayment()
                            : _buildWalletPayment(),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Security badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.lock_outline,
                      size: 14,
                      color: Colors.grey.shade500,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Secured with SSL encryption',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTab(String label, IconData icon, int index) {
    final isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF6C5CE7) : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? Colors.white : Colors.grey.shade400,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: isSelected ? Colors.white : Colors.grey.shade400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardPayment() {
    return SimpleCardPaymentForm(
      key: const ValueKey('card'),
      amount: 50000,
      currency: 'IQD',
      primaryColor: const Color(0xFF6C5CE7),
      onSubmit: (data) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Processing ${data.cardType.name} card ending in ${data.cardNumber.substring(data.cardNumber.length - 4)}...',
            ),
            backgroundColor: const Color(0xFF6C5CE7),
          ),
        );
      },
    );
  }

  Widget _buildWalletPayment() {
    return Column(
      key: const ValueKey('wallet'),
      children: [
        // Wallet selector
        _buildWalletSelector(),
        const SizedBox(height: 16),

        // Selected wallet payment widget
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: _selectedWallet == 0
              ? _buildFastPayWidget()
              : _buildFIBWidget(),
        ),
      ],
    );
  }

  Widget _buildWalletSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
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
        children: [
          const Text(
            'Choose wallet',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Color(0xFF636E72),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              // FastPay option
              Expanded(
                child: _buildWalletOption(
                  index: 0,
                  logo: Image.network(
                    'fastpay_logo.png',
                    height: 20,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Text(
                      'FastPay',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFED1C24),
                      ),
                    ),
                  ),
                  activeColor: const Color(0xFFED1C24),
                ),
              ),
              const SizedBox(width: 12),
              // FIB option
              Expanded(
                child: _buildWalletOption(
                  index: 1,
                  logo: Image.network(
                    'fib_logo.png',
                    height: 20,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Text(
                      'FIB',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00A651),
                      ),
                    ),
                  ),
                  activeColor: const Color(0xFF00A651),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWalletOption({
    required int index,
    required Widget logo,
    required Color activeColor,
  }) {
    final isSelected = _selectedWallet == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedWallet = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withAlpha(20) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? activeColor : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Center(child: logo),
      ),
    );
  }

  Widget _buildFastPayWidget() {
    return WalletPaymentWidget(
      key: const ValueKey('fastpay'),
      config: WalletPaymentConfig(
        providerName: '',
        providerLogo: Image.network(
          'fastpay_logo.png',
          height: 24,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Text(
            'FastPay',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFFED1C24),
            ),
          ),
        ),
        transactionId: 'FP_${DateTime.now().millisecondsSinceEpoch}',
        amount: 50000,
        currency: 'IQD',
        primaryColor: const Color(0xFFED1C24),
        timeoutSeconds: 300,
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fast-pay.iq',
        deepLinkUrl: 'appFpp://fast-pay.cash/qrpay?transactionId=ORDER_DEMO',
        onPollStatus: (transactionId) async {
          await Future.delayed(const Duration(seconds: 1));
          return const PaymentPollResult(status: PaymentPollStatus.pending);
        },
        onPaymentConfirmed: (transactionId) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('FastPay payment confirmed!'),
              backgroundColor: Colors.green,
            ),
          );
        },
        onTimeout: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment timed out'),
              backgroundColor: Colors.orange,
            ),
          );
        },
        onCancel: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment cancelled'),
              backgroundColor: Colors.grey,
            ),
          );
        },
      ),
    );
  }

  Widget _buildFIBWidget() {
    return WalletPaymentWidget(
      key: const ValueKey('fib'),
      config: WalletPaymentConfig(
        providerName: '',
        providerLogo: Image.network(
          'fib_logo.png',
          height: 24,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Text(
            'FIB',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF00A651),
            ),
          ),
        ),
        transactionId: 'FIB_${DateTime.now().millisecondsSinceEpoch}',
        amount: 50000,
        currency: 'IQD',
        primaryColor: const Color(0xFF00A651),
        timeoutSeconds: 300,
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fib.iq',
        deepLinkUrl: 'fib://pay?transactionId=ORDER_DEMO',
        onPollStatus: (transactionId) async {
          await Future.delayed(const Duration(seconds: 1));
          return const PaymentPollResult(status: PaymentPollStatus.pending);
        },
        onPaymentConfirmed: (transactionId) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('FIB payment confirmed!'),
              backgroundColor: Colors.green,
            ),
          );
        },
        onTimeout: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment timed out'),
              backgroundColor: Colors.orange,
            ),
          );
        },
        onCancel: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment cancelled'),
              backgroundColor: Colors.grey,
            ),
          );
        },
      ),
    );
  }
}
