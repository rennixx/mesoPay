import 'package:flutter/material.dart';
import 'package:mesopotamia_sdk/mesopotamia_sdk.dart';

void main() {
  runApp(const MesopotamiaExampleApp());
}

class MesopotamiaExampleApp extends StatelessWidget {
  const MesopotamiaExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mesopotamia SDK Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with DeepLinkHandlerMixin {
  late final MesopotamiaSDK sdk;
  PaymentResponse? lastPayment;
  bool isLoading = false;
  String? errorMessage;

  // Form controllers
  final amountController = TextEditingController(text: '50000');
  final orderIdController = TextEditingController(text: 'ORDER_001');
  final callbackUrlController = TextEditingController(
    text: 'myapp://payment/callback',
  );

  @override
  void initState() {
    super.initState();

    // Initialize SDK with sandbox credentials
    sdk = MesopotamiaSDK(
      environment: Environment.sandbox,
      providers: {
        PaymentProvider.zainCash: ProviderConfig(
          merchantId: '5c9c8c7e-f3f1-4f3e-9e3e-3e9f3e9f3e9f',
          apiKey: 'test-api-key',
          apiSecret: 'sandbox_secret_zaincash',
          baseUrl: 'http://localhost:8080/zaincash',
        ),
        PaymentProvider.fastPay: ProviderConfig(
          merchantId: 'store123',
          apiKey: 'store123',
          apiSecret: 'pass123',
          baseUrl: 'http://localhost:8080/fastpay',
        ),
        PaymentProvider.fib: ProviderConfig(
          merchantId: 'client123',
          apiKey: 'client123',
          apiSecret: 'secret123',
          baseUrl: 'http://localhost:8080/fib',
        ),
      },
      enableLogging: true,
    );

    // Initialize deep link handler
    initDeepLinkHandler(sdk);
    subscribeToDeepLinks();
  }

  @override
  void handlePaymentResult(DeepLinkResult result) {
    setState(() {
      isLoading = false;
      lastPayment = result.toPaymentResponse();
    });

    // Show result dialog
    if (mounted) {
      showDialog(
        context: context,
        builder: (context) => PaymentResultDialog(result: result),
      );
    }
  }

  Future<void> _showPaymentSheet(PaymentProvider provider) async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final amount = int.tryParse(amountController.text) ?? 0;
      if (amount <= 0) {
        throw Exception('يرجى إدخال مبلغ صحيح');
      }

      final request = PaymentRequest(
        provider: provider,
        amount: amount,
        orderId: orderIdController.text,
        callbackUrl: callbackUrlController.text,
        webhookUrl: 'https://example.com/webhook',
        description: 'دفل تجريبي',
      );

      final result = await showMesopotamiaPaymentSheet(
        context: context,
        sdk: sdk,
        paymentRequest: request,
        config: const PaymentSheetConfig(
          merchantName: 'متجر تجريبي',
          primaryColor: Color(0xFF00A651),
          locale: 'ar_IQ',
        ),
      );

      if (result != null && result.completed) {
        setState(() {
          lastPayment = result.response;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mesopotamia SDK'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Icon(
                      Icons.payment,
                      size: 48,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Mesopotamia Payment Gateway',
                      style: Theme.of(context).textTheme.titleLarge,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'واجهة برمجة موحدة للدفع الإلكتروني في العراق',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Payment Form
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'بيانات الدفع',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'المبلغ (دينار)',
                        prefixText: 'IQD ',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: orderIdController,
                      decoration: const InputDecoration(
                        labelText: 'رقم الطلب',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: callbackUrlController,
                      decoration: const InputDecoration(
                        labelText: 'رابط الاستدعاء',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Provider Selection
            Text(
              'اختر بوابة الدفع',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            _buildProviderButton(
              context,
              title: 'ZainCash',
              subtitle: 'محفظة زين كاش',
              icon: Icons.account_balance_wallet,
              color: const Color(0xFF00A651),
              onTap: () => _showPaymentSheet(PaymentProvider.zainCash),
            ),
            const SizedBox(height: 12),
            _buildProviderButton(
              context,
              title: 'FastPay',
              subtitle: 'فاست باي',
              icon: Icons.payment,
              color: const Color(0xFFED1C24),
              onTap: () => _showPaymentSheet(PaymentProvider.fastPay),
            ),
            const SizedBox(height: 12),
            _buildProviderButton(
              context,
              title: 'FIB',
              subtitle: 'بنك العراق الأول',
              icon: Icons.account_balance,
              color: const Color(0xFF003366),
              onTap: () => _showPaymentSheet(PaymentProvider.fib),
            ),
            const SizedBox(height: 24),

            // Error Message
            if (errorMessage != null)
              Card(
                color: Theme.of(context).colorScheme.errorContainer,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(
                        Icons.error,
                        color: Theme.of(context).colorScheme.error,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          errorMessage!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Last Payment Result
            if (lastPayment != null)
              Card(
                color: Theme.of(context).colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.check_circle,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'تم إنشاء الدفعة بنجاح',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      _buildResultRow(
                        context,
                        'رقم المعاملة',
                        lastPayment!.transactionId,
                      ),
                      _buildResultRow(
                        context,
                        'البوابة',
                        lastPayment!.provider.name,
                      ),
                      _buildResultRow(
                        context,
                        'الحالة',
                        lastPayment!.status.name,
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProviderButton(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: isLoading ? null : onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              if (isLoading)
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else
                Icon(
                  Icons.chevron_right,
                  color: color,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResultRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }
}

class PaymentResultDialog extends StatelessWidget {
  final DeepLinkResult result;

  const PaymentResultDialog({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final isSuccess = result.status == PaymentStatus.completed;
    final color = isSuccess
        ? Theme.of(context).colorScheme.primary
        : Theme.of(context).colorScheme.error;
    final icon = isSuccess ? Icons.check_circle : Icons.error;

    return AlertDialog(
      icon: Icon(icon, size: 48, color: color),
      title: Text(isSuccess ? 'تم الدفعة بنجاح' : 'فشلت الدفعة'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDetail(context, 'رقم المعاملة', result.transactionId),
          _buildDetail(context, 'الحالة', _getStatusText(result.status)),
          _buildDetail(context, 'البوابة', result.provider.name),
          if (result.metadata != null && result.metadata!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'بيانات إضافية:',
              style: Theme.of(context).textTheme.labelMedium,
            ),
            ...result.metadata!.entries.map(
              (e) => _buildDetail(context, e.key, e.value),
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('إغلاق'),
        ),
      ],
    );
  }

  Widget _buildDetail(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }

  String _getStatusText(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.completed:
        return 'مكتمل';
      case PaymentStatus.failed:
        return 'فشل';
      case PaymentStatus.pending:
        return 'قيد الانتظار';
      case PaymentStatus.cancelled:
        return 'ملغي';
      case PaymentStatus.expired:
        return 'منتهي';
    }
  }
}
