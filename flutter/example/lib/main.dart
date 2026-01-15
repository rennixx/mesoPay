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
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6366F1),
          primary: const Color(0xFF6366F1),
        ),
        useMaterial3: true,
        fontFamily: 'Inter',
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
  bool _isSimulationMode = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Container matching web MaxWidth
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    children: [
                      _buildOrderHeader(),
                      const SizedBox(height: 24),

                      // Selection Tabs (Matching Web look)
                      _buildTabs(),
                      const SizedBox(height: 24),

                      // Dynamic Content
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        child: _selectedTab == 0
                            ? _buildCardForm()
                            : _buildWalletSelection(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                _buildPoweredBy(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOrderHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: const Center(
              child:
                  Icon(Icons.shopping_bag_outlined, color: Color(0xFF1F2937)),
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CloudSync Pro',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F2937),
                  ),
                ),
                Text(
                  'Order #CS-88901',
                  style: TextStyle(
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '50,000',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F2937),
                ),
              ),
              Text(
                'IQD',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE5E7EB).withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildTabItem('Card', Icons.credit_card, 0),
          _buildTabItem('Wallet', Icons.account_balance_wallet, 1),
        ],
      ),
    );
  }

  Widget _buildTabItem(String label, IconData icon, int index) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    )
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected
                    ? const Color(0xFF6366F1)
                    : const Color(0xFF6B7280),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: isSelected
                      ? const Color(0xFF6366F1)
                      : const Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCardForm() {
    return SimpleCardPaymentForm(
      key: const ValueKey('card'),
      amount: 50000,
      currency: 'IQD',
      onSubmit: (data) async {
        // Simulate processing
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment Successful!'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
        }
      },
    );
  }

  Widget _buildWalletSelection() {
    return Column(
      key: const ValueKey('wallet'),
      children: [
        // Grid selector for wallets
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Select Wallet',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _buildWalletGridItem('fastpay_logo.png', 'FastPay',
                      const Color(0xFFED1C24), 0),
                  const SizedBox(width: 12),
                  _buildWalletGridItem(
                      'fib_logo.png', 'FIB', const Color(0xFF00A651), 1),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Display the specific widget
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _selectedWallet == 0 ? _buildFastPay() : _buildFIB(),
        ),
      ],
    );
  }

  Widget _buildWalletGridItem(
      String logoPath, String fallbackName, Color color, int index) {
    final isSelected = _selectedWallet == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedWallet = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color:
                isSelected ? color.withOpacity(0.05) : const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : const Color(0xFFE5E7EB),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Center(
            child: Image.network(
              logoPath,
              height: 24,
              filterQuality: FilterQuality.high,
              errorBuilder: (_, __, ___) => Text(
                fallbackName,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: isSelected ? color : const Color(0xFF9CA3AF),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFastPay() {
    return WalletPaymentWidget(
      key: const ValueKey('fastpay_widget'),
      config: WalletPaymentConfig(
        providerName: 'FastPay',
        transactionId: 'FP_DEMO_123',
        amount: 50000,
        primaryColor: const Color(0xFFED1C24),
        simulationMode: _isSimulationMode,
        qrCodeUrl:
            'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=fastpay-demo',
        onPollStatus: (_) async =>
            const PaymentPollResult(status: PaymentPollStatus.pending),
        onPaymentConfirmed: (_) => print('FastPay Confirmed'),
      ),
    );
  }

  Widget _buildFIB() {
    return WalletPaymentWidget(
      key: const ValueKey('fib_widget'),
      config: WalletPaymentConfig(
        providerName: 'FIB',
        transactionId: 'FIB_DEMO_456',
        amount: 50000,
        primaryColor: const Color(0xFF00A651),
        simulationMode: _isSimulationMode,
        qrCodeUrl:
            'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=fib-demo',
        onPollStatus: (_) async =>
            const PaymentPollResult(status: PaymentPollStatus.pending),
        onPaymentConfirmed: (_) => print('FIB Confirmed'),
      ),
    );
  }

  Widget _buildPoweredBy() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'Powered by',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade500,
          ),
        ),
        const SizedBox(width: 8),
        Image.network(
          'mesopay_logo_black.png',
          height: 32,
          filterQuality: FilterQuality.high,
          isAntiAlias: true,
          errorBuilder: (context, error, stackTrace) {
            return Text(
              'MesoPay',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
                color: Colors.grey.shade700,
              ),
            );
          },
        ),
      ],
    );
  }
}
